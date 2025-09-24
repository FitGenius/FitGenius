import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Background task for scheduled notifications
const BACKGROUND_NOTIFICATION_TASK = 'background-notification';

// Notification types
export interface WorkoutReminder {
  id: string;
  clientId?: string;
  title: string;
  body: string;
  workoutId: string;
  scheduledTime: Date;
  type: 'workout_reminder' | 'rest_day' | 'progress_update';
}

export interface MotivationalNotification {
  id: string;
  title: string;
  body: string;
  type: 'motivation' | 'achievement' | 'streak';
  data?: any;
}

class NotificationService {
  private expoPushToken: string | null = null;
  private isInitialized = false;

  /**
   * Initialize notification service
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if device supports notifications
      if (!Device.isDevice) {
        console.warn('Push notifications are only available on physical devices');
        return false;
      }

      // Get notification permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get push notification permissions');
        return false;
      }

      // Get Expo push token
      this.expoPushToken = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Expo Push Token:', this.expoPushToken);

      // Configure notification channel (Android)
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('workouts', {
          name: 'Workout Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FFD700',
        });

        await Notifications.setNotificationChannelAsync('progress', {
          name: 'Progress Updates',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250],
          lightColor: '#4CAF50',
        });

        await Notifications.setNotificationChannelAsync('motivation', {
          name: 'Motivational',
          importance: Notifications.AndroidImportance.LOW,
        });
      }

      // Register background task
      await this.registerBackgroundTask();

      // Send token to backend
      await this.registerTokenWithBackend();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  /**
   * Register background task for notifications
   */
  private async registerBackgroundTask() {
    try {
      TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
        try {
          // Check for pending workout reminders
          await this.checkPendingReminders();

          // Check for motivational notifications
          await this.checkMotivationalNotifications();

          return BackgroundFetch.Result.NewData;
        } catch (error) {
          console.error('Background notification task error:', error);
          return BackgroundFetch.Result.Failed;
        }
      });

