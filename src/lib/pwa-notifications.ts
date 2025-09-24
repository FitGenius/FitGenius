// Sistema de Notificações Push para PWA

export type NotificationType =
  | 'workout_reminder'
  | 'meal_reminder'
  | 'water_reminder'
  | 'assessment_due'
  | 'new_message'
  | 'workout_updated'
  | 'achievement_unlocked';

interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
}

// Verificar suporte para notificações
export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

// Solicitar permissão para notificações
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    console.log('Notificações não são suportadas neste dispositivo');
    return 'denied';
  }

  const permission = await Notification.requestPermission();

  if (permission === 'granted') {
    console.log('Permissão para notificações concedida');
  } else if (permission === 'denied') {
    console.log('Permissão para notificações negada');
  }

  return permission;
}

// Verificar status da permissão
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
}

// Enviar notificação local
export async function sendLocalNotification(data: NotificationData): Promise<void> {
  if (!isNotificationSupported()) {
    console.log('Notificações não são suportadas');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.log('Permissão para notificações não concedida');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    await registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/icon-72x72.png',
      tag: data.tag || 'fitgenius-notification',
      data: data.data,
      actions: data.actions,
      vibrate: [200, 100, 200],
      requireInteraction: false,
      silent: false
    });
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
  }
}

// Agendar notificações
export class NotificationScheduler {
  private static timers: Map<string, NodeJS.Timeout> = new Map();

  // Agendar notificação de lembrete de treino
  static scheduleWorkoutReminder(time: Date, workoutName: string): string {
    const id = `workout-${Date.now()}`;
    const delay = time.getTime() - Date.now();

    if (delay > 0) {
      const timer = setTimeout(() => {
        sendLocalNotification({
          title: '🏋️ Hora do Treino!',
          body: `Está na hora do seu treino: ${workoutName}`,
          tag: 'workout-reminder',
          data: { type: 'workout_reminder' },
          actions: [
            { action: 'start', title: 'Iniciar Treino' },
            { action: 'snooze', title: 'Adiar 15min' }
          ]
        });
        this.timers.delete(id);
      }, delay);

      this.timers.set(id, timer);
    }

    return id;
  }

  // Agendar notificação de lembrete de refeição
  static scheduleMealReminder(time: Date, mealName: string): string {
    const id = `meal-${Date.now()}`;
    const delay = time.getTime() - Date.now();

    if (delay > 0) {
      const timer = setTimeout(() => {
        sendLocalNotification({
          title: '🍽️ Hora da Refeição!',
          body: `Não esqueça: ${mealName}`,
          tag: 'meal-reminder',
          data: { type: 'meal_reminder' },
          actions: [
            { action: 'log', title: 'Registrar' },
            { action: 'snooze', title: 'Lembrar depois' }
          ]
        });
        this.timers.delete(id);
      }, delay);

      this.timers.set(id, timer);
    }

    return id;
  }

  // Agendar notificação de lembrete de água
  static scheduleWaterReminder(intervalHours: number = 2): string {
    const id = `water-${Date.now()}`;

    const timer = setInterval(() => {
      const hour = new Date().getHours();
      // Só enviar entre 7h e 22h
      if (hour >= 7 && hour <= 22) {
        sendLocalNotification({
          title: '💧 Hora de se Hidratar!',
          body: 'Beba um copo de água para manter-se hidratado',
          tag: 'water-reminder',
          data: { type: 'water_reminder' }
        });
      }
    }, intervalHours * 60 * 60 * 1000);

    this.timers.set(id, timer);
    return id;
  }

  // Cancelar notificação agendada
  static cancelScheduled(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }

  // Cancelar todas as notificações
  static cancelAll(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
  }
}

// Notificações pré-definidas
export const NotificationTemplates = {
  // Treino
  workoutReminder: (workoutName: string) => ({
    title: '🏋️ Hora do Treino!',
    body: `Está na hora do seu treino: ${workoutName}`,
    tag: 'workout-reminder'
  }),

  workoutCompleted: () => ({
    title: '✅ Treino Concluído!',
    body: 'Parabéns! Você completou seu treino de hoje',
    tag: 'workout-completed'
  }),

  // Nutrição
  mealReminder: (mealName: string) => ({
    title: '🍽️ Hora da Refeição',
    body: `Não esqueça: ${mealName}`,
    tag: 'meal-reminder'
  }),

  waterReminder: () => ({
    title: '💧 Hidrate-se!',
    body: 'Beba água para manter-se hidratado',
    tag: 'water-reminder'
  }),

  // Conquistas
  achievementUnlocked: (achievement: string) => ({
    title: '🏆 Nova Conquista!',
    body: `Você desbloqueou: ${achievement}`,
    tag: 'achievement'
  }),

  levelUp: (level: number) => ({
    title: '⬆️ Level Up!',
    body: `Parabéns! Você alcançou o nível ${level}`,
    tag: 'level-up'
  }),

  // Mensagens
  newMessage: (from: string) => ({
    title: '💬 Nova Mensagem',
    body: `${from} enviou uma mensagem`,
    tag: 'new-message'
  }),

  // Avaliação
  assessmentDue: () => ({
    title: '📋 Avaliação Pendente',
    body: 'Está na hora de fazer sua avaliação mensal',
    tag: 'assessment-due'
  })
};

// Hook para usar em componentes React
export function useNotifications() {
  const checkPermission = () => getNotificationPermission();
  const requestPermission = () => requestNotificationPermission();
  const sendNotification = (data: NotificationData) => sendLocalNotification(data);

  const scheduleWorkout = (time: Date, name: string) =>
    NotificationScheduler.scheduleWorkoutReminder(time, name);

  const scheduleMeal = (time: Date, name: string) =>
    NotificationScheduler.scheduleMealReminder(time, name);

  const scheduleWater = (hours: number = 2) =>
    NotificationScheduler.scheduleWaterReminder(hours);

  const cancelNotification = (id: string) =>
    NotificationScheduler.cancelScheduled(id);

  return {
    checkPermission,
    requestPermission,
    sendNotification,
    scheduleWorkout,
    scheduleMeal,
    scheduleWater,
    cancelNotification,
    templates: NotificationTemplates
  };
}