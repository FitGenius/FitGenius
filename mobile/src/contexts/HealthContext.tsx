import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { healthService, HealthData } from '../services/HealthService';
import { offlineService } from '../services/OfflineService';

interface HealthContextType {
  healthData: Partial<HealthData>;
  isLoading: boolean;
  error: string | null;
  updateHealthData: (data: Partial<HealthData>) => Promise<void>;
  refreshHealthData: () => Promise<void>;
  subscribeToSteps: (callback: (steps: number) => void) => () => void;
}

const HealthContext = createContext<HealthContextType | undefined>(undefined);

export const useHealth = (): HealthContextType => {
  const context = useContext(HealthContext);
  if (!context) {
    throw new Error('useHealth must be used within a HealthProvider');
  }
  return context;
};

interface HealthProviderProps {
  children: ReactNode;
}

export const HealthProvider: React.FC<HealthProviderProps> = ({ children }) => {
  const [healthData, setHealthData] = useState<Partial<HealthData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeHealthData();
  }, []);

  const initializeHealthData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Initialize health service
      const initialized = await healthService.initialize();
      if (!initialized) {
        setError('Não foi possível inicializar os serviços de saúde');
        return;
      }

      // Load initial health data
      await loadHealthData();
    } catch (err) {
      setError('Erro ao inicializar dados de saúde');
      console.error('Health initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHealthData = async () => {
    try {
      // Try to get fresh data from network, fallback to cache
      const data = await offlineService.smartFetch(
        '/api/health/current',
        'health_data',
        { method: 'GET' }
      );

      if (data) {
        setHealthData(data);
        return;
      }

      // If no cached data, get from device sensors
      const [todaySteps, weeklyData] = await Promise.all([
        healthService.getTodaySteps(),
        healthService.getWeeklyHealthSummary(),
      ]);

      const deviceHealthData: Partial<HealthData> = {
        steps: todaySteps,
        calories: Math.round(todaySteps * 0.04), // Estimated calories
        distance: todaySteps * 0.7, // Estimated distance in meters
      };

      setHealthData(deviceHealthData);

      // Cache the data
      await offlineService.cacheData('health_data', deviceHealthData, 1); // 1 hour cache
    } catch (err) {
      console.error('Error loading health data:', err);
      setError('Erro ao carregar dados de saúde');
    }
  };

  const updateHealthData = async (newData: Partial<HealthData>) => {
    try {
      setError(null);

      // Update local state immediately
      setHealthData(prev => ({ ...prev, ...newData }));

      // Queue for offline sync
      await offlineService.queueAction('health', 'update', {
        ...newData,
        timestamp: new Date().toISOString(),
      });

      // Sync with backend if online
      const success = await healthService.syncWithBackend(newData);

      if (!success && offlineService.getNetworkStatus()) {
        console.warn('Failed to sync health data with backend');
      }
    } catch (err) {
      console.error('Error updating health data:', err);
      setError('Erro ao atualizar dados de saúde');
    }
  };

  const refreshHealthData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await loadHealthData();
    } catch (err) {
      setError('Erro ao atualizar dados de saúde');
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToSteps = (callback: (steps: number) => void) => {
    return healthService.subscribeToSteps((steps: number) => {
      // Update local health data
      setHealthData(prev => ({
        ...prev,
        steps,
        calories: Math.round(steps * 0.04),
        distance: steps * 0.7,
      }));

      // Call the callback
      callback(steps);

      // Queue for offline sync (debounced)
      debounceStepsSync(steps);
    });
  };

  // Debounce function to avoid too many sync requests
  let stepsTimeout: NodeJS.Timeout;
  const debounceStepsSync = (steps: number) => {
    clearTimeout(stepsTimeout);
    stepsTimeout = setTimeout(() => {
      updateHealthData({
        steps,
        calories: Math.round(steps * 0.04),
        distance: steps * 0.7,
      });
    }, 5000); // Sync every 5 seconds max
  };

  const contextValue: HealthContextType = {
    healthData,
    isLoading,
    error,
    updateHealthData,
    refreshHealthData,
    subscribeToSteps,
  };

  return (
    <HealthContext.Provider value={contextValue}>
      {children}
    </HealthContext.Provider>
  );
};