      await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
        minimumInterval: 15 * 60, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });
    } catch (error) {
      console.error('Error registering background task:', error);
    }
  }

  /**
   * Register push token with backend
   */
  private async registerTokenWithBackend(): Promise<void> {
    try {
      if (!this.expoPushToken) return;

      // Send token to your backend API
      const response = await fetch('/api/notifications/register-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add auth headers
        },
        body: JSON.stringify({
          token: this.expoPushToken,
          platform: Platform.OS,
          deviceId: Device.osInternalBuildId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to register push token');
      }
    } catch (error) {
      console.error('Error registering token with backend:', error);
    }
  }

  /**
   * Schedule workout reminder
   */
  async scheduleWorkoutReminder(reminder: WorkoutReminder): Promise<string | null> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: reminder.body,
          data: {
            type: reminder.type,
            workoutId: reminder.workoutId,
            clientId: reminder.clientId,
          },
          sound: 'default',
        },
        trigger: {
          date: reminder.scheduledTime,
        },
      });

      // Store notification for management
      await this.storeScheduledNotification(notificationId, reminder);

      return notificationId;
    } catch (error) {
      console.error('Error scheduling workout reminder:', error);
      return null;
    }
  }

  /**
   * Schedule daily motivational notifications
   */
  async scheduleDailyMotivation(): Promise<void> {
    try {
      const motivationalMessages = [
        {
          title: '💪 Hora do treino!',
          body: 'Seus músculos estão esperando por você. Vamos nessa!',
        },
        {
          title: '🔥 Queime calorias hoje!',
          body: 'Cada gota de suor vale a pena. Mantenha o foco!',
        },
        {
          title: '⭐ Você está indo bem!',
          body: 'Continue assim e os resultados virão naturalmente.',
        },
        {
          title: '🏆 Champions train daily',
          body: 'Consistência é a chave do sucesso. Treine hoje!',
        },
        {
          title: '🎯 Foco no objetivo',
          body: 'Lembre-se do seu "porquê" e vá treinar agora!',
        },
      ];

      // Schedule random motivational messages for the next 7 days
      for (let i = 1; i <= 7; i++) {
        const scheduleDate = new Date();
        scheduleDate.setDate(scheduleDate.getDate() + i);
        scheduleDate.setHours(8, 0, 0, 0); // 8 AM

        const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

        await Notifications.scheduleNotificationAsync({
          content: {
            title: randomMessage.title,
            body: randomMessage.body,
            data: { type: 'motivation' },
          },
          trigger: {
            date: scheduleDate,
            repeats: false,
          },
        });
      }
    } catch (error) {
      console.error('Error scheduling daily motivation:', error);
    }
  }

  /**
   * Send achievement notification
   */
  async sendAchievementNotification(achievement: {
    title: string;
    description: string;
    type: 'streak' | 'goal_reached' | 'personal_record' | 'milestone';
    value?: number;
  }): Promise<void> {
    try {
      const achievementTitles: { [key: string]: string } = {
        streak: '🔥 Sequência incrível!',
        goal_reached: '🎯 Objetivo alcançado!',
        personal_record: '💪 Novo recorde pessoal!',
        milestone: '🏆 Marco histórico!',
      };

      await Notifications.scheduleNotificationAsync({
        content: {
          title: achievementTitles[achievement.type] || '🎉 Conquista desbloqueada!',
          body: achievement.description,
          data: {
            type: 'achievement',
            achievementType: achievement.type,
            value: achievement.value,
          },
          sound: 'default',
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending achievement notification:', error);
    }
  }

  /**
   * Schedule progress update reminder
   */
  async scheduleProgressReminder(): Promise<void> {
    try {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(10, 0, 0, 0); // 10 AM next week

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📊 Hora de atualizar seu progresso!',
          body: 'Que tal registrar suas medidas e ver como está evoluindo?',
          data: { type: 'progress_update' },
        },
        trigger: {
          date: nextWeek,
          repeats: true,
        },
      });
    } catch (error) {
      console.error('Error scheduling progress reminder:', error);
    }
  }

  /**
   * Handle notification interaction
   */
  setupNotificationListeners(
    onNotificationReceived: (notification: any) => void,
    onNotificationInteraction: (response: any) => void
  ): void {
    // Handle notification received while app is running
    const receivedSubscription = Notifications.addNotificationReceivedListener(onNotificationReceived);

    // Handle notification interaction (tap)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(onNotificationInteraction);

    // Return cleanup function
    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }

  /**
   * Cancel scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await this.removeStoredNotification(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem('scheduled_notifications');
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  /**
   * Get scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Check for pending reminders (background task)
   */
  private async checkPendingReminders(): Promise<void> {
    try {
      const now = new Date();
      const storedReminders = await AsyncStorage.getItem('pending_reminders');

      if (!storedReminders) return;

      const reminders: WorkoutReminder[] = JSON.parse(storedReminders);
      const dueReminders = reminders.filter(r => new Date(r.scheduledTime) <= now);

      for (const reminder of dueReminders) {
        await this.scheduleWorkoutReminder(reminder);
      }

      // Remove processed reminders
      const remainingReminders = reminders.filter(r => new Date(r.scheduledTime) > now);
      await AsyncStorage.setItem('pending_reminders', JSON.stringify(remainingReminders));
    } catch (error) {
      console.error('Error checking pending reminders:', error);
    }
  }

  /**
   * Check for motivational notifications (background task)
   */
  private async checkMotivationalNotifications(): Promise<void> {
    try {
      const lastMotivational = await AsyncStorage.getItem('last_motivational');
      const lastDate = lastMotivational ? new Date(lastMotivational) : null;
      const now = new Date();

      // Send motivational notification if more than 24 hours since last one
      if (!lastDate || (now.getTime() - lastDate.getTime()) > 24 * 60 * 60 * 1000) {
        const messages = [
          'Lembre-se: cada treino te deixa mais forte! 💪',
          'Seus objetivos estão esperando por você! 🎯',
          'Que tal queimar algumas calorias hoje? 🔥',
          'A consistência é sua melhor amiga! ⭐',
        ];

        const randomMessage = messages[Math.floor(Math.random() * messages.length)];

        await Notifications.scheduleNotificationAsync({
          content: {
            title: '💡 Lembrete FitGenius',
            body: randomMessage,
            data: { type: 'motivation' },
          },
          trigger: null,
        });

        await AsyncStorage.setItem('last_motivational', now.toISOString());
      }
    } catch (error) {
      console.error('Error checking motivational notifications:', error);
    }
  }

  /**
   * Store scheduled notification for management
   */
  private async storeScheduledNotification(
    notificationId: string,
    reminder: WorkoutReminder
  ): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('scheduled_notifications');
      const notifications = stored ? JSON.parse(stored) : {};

      notifications[notificationId] = {
        ...reminder,
        scheduledAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem('scheduled_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error storing scheduled notification:', error);
    }
  }

  /**
   * Remove stored notification
   */
  private async removeStoredNotification(notificationId: string): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('scheduled_notifications');
      if (!stored) return;

      const notifications = JSON.parse(stored);
      delete notifications[notificationId];

      await AsyncStorage.setItem('scheduled_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error removing stored notification:', error);
    }
  }

  /**
   * Get notification settings from user preferences
   */
  async getNotificationSettings(): Promise<{
    workoutReminders: boolean;
    motivationalMessages: boolean;
    progressUpdates: boolean;
    achievementAlerts: boolean;
    reminderTime: string; // HH:MM format
  }> {
    try {
      const settings = await AsyncStorage.getItem('notification_settings');
      return settings ? JSON.parse(settings) : {
        workoutReminders: true,
        motivationalMessages: true,
        progressUpdates: true,
        achievementAlerts: true,
        reminderTime: '08:00',
      };
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
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(settings: {
    workoutReminders: boolean;
    motivationalMessages: boolean;
    progressUpdates: boolean;
    achievementAlerts: boolean;
    reminderTime: string;
  }): Promise<void> {
    try {
      await AsyncStorage.setItem('notification_settings', JSON.stringify(settings));

      // Re-schedule notifications based on new settings
      if (!settings.motivationalMessages) {
        // Cancel motivational notifications
        const scheduled = await this.getScheduledNotifications();
        for (const notification of scheduled) {
          if (notification.content.data?.type === 'motivation') {
            await this.cancelNotification(notification.identifier);
          }
        }
      } else {
        await this.scheduleDailyMotivation();
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  }
}

export const notificationService = new NotificationService();