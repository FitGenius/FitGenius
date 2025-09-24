/**
 * Real-time Synchronization Engine
 * Handles bidirectional sync between local IndexedDB and server
 */

import { offlineStorage, SyncableEntity } from './offline-storage';
import { conflictResolver } from './conflict-resolver';

interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  entityId: string;
  data: any;
  timestamp: Date;
  retryCount: number;
  tenantId: string;
}

interface SyncResult {
  success: boolean;
  synced: number;
  conflicts: number;
  errors: number;
  lastSyncTimestamp: Date;
}

interface ServerChangeLog {
  id: string;
  entityType: string;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: Date;
  version: number;
}

class SyncEngine {
  private syncInProgress = false;
  private syncIntervalId: NodeJS.Timeout | null = null;
  private websocket: WebSocket | null = null;
  private retryTimeouts = new Map<string, NodeJS.Timeout>();
  private listeners = new Map<string, Set<Function>>();

  // Configuration
  private readonly maxRetries = 5;
  private readonly retryDelays = [1000, 2000, 5000, 10000, 30000]; // Exponential backoff
  private readonly syncInterval = 30000; // 30 seconds
  private readonly batchSize = 50;

  async initialize(tenantId: string): Promise<void> {
    await offlineStorage.init();
    await this.setupWebSocket(tenantId);
    this.startPeriodicSync();
  }

  private async setupWebSocket(tenantId: string): Promise<void> {
    if (typeof window === 'undefined') return;

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'}/sync/${tenantId}`;

    try {
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log('WebSocket connected for real-time sync');
        this.emit('sync:connected');
      };

      this.websocket.onmessage = (event) => {
        this.handleRealTimeUpdate(JSON.parse(event.data));
      };

      this.websocket.onclose = () => {
        console.log('WebSocket disconnected, attempting reconnect...');
        setTimeout(() => this.setupWebSocket(tenantId), 5000);
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
    }
  }

  private handleRealTimeUpdate(update: ServerChangeLog): void {
    this.applyServerChange(update);
    this.emit('sync:update', update);
  }

  private startPeriodicSync(): void {
    this.syncIntervalId = setInterval(() => {
      if (navigator.onLine) {
        this.performFullSync();
      }
    }, this.syncInterval);

    // Sync when connection is restored
    window.addEventListener('online', () => {
      this.performFullSync();
    });
  }

  async performFullSync(): Promise<SyncResult> {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping');
      return {
        success: false,
        synced: 0,
        conflicts: 0,
        errors: 0,
        lastSyncTimestamp: new Date()
      };
    }

    this.syncInProgress = true;
    this.emit('sync:started');

