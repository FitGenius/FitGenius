import { NextRequest, NextResponse } from 'next/server';
import { PLANS, formatPrice } from '@/lib/stripe';

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