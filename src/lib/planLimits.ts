import { prisma } from '@/lib/prisma';
// import { canPerformAction, getPlanByType } from '@/lib/stripe';

interface UsageData {
  clientsCount: number;
  workoutsCount: number;
  messagesCount: number;
  assessmentsCount: number;
}

// Temporary plan configuration until Stripe is properly configured
function getPlanByType(plan: 'FREE' | 'PROFESSIONAL' | 'ENTERPRISE') {
  const plans = {
    FREE: {
      name: 'Free',
      maxClients: 5,
    },
    PROFESSIONAL: {
      name: 'Professional',
      maxClients: null, // unlimited
    },
    ENTERPRISE: {
      name: 'Enterprise',
      maxClients: null, // unlimited
    }
  };

  return plans[plan] || plans.FREE;
}

export async function getUserPlanAndUsage(userId: string) {
  // Buscar assinatura do usuário
  const subscription = await prisma.subscription.findUnique({
    where: { userId }
  });

  const plan = subscription?.plan || 'FREE';

  // Buscar uso atual do mês
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  let usage = await prisma.usage.findUnique({
    where: {
      userId_period: {
        userId,
        period: currentMonth
      }
    }
  });

  // Se não existe uso do mês atual, criar um novo
  if (!usage) {
    usage = await prisma.usage.create({
      data: {
        userId,
        period: currentMonth,
        clientsCount: 0,
        workoutsCount: 0,
        messagesCount: 0,
        assessmentsCount: 0,
      }
    });
  }

  return {
    plan,
    usage: {
      clientsCount: usage.clientsCount,
      workoutsCount: usage.workoutsCount,
      messagesCount: usage.messagesCount,
      assessmentsCount: usage.assessmentsCount,
    }
  };
}

export async function checkPlanLimit(
  userId: string,
  action: 'add_client' | 'create_workout' | 'send_message' | 'create_assessment'
): Promise<{ allowed: boolean; reason?: string; limit?: number; current?: number }> {
  const { plan, usage } = await getUserPlanAndUsage(userId);
  const planConfig = getPlanByType(plan as any);

  switch (action) {
    case 'add_client':
      if (!planConfig.maxClients) {
        return { allowed: true }; // Ilimitado
      }

      // Contar clientes ativos do usuário (se for professional)
      const professional = await prisma.professional.findUnique({
        where: { userId },
        include: {
          _count: {
            select: { clients: true }
          }
        }
      });

      const currentClients = professional?._count.clients || 0;

      if (currentClients >= planConfig.maxClients) {
        return {
          allowed: false,
          reason: `Limite de ${planConfig.maxClients} clientes atingido para o plano ${planConfig.name}`,
          limit: planConfig.maxClients,
          current: currentClients
        };
      }

      return { allowed: true, limit: planConfig.maxClients, current: currentClients };

    case 'create_workout':
      // Por enquanto, todos os planos têm treinos ilimitados
      return { allowed: true };

    case 'send_message':
      // Verificar limite de mensagens (se houver no futuro)
      const messageLimit = getMessageLimit(plan as any);
      if (messageLimit && usage.messagesCount >= messageLimit) {
        return {
          allowed: false,
          reason: `Limite de ${messageLimit} mensagens por mês atingido`,
          limit: messageLimit,
          current: usage.messagesCount
        };
      }
      return { allowed: true, limit: messageLimit, current: usage.messagesCount };

    case 'create_assessment':
      // Por enquanto, todas as avaliações são ilimitadas
      return { allowed: true };

    default:
      return { allowed: true };
  }
}

export async function incrementUsage(
  userId: string,
  action: 'client' | 'workout' | 'message' | 'assessment',
  amount = 1
) {
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const updateData: any = {};

  switch (action) {
    case 'client':
      updateData.clientsCount = { increment: amount };
      break;
    case 'workout':
      updateData.workoutsCount = { increment: amount };
      break;
    case 'message':
      updateData.messagesCount = { increment: amount };
      break;
    case 'assessment':
      updateData.assessmentsCount = { increment: amount };
      break;
  }

  await prisma.usage.upsert({
    where: {
      userId_period: {
        userId,
        period: currentMonth
      }
    },
    create: {
      userId,
      period: currentMonth,
      clientsCount: action === 'client' ? amount : 0,
      workoutsCount: action === 'workout' ? amount : 0,
      messagesCount: action === 'message' ? amount : 0,
      assessmentsCount: action === 'assessment' ? amount : 0,
    },
    update: updateData
  });
}

export async function decrementUsage(
  userId: string,
  action: 'client' | 'workout' | 'message' | 'assessment',
  amount = 1
) {
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const updateData: any = {};

  switch (action) {
    case 'client':
      updateData.clientsCount = { decrement: amount };
      break;
    case 'workout':
      updateData.workoutsCount = { decrement: amount };
      break;
    case 'message':
      updateData.messagesCount = { decrement: amount };
      break;
    case 'assessment':
      updateData.assessmentsCount = { decrement: amount };
      break;
  }

  await prisma.usage.updateMany({
    where: {
      userId,
      period: currentMonth
    },
    data: updateData
  });
}

function getMessageLimit(plan: 'FREE' | 'PROFESSIONAL' | 'ENTERPRISE'): number | null {
  // Definir limites de mensagens por plano (futuro)
  const limits = {
    FREE: 50, // 50 mensagens por mês
    PROFESSIONAL: null, // Ilimitado
    ENTERPRISE: null, // Ilimitado
  };

  return limits[plan];
}

export async function getPlanLimitsInfo(userId: string) {
  const { plan, usage } = await getUserPlanAndUsage(userId);
  const planConfig = getPlanByType(plan as any);

  // Buscar número real de clientes
  const professional = await prisma.professional.findUnique({
    where: { userId },
    include: {
      _count: {
        select: { clients: true }
      }
    }
  });

  const currentClients = professional?._count.clients || 0;
  const messageLimit = getMessageLimit(plan as any);

  return {
    plan: plan,
    planName: planConfig.name,
    limits: {
      clients: {
        limit: planConfig.maxClients,
        current: currentClients,
        remaining: planConfig.maxClients ? planConfig.maxClients - currentClients : null,
        unlimited: !planConfig.maxClients
      },
      messages: {
        limit: messageLimit,
        current: usage.messagesCount,
        remaining: messageLimit ? messageLimit - usage.messagesCount : null,
        unlimited: !messageLimit
      },
      workouts: {
        limit: null, // Sempre ilimitado por enquanto
        current: usage.workoutsCount,
        remaining: null,
        unlimited: true
      },
      assessments: {
        limit: null, // Sempre ilimitado por enquanto
        current: usage.assessmentsCount,
        remaining: null,
        unlimited: true
      }
    }
  };
}