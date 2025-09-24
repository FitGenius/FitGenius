import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

interface OfflineAction {
  id: string;
  type: 'workout' | 'nutrition' | 'progress' | 'health';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

interface SyncStatus {
  lastSync: Date | null;
  pendingActions: number;
  isOnline: boolean;
  isSyncing: boolean;
}

class OfflineService {
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;
  private listeners: Array<(status: SyncStatus) => void> = [];
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeNetworkListener();
    this.initializeOfflineQueue();
  }

  private async initializeNetworkListener() {
    // Listen for network state changes
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // If we just came back online, attempt to sync
      if (wasOffline && this.isOnline && !this.syncInProgress) {
        this.syncOfflineActions();
      }

      this.notifyListeners();
    });

    // Get initial network state
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? false;
  }

  private async initializeOfflineQueue() {
    // Clean up old retry timeouts on app start
    const actions = await this.getPendingActions();

    // Retry failed actions with exponential backoff
    actions.forEach(action => {
      if (action.retryCount > 0) {
        this.scheduleRetry(action);
      }
    });
  }

  /**
   * Queue an action for offline execution
   */
  async queueAction(
    type: OfflineAction['type'],
    action: OfflineAction['action'],
    data: any
  ): Promise<boolean> {
    const offlineAction: OfflineAction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      action,
      data,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: 3,
    };

    try {
      // Store action in offline queue
      await this.storeAction(offlineAction);

      // If online, try to sync immediately
      if (this.isOnline) {
        this.syncOfflineActions();
      }

      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Error queuing offline action:', error);
      return false;
    }
  }

  /**
   * Sync all pending offline actions
   */
  async syncOfflineActions(): Promise<boolean> {
    if (this.syncInProgress || !this.isOnline) {
      return false;
    }

    this.syncInProgress = true;
    this.notifyListeners();

    try {
      const actions = await this.getPendingActions();
      if (actions.length === 0) {
        this.syncInProgress = false;
        this.notifyListeners();
        return true;
      }

      console.log(`Syncing ${actions.length} offline actions...`);

      // Process actions in order
      for (const action of actions) {
        try {
          const success = await this.executeAction(action);

          if (success) {
            await this.removeAction(action.id);
            this.clearRetry(action.id);
          } else {
            // Increment retry count
            action.retryCount++;

            if (action.retryCount >= action.maxRetries) {
              // Max retries reached, remove action
              await this.removeAction(action.id);
              console.warn(`Max retries reached for action ${action.id}`);
            } else {
              // Update retry count and schedule retry
              await this.updateAction(action);
              this.scheduleRetry(action);
            }
          }
        } catch (error) {
          console.error(`Error executing action ${action.id}:`, error);

          action.retryCount++;
          if (action.retryCount >= action.maxRetries) {
            await this.removeAction(action.id);
          } else {
            await this.updateAction(action);
            this.scheduleRetry(action);
          }
        }
      }

      // Update last sync time
      await AsyncStorage.setItem('last_sync', new Date().toISOString());

      this.syncInProgress = false;
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Error syncing offline actions:', error);
      this.syncInProgress = false;
      this.notifyListeners();
      return false;
    }
  }

  private async executeAction(action: OfflineAction): Promise<boolean> {
    try {
      const endpoint = this.getActionEndpoint(action);
      const method = this.getActionMethod(action.action);

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          // Add auth headers here
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          ...action.data,
          offline_sync: true,
          original_timestamp: action.timestamp.toISOString(),
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Network error executing action:', error);
      return false;
    }
  }

  private getActionEndpoint(action: OfflineAction): string {
    const baseUrl = 'https://api.fitgenius.com'; // Replace with actual API URL

    switch (action.type) {
      case 'workout':
        return `${baseUrl}/api/workouts`;
      case 'nutrition':
        return `${baseUrl}/api/nutrition`;
      case 'progress':
        return `${baseUrl}/api/progress`;
      case 'health':
        return `${baseUrl}/api/health`;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private getActionMethod(action: OfflineAction['action']): string {
    switch (action) {
      case 'create': return 'POST';
      case 'update': return 'PUT';
      case 'delete': return 'DELETE';
      default: return 'POST';
    }
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private scheduleRetry(action: OfflineAction) {
    this.clearRetry(action.id);

    // Exponential backoff: 2^retryCount * 5 seconds
    const delayMs = Math.pow(2, action.retryCount) * 5000;

    const timeout = setTimeout(() => {
      if (this.isOnline) {
        this.syncOfflineActions();
      }
    }, delayMs);

    this.retryTimeouts.set(action.id, timeout);
  }

  private clearRetry(actionId: string) {
    const timeout = this.retryTimeouts.get(actionId);
    if (timeout) {
      clearTimeout(timeout);
      this.retryTimeouts.delete(actionId);
    }
  }

  private async storeAction(action: OfflineAction): Promise<void> {
    const actions = await this.getPendingActions();
    actions.push(action);
    await AsyncStorage.setItem('offline_actions', JSON.stringify(actions));
  }

  private async updateAction(action: OfflineAction): Promise<void> {
    const actions = await this.getPendingActions();
    const index = actions.findIndex(a => a.id === action.id);

    if (index !== -1) {
      actions[index] = action;
      await AsyncStorage.setItem('offline_actions', JSON.stringify(actions));
    }
  }

  private async removeAction(actionId: string): Promise<void> {
    const actions = await this.getPendingActions();
    const filteredActions = actions.filter(a => a.id !== actionId);
    await AsyncStorage.setItem('offline_actions', JSON.stringify(filteredActions));
  }

  private async getPendingActions(): Promise<OfflineAction[]> {
    try {
      const stored = await AsyncStorage.getItem('offline_actions');
      if (!stored) return [];

      const actions = JSON.parse(stored);
      return actions.map((action: any) => ({
        ...action,
        timestamp: new Date(action.timestamp),
      }));
    } catch (error) {
      console.error('Error getting pending actions:', error);
      return [];
    }
  }

  /**
   * Cache data for offline access
   */
  async cacheData(key: string, data: any, expiryHours: number = 24): Promise<void> {
    try {
      const cacheItem = {
        data,
        timestamp: new Date().toISOString(),
        expiryHours,
      };

      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  /**
   * Get cached data
   */
  async getCachedData(key: string): Promise<any | null> {
    try {
      const cached = await AsyncStorage.getItem(`cache_${key}`);
      if (!cached) return null;

      const cacheItem = JSON.parse(cached);
      const cacheTime = new Date(cacheItem.timestamp);
      const expiryTime = new Date(cacheTime.getTime() + (cacheItem.expiryHours * 60 * 60 * 1000));

      if (new Date() > expiryTime) {
        // Cache expired
        await AsyncStorage.removeItem(`cache_${key}`);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Get offline sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    const actions = await this.getPendingActions();
    const lastSyncStr = await AsyncStorage.getItem('last_sync');

    return {
      lastSync: lastSyncStr ? new Date(lastSyncStr) : null,
      pendingActions: actions.length,
      isOnline: this.isOnline,
      isSyncing: this.syncInProgress,
    };
  }

  /**
   * Subscribe to sync status changes
   */
  addListener(callback: (status: SyncStatus) => void): () => void {
    this.listeners.push(callback);

    // Send initial status
    this.getSyncStatus().then(callback);

    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private async notifyListeners() {
    const status = await this.getSyncStatus();
    this.listeners.forEach(listener => listener(status));
  }

  /**
   * Manual sync trigger
   */
  async forcSync(): Promise<boolean> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    return await this.syncOfflineActions();
  }

  /**
   * Clear all offline data
   */
  async clearOfflineData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['offline_actions', 'last_sync']);

      // Clear all retry timeouts
      this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
      this.retryTimeouts.clear();

      this.notifyListeners();
    } catch (error) {
      console.error('Error clearing offline data:', error);
    }
  }

  /**
   * Get network status
   */
  getNetworkStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Smart fetch - tries network first, falls back to cache
   */
  async smartFetch(
    url: string,
    cacheKey: string,
    options: RequestInit = {}
  ): Promise<any> {
    if (this.isOnline) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Authorization': `Bearer ${await this.getAuthToken()}`,
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        if (response.ok) {
          const data = await response.json();

          // Cache the data
          await this.cacheData(cacheKey, data);

          return data;
        }
      } catch (error) {
        console.warn('Network request failed, falling back to cache:', error);
      }
    }

    // Fall back to cached data
    const cachedData = await this.getCachedData(cacheKey);
    if (cachedData) {
      console.log('Using cached data for:', cacheKey);
      return cachedData;
    }

    throw new Error('No data available offline');
  }
}

export const offlineService = new OfflineService();