    try {
      const result = await this.executeSyncCycle();
      this.emit('sync:completed', result);
      return result;
    } catch (error) {
      console.error('Sync failed:', error);
      this.emit('sync:error', error);
      return {
        success: false,
        synced: 0,
        conflicts: 0,
        errors: 1,
        lastSyncTimestamp: new Date()
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  private async executeSyncCycle(): Promise<SyncResult> {
    let synced = 0;
    let conflicts = 0;
    let errors = 0;

    // Step 1: Push local changes to server
    const localChanges = await this.getLocalChanges();
    for (const batch of this.createBatches(localChanges, this.batchSize)) {
      const pushResult = await this.pushChangesToServer(batch);
      synced += pushResult.synced;
      conflicts += pushResult.conflicts;
      errors += pushResult.errors;
    }

    // Step 2: Pull changes from server
    const lastSyncTimestamp = await offlineStorage.getMetadata('lastSyncTimestamp');
    const serverChanges = await this.pullChangesFromServer(lastSyncTimestamp);

    for (const change of serverChanges) {
      try {
        await this.applyServerChange(change);
        synced++;
      } catch (error) {
        console.error('Failed to apply server change:', error);
        errors++;
      }
    }

    // Step 3: Update sync timestamp
    await offlineStorage.setMetadata('lastSyncTimestamp', new Date());

    return {
      success: errors === 0,
      synced,
      conflicts,
      errors,
      lastSyncTimestamp: new Date()
    };
  }

  private async getLocalChanges(): Promise<SyncOperation[]> {
    const syncQueue = await offlineStorage.getSyncQueue();
    return syncQueue.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private async pushChangesToServer(operations: SyncOperation[]): Promise<{
    synced: number;
    conflicts: number;
    errors: number;
  }> {
    try {
      const response = await fetch('/api/sync/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ operations }),
      });

      if (!response.ok) {
        throw new Error('Server push failed');
      }

      const result = await response.json();

      // Remove successfully synced operations from queue
      for (const op of result.succeeded) {
        await offlineStorage.removeFromSyncQueue(op.id);
      }

      // Handle conflicts
      for (const conflict of result.conflicts) {
        await this.handleSyncConflict(conflict);
      }

      // Retry failed operations
      for (const failed of result.failed) {
        await this.scheduleRetry(failed);
      }

      return {
        synced: result.succeeded.length,
        conflicts: result.conflicts.length,
        errors: result.failed.length,
      };
    } catch (error) {
      console.error('Push to server failed:', error);
      return { synced: 0, conflicts: 0, errors: operations.length };
    }
  }

  private async pullChangesFromServer(since?: Date): Promise<ServerChangeLog[]> {
    try {
      const url = new URL('/api/sync/pull', window.location.origin);
      if (since) {
        url.searchParams.set('since', since.toISOString());
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error('Server pull failed');
      }

      const result = await response.json();
      return result.changes || [];
    } catch (error) {
      console.error('Pull from server failed:', error);
      return [];
    }
  }

  private async applyServerChange(change: ServerChangeLog): Promise<void> {
    const { entityType, entityId, operation, data } = change;

    switch (entityType) {
      case 'workout':
        await this.applyWorkoutChange(operation, entityId, data);
        break;
      case 'exercise':
        await this.applyExerciseChange(operation, entityId, data);
        break;
      case 'set':
        await this.applySetChange(operation, entityId, data);
        break;
      case 'user':
        await this.applyUserChange(operation, entityId, data);
        break;
    }
  }

  private async applyWorkoutChange(operation: string, id: string, data: any): Promise<void> {
    switch (operation) {
      case 'create':
      case 'update':
        await offlineStorage.saveWorkout({
          ...data,
          syncStatus: 'synced' as const,
          lastModified: new Date(data.lastModified),
        });
        break;
      case 'delete':
        await offlineStorage.deleteWorkout(id);
        break;
    }
  }

  private async applyExerciseChange(operation: string, id: string, data: any): Promise<void> {
    switch (operation) {
      case 'create':
      case 'update':
        await offlineStorage.saveExercise({
          ...data,
          syncStatus: 'synced' as const,
          lastModified: new Date(data.lastModified),
        });
        break;
      case 'delete':
        // Mark as deleted in local storage
        break;
    }
  }

  private async applySetChange(operation: string, id: string, data: any): Promise<void> {
    switch (operation) {
      case 'create':
      case 'update':
        await offlineStorage.saveSet({
          ...data,
          syncStatus: 'synced' as const,
          lastModified: new Date(data.lastModified),
        });
        break;
      case 'delete':
        // Mark as deleted in local storage
        break;
    }
  }

  private async applyUserChange(operation: string, id: string, data: any): Promise<void> {
    switch (operation) {
      case 'create':
      case 'update':
        await offlineStorage.saveUser({
          ...data,
          syncStatus: 'synced' as const,
          lastModified: new Date(data.lastModified),
        });
        break;
    }
  }

  private async handleSyncConflict(conflict: any): Promise<void> {
    const resolution = await conflictResolver.resolve(conflict);

    if (resolution.action === 'use_local') {
      // Re-queue the local change
      await offlineStorage.addToSyncQueue({
        id: `retry_${conflict.entityId}_${Date.now()}`,
        type: conflict.type,
        entity: conflict.entityType,
        entityId: conflict.entityId,
        data: conflict.localData,
        timestamp: new Date(),
        retryCount: 0,
      });
    } else if (resolution.action === 'use_server') {
      // Apply server data
      await this.applyServerChange(conflict.serverData);
    } else if (resolution.action === 'merge') {
      // Apply merged data
      const mergedData = await conflictResolver.merge(conflict);
      await this.applyServerChange({
        ...conflict.serverData,
        data: mergedData,
      });
    }
  }

  private async scheduleRetry(operation: SyncOperation): Promise<void> {
    if (operation.retryCount >= this.maxRetries) {
      console.error('Max retries exceeded for operation:', operation);
      return;
    }

    const delay = this.retryDelays[Math.min(operation.retryCount, this.retryDelays.length - 1)];

    const timeoutId = setTimeout(async () => {
      try {
        operation.retryCount++;
        await this.pushChangesToServer([operation]);
      } catch (error) {
        console.error('Retry failed:', error);
        await this.scheduleRetry(operation);
      } finally {
        this.retryTimeouts.delete(operation.id);
      }
    }, delay);

    this.retryTimeouts.set(operation.id, timeoutId);
  }

  // Public methods for adding changes to sync queue
  async queueWorkoutChange(type: 'create' | 'update' | 'delete', workoutId: string, data: any): Promise<void> {
    await offlineStorage.addToSyncQueue({
      id: `workout_${type}_${workoutId}_${Date.now()}`,
      type,
      entity: 'workout',
      entityId: workoutId,
      data,
      timestamp: new Date(),
      retryCount: 0,
      tenantId: data.tenantId,
    });
  }

  async queueExerciseChange(type: 'create' | 'update' | 'delete', exerciseId: string, data: any): Promise<void> {
    await offlineStorage.addToSyncQueue({
      id: `exercise_${type}_${exerciseId}_${Date.now()}`,
      type,
      entity: 'exercise',
      entityId: exerciseId,
      data,
      timestamp: new Date(),
      retryCount: 0,
      tenantId: data.tenantId,
    });
  }

  async queueSetChange(type: 'create' | 'update' | 'delete', setId: string, data: any): Promise<void> {
    await offlineStorage.addToSyncQueue({
      id: `set_${type}_${setId}_${Date.now()}`,
      type,
      entity: 'set',
      entityId: setId,
      data,
      timestamp: new Date(),
      retryCount: 0,
      tenantId: data.tenantId,
    });
  }

  // Event system
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data?: any): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Event listener error:', error);
      }
    });
  }

  // Utility methods
  async getSyncStatus(): Promise<{
    isOnline: boolean;
    lastSync: Date | null;
    pendingOperations: number;
    conflicts: number;
    storageUsage: any;
  }> {
    const [lastSync, syncQueue, conflicts, storageStats] = await Promise.all([
      offlineStorage.getMetadata('lastSyncTimestamp'),
      offlineStorage.getSyncQueue(),
      offlineStorage.getUnresolvedConflicts(),
      offlineStorage.getStorageStats(),
    ]);

    return {
      isOnline: navigator.onLine,
      lastSync,
      pendingOperations: syncQueue.length,
      conflicts: conflicts.length,
      storageUsage: storageStats,
    };
  }

  async forceSyncNow(): Promise<SyncResult> {
    return await this.performFullSync();
  }

  destroy(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }

    this.retryTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.retryTimeouts.clear();

    if (this.websocket) {
      this.websocket.close();
    }

    this.listeners.clear();
  }
}

// Singleton instance
export const syncEngine = new SyncEngine();

export type { SyncOperation, SyncResult, ServerChangeLog };