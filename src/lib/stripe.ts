import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  appInfo: {
    name: 'FitGenius',
    version: '1.0.0',
  },
});

// Planos disponíveis
export const PLANS = {
  FREE: {
    name: 'Gratuito',
    description: 'Para começar sua jornada',
    price: 0,
    currency: 'BRL',
    interval: 'monthly' as const,
    maxClients: 3,
    features: [
      'Até 3 clientes',
      'Biblioteca básica de exercícios',
      'Treinos simples',
      'Suporte por email',
    ],
    stripePriceId: null,
    popular: false,
  },
  PROFESSIONAL: {
    name: 'Profissional',
    description: 'Para profissionais em crescimento',
    price: 97,
    currency: 'BRL',
    interval: 'monthly' as const,
    maxClients: 30,
    features: [
      'Até 30 clientes',
      'Biblioteca completa de exercícios',
      'Treinos personalizados',
      'Avaliações físicas',
      'Chat em tempo real',
      'Analytics avançados',
      'Suporte prioritário',
    ],
    stripePriceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
    popular: true,
  },
  ENTERPRISE: {
    name: 'Enterprise',
    description: 'Para academias e grandes estúdios',
    price: 197,
    currency: 'BRL',
    interval: 'monthly' as const,
    maxClients: null, // Ilimitado
    features: [
      'Clientes ilimitados',
      'Múltiplos profissionais',
      'White-label',
      'API personalizada',
      'Integrações avançadas',
      'Suporte dedicado 24/7',
      'Treinamento da equipe',
    ],
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    popular: false,
  },
};

// Utilitários para formatação de preços
export const formatPrice = (price: number, currency = 'BRL') => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(price);
};

// Configuração do cliente Stripe para frontend
export const getStripeJs = async () => {
  const { loadStripe } = await import('@stripe/stripe-js');
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
};

// Função para obter plano por tipo
export const getPlanByType = (type: 'FREE' | 'PROFESSIONAL' | 'ENTERPRISE') => {
  return PLANS[type];
};

// Função para verificar se o usuário pode executar uma ação baseada no plano
export const canPerformAction = (
  userPlan: 'FREE' | 'PROFESSIONAL' | 'ENTERPRISE',
  action: 'add_client' | 'create_workout' | 'send_message',
  currentUsage?: {
    clientsCount: number;
    workoutsCount: number;
    messagesCount: number;
  }
): boolean => {
  const plan = getPlanByType(userPlan);

  switch (action) {
    case 'add_client':
      if (!plan.maxClients) return true; // Ilimitado
      return (currentUsage?.clientsCount || 0) < plan.maxClients;

    case 'create_workout':
      // Por enquanto, todos os planos permitem treinos ilimitados
      return true;

    case 'send_message':
      // Por enquanto, todos os planos permitem mensagens ilimitadas
      return true;

    default:
      return true;
  }
};

// Função para criar sessão de checkout
export const createCheckoutSession = async ({
  priceId,
  userId,
  successUrl,
  cancelUrl,
  metadata = {},
}: {
  priceId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) => {
  return await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      ...metadata,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    customer_creation: 'always',
  });
};

// Função para criar portal de billing
export const createBillingPortalSession = async ({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) => {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
};