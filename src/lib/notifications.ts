import { prisma } from '@/lib/prisma';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'REMINDER' | 'WORKOUT' | 'ASSESSMENT';
  data?: any;
}

export async function createNotification({
  userId,
  title,
  message,
  type = 'INFO',
  data
}: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        data: data ? JSON.stringify(data) : null,
        createdAt: new Date()
      }
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// Notificações específicas para eventos do sistema

export async function notifyNewAssessment(clientId: string, professionalName: string) {
  return createNotification({
    userId: clientId,
    title: 'Nova Avaliação Física',
    message: `${professionalName} registrou uma nova avaliação física para você. Confira seus resultados!`,
    type: 'ASSESSMENT',
    data: { type: 'new_assessment' }
  });
}

export async function notifyNewWorkout(clientId: string, professionalName: string, workoutName: string) {
  return createNotification({
    userId: clientId,
    title: 'Novo Treino Disponível',
    message: `${professionalName} criou um novo treino para você: "${workoutName}". Confira agora!`,
    type: 'WORKOUT',
    data: { type: 'new_workout', workoutName }
  });
}

export async function notifyAssessmentReminder(clientId: string, daysSinceLastAssessment: number) {
  return createNotification({
    userId: clientId,
    title: 'Hora da Avaliação',
    message: `Já se passaram ${daysSinceLastAssessment} dias desde sua última avaliação. Agende uma nova avaliação com seu profissional.`,
    type: 'REMINDER',
    data: { type: 'assessment_reminder', daysSinceLastAssessment }
  });
}

export async function notifyWorkoutReminder(clientId: string) {
  return createNotification({
    userId: clientId,
    title: 'Não Esqueça do Treino!',
    message: 'Você tem treinos pendentes. Que tal manter a consistência hoje?',
    type: 'REMINDER',
    data: { type: 'workout_reminder' }
  });
}

export async function notifyClientInviteAccepted(professionalId: string, clientName: string) {
  return createNotification({
    userId: professionalId,
    title: 'Convite Aceito',
    message: `${clientName} aceitou seu convite e agora é seu cliente!`,
    type: 'SUCCESS',
    data: { type: 'invite_accepted', clientName }
  });
}

export async function notifyNewMessage(recipientId: string, senderName: string) {
  return createNotification({
    userId: recipientId,
    title: 'Nova Mensagem',
    message: `Você recebeu uma nova mensagem de ${senderName}`,
    type: 'INFO',
    data: { type: 'new_message', senderName }
  });
}

export async function notifyPaymentDue(professionalId: string, amount: number, dueDate: string) {
  return createNotification({
    userId: professionalId,
    title: 'Fatura Vencendo',
    message: `Sua fatura de R$ ${amount.toFixed(2)} vence em ${dueDate}. Não esqueça de fazer o pagamento.`,
    type: 'WARNING',
    data: { type: 'payment_due', amount, dueDate }
  });
}

export async function notifySystemMaintenance(userId: string, maintenanceDate: string) {
  return createNotification({
    userId,
    title: 'Manutenção Programada',
    message: `O sistema estará em manutenção no dia ${maintenanceDate}. Algumas funcionalidades podem ficar indisponíveis.`,
    type: 'INFO',
    data: { type: 'system_maintenance', maintenanceDate }
  });
}

// Função para criar notificações em lote
export async function createBulkNotifications(notifications: CreateNotificationParams[]) {
  try {
    const createdNotifications = await Promise.all(
      notifications.map(notification => createNotification(notification))
    );
    return createdNotifications;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
}

// Função para marcar notificações como lidas
export async function markNotificationsAsRead(userId: string, notificationIds: string[]) {
  try {
    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: userId
      },
      data: {
        readAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    throw error;
  }
}

// Função para limpar notificações antigas (mais de 30 dias)
export async function cleanOldNotifications() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deleted = await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo
        },
        readAt: {
          not: null
        }
      }
    });

    console.log(`Cleaned up ${deleted.count} old notifications`);
    return deleted.count;
  } catch (error) {
    console.error('Error cleaning old notifications:', error);
    throw error;
  }
}