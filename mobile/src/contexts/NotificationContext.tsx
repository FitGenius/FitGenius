import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { notificationService } from '../services/NotificationService';

interface NotificationContextType {
  isInitialized: boolean;
  hasPermissions: boolean;
  initializeNotifications: () => Promise<boolean>;
  scheduleWorkoutReminder: (workout: any, scheduledTime: Date) => Promise<string | null>;
  scheduleDailyMotivation: () => Promise<void>;
  sendAchievementNotification: (achievement: any) => Promise<void>;
  cancelNotification: (id: string) => Promise<void>;
  getNotificationSettings: () => Promise<any>;
  updateNotificationSettings: (settings: any) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);

  useEffect(() => {
    initializeNotifications();
    setupNotificationListeners();
  }, []);

  const initializeNotifications = async (): Promise<boolean> => {
    try {
      const success = await notificationService.initialize();
      setIsInitialized(success);
      setHasPermissions(success);

      if (success) {
        // Schedule initial notifications
        await scheduleDailyMotivation();
        await scheduleProgressReminder();
      }

      return success;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  };

  const setupNotificationListeners = () => {
    const cleanup = notificationService.setupNotificationListeners(
      (notification) => {
        // Handle notification received while app is running
        console.log('Notification received:', notification);
      },
      (response) => {
        // Handle notification interaction
        console.log('Notification interaction:', response);

        const { data } = response.notification.request.content;

        switch (data?.type) {
          case 'workout_reminder':
            // Navigate to workout screen
            break;
          case 'motivation':
            // Maybe show motivational modal
            break;
          case 'achievement':
            // Show achievement celebration
            break;
          case 'progress_update':
            // Navigate to progress screen
            break;
        }
      }
    );

    // Cleanup function will be called when component unmounts
    return cleanup;
  };

  const scheduleWorkoutReminder = async (
    workout: any,
    scheduledTime: Date
  ): Promise<string | null> => {
    try {
      if (!isInitialized) {
        console.warn('Notifications not initialized');
        return null;
      }

      const reminder = {
        id: `workout_${workout.id}_${Date.now()}`,
        title: `🏋️‍♂️ Hora do treino!`,
        body: `Seu treino "${workout.name}" está programado para agora`,
        workoutId: workout.id,
        scheduledTime,
        type: 'workout_reminder' as const,
      };

      return await notificationService.scheduleWorkoutReminder(reminder);
    } catch (error) {
      console.error('Error scheduling workout reminder:', error);
      return null;
    }
  };

  const scheduleDailyMotivation = async (): Promise<void> => {
    try {
      if (!isInitialized) return;

      await notificationService.scheduleDailyMotivation();
    } catch (error) {
      console.error('Error scheduling daily motivation:', error);
    }
  };

  const scheduleProgressReminder = async (): Promise<void> => {
    try {
      if (!isInitialized) return;

      await notificationService.scheduleProgressReminder();
    } catch (error) {
      console.error('Error scheduling progress reminder:', error);
    }
  };

  const sendAchievementNotification = async (achievement: {
    title: string;
    description: string;
    type: 'streak' | 'goal_reached' | 'personal_record' | 'milestone';
    value?: number;
  }): Promise<void> => {
    try {
      if (!isInitialized) return;

      await notificationService.sendAchievementNotification(achievement);
    } catch (error) {
      console.error('Error sending achievement notification:', error);
    }
  };

  const cancelNotification = async (id: string): Promise<void> => {
    try {
      await notificationService.cancelNotification(id);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  };

  const getNotificationSettings = async () => {
    try {
      return await notificationService.getNotificationSettings();
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return {
        workoutReminders: true,
        motivationalMessages: true,
        progressUpdates: true,
        achievementAlerts: true,
        reminderTime: '08:00',
      };
    }
  };

  const updateNotificationSettings = async (settings: any): Promise<void> => {
    try {
      await notificationService.updateNotificationSettings(settings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  };

  const contextValue: NotificationContextType = {
    isInitialized,
    hasPermissions,
    initializeNotifications,
    scheduleWorkoutReminder,
    scheduleDailyMotivation,
    sendAchievementNotification,
    cancelNotification,
    getNotificationSettings,
    updateNotificationSettings,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};