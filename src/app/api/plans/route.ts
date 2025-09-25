import { NextRequest, NextResponse } from 'next/server';
// import { PLANS, formatPrice } from '@/lib/stripe';

// Temporary local plans configuration
const PLANS = {
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
    maxClients: null,
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

const formatPrice = (price: number, currency = 'BRL') => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(price);
};

export async function GET(request: NextRequest) {
  try {
    // Transformar os planos em um formato adequado para o frontend
    const plansData = Object.entries(PLANS).map(([key, plan]) => ({
      id: key,
      type: key as 'FREE' | 'PROFESSIONAL' | 'ENTERPRISE',
      name: plan.name,
      description: plan.description,
      price: plan.price,
      formattedPrice: formatPrice(plan.price),
      currency: plan.currency,
      interval: plan.interval,
      maxClients: plan.maxClients,
      features: plan.features,
      stripePriceId: plan.stripePriceId,
      popular: plan.popular,
    }));

    return NextResponse.json({
      plans: plansData
    });

  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}