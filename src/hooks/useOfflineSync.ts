'use client';

import { useEffect, useState, useCallback } from 'react';

interface OfflineAction {
  id: string;
  type: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  data?: any;
  timestamp: number;
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Monitorar status de conexão
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);

      if (navigator.onLine) {
        // Quando voltar online, sincronizar ações pendentes
        syncPendingActions();
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Carregar ações pendentes do localStorage
    loadPendingActions();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Carregar ações pendentes do localStorage
  const loadPendingActions = () => {
    const stored = localStorage.getItem('fitgenius_pending_actions');
    if (stored) {
      try {
        setPendingActions(JSON.parse(stored));
      } catch (error) {
        console.error('Erro ao carregar ações pendentes:', error);
      }
    }
  };

  // Salvar ações pendentes no localStorage
  const savePendingActions = (actions: OfflineAction[]) => {
    localStorage.setItem('fitgenius_pending_actions', JSON.stringify(actions));
  };

  // Adicionar ação para sincronização posterior
  const addOfflineAction = useCallback((
    type: string,
    endpoint: string,
    method: 'POST' | 'PUT' | 'DELETE',
    data?: any
  ) => {
    const newAction: OfflineAction = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      endpoint,
      method,
      data,
      timestamp: Date.now()
    };

    setPendingActions(prev => {
      const updated = [...prev, newAction];
      savePendingActions(updated);
      return updated;
    });

    // Mostrar notificação ao usuário
    if (!isOnline) {
      showOfflineNotification(`Ação salva offline: ${type}`);
    }

    return newAction.id;
  }, [isOnline]);

  // Sincronizar ações pendentes
  const syncPendingActions = async () => {
    if (isSyncing || pendingActions.length === 0) return;

    setIsSyncing(true);
    const failedActions: OfflineAction[] = [];
    const successfulIds: string[] = [];

    for (const action of pendingActions) {
      try {
        const response = await fetch(action.endpoint, {
          method: action.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: action.data ? JSON.stringify(action.data) : undefined
        });

        if (response.ok) {
          successfulIds.push(action.id);
          console.log(`Ação sincronizada: ${action.type}`);
        } else {
          failedActions.push(action);
          console.error(`Falha ao sincronizar: ${action.type}`);
        }
      } catch (error) {
        console.error(`Erro ao sincronizar ação ${action.type}:`, error);
        failedActions.push(action);
      }
    }

    // Atualizar lista de ações pendentes
    setPendingActions(failedActions);
    savePendingActions(failedActions);

    if (successfulIds.length > 0) {
      showSyncSuccessNotification(successfulIds.length);
    }

    setIsSyncing(false);
  };

  // Mostrar notificação de offline
  const showOfflineNotification = (message: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('FitGenius - Modo Offline', {
        body: message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'offline-mode'
      });
    }
  };

  // Mostrar notificação de sincronização
  const showSyncSuccessNotification = (count: number) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('FitGenius - Sincronização', {
        body: `${count} ação(ões) sincronizada(s) com sucesso!`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'sync-success'
      });
    }
  };

  // Limpar ações pendentes antigas (mais de 7 dias)
  const clearOldActions = useCallback(() => {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    setPendingActions(prev => {
      const filtered = prev.filter(action => action.timestamp > sevenDaysAgo);
      savePendingActions(filtered);
      return filtered;
    });
  }, []);

  // Tentar sincronização manual
  const tryManualSync = useCallback(() => {
    if (isOnline && !isSyncing) {
      syncPendingActions();
    }
  }, [isOnline, isSyncing, pendingActions]);

  return {
    isOnline,
    isSyncing,
    pendingActionsCount: pendingActions.length,
    addOfflineAction,
    tryManualSync,
    clearOldActions
  };
}

// Hook para cachear dados localmente
export function useLocalCache<T>(key: string, fallback?: T) {
  const [data, setData] = useState<T | undefined>(fallback);
  const [lastSync, setLastSync] = useState<number>(0);

  useEffect(() => {
    // Carregar dados do cache
    const cached = localStorage.getItem(`cache_${key}`);
    const syncTime = localStorage.getItem(`cache_time_${key}`);

    if (cached) {
      try {
        setData(JSON.parse(cached));
        setLastSync(syncTime ? parseInt(syncTime) : 0);
      } catch (error) {
        console.error(`Erro ao carregar cache ${key}:`, error);
      }
    }
  }, [key]);

  const updateCache = useCallback((newData: T) => {
    setData(newData);
    const now = Date.now();
    setLastSync(now);

    // Salvar no localStorage
    localStorage.setItem(`cache_${key}`, JSON.stringify(newData));
    localStorage.setItem(`cache_time_${key}`, now.toString());
  }, [key]);

  const isCacheStale = useCallback((maxAge: number = 5 * 60 * 1000) => {
    return Date.now() - lastSync > maxAge;
  }, [lastSync]);

  const clearCache = useCallback(() => {
    localStorage.removeItem(`cache_${key}`);
    localStorage.removeItem(`cache_time_${key}`);
    setData(fallback);
    setLastSync(0);
  }, [key, fallback]);

  return {
    data,
    updateCache,
    isCacheStale,
    clearCache,
    lastSync
  };
}