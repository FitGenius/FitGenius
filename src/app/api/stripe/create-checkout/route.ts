import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { createCheckoutSession, getPlanByType } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { planType, successUrl, cancelUrl } = await request.json();

    if (!planType || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Plan type, success URL and cancel URL are required' },
        { status: 400 }
      );
    }

    // Verificar se é um plano válido
    const plan = getPlanByType(planType);
    if (!plan || planType === 'FREE') {
      return NextResponse.json(
        { error: 'Invalid plan type or free plan cannot be purchased' },
        { status: 400 }
      );
    }

    if (!plan.stripePriceId) {
      return NextResponse.json(
        { error: 'Plan does not have a Stripe price ID configured' },
        { status: 400 }
      );
    }

    // Verificar se o usuário já tem uma assinatura ativa
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: token.sub! }
    });

    if (existingSubscription && existingSubscription.status === 'ACTIVE') {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      );
    }

    // Criar sessão de checkout no Stripe
    const checkoutSession = await createCheckoutSession({
      priceId: plan.stripePriceId,
      userId: token.sub!,
      successUrl,
      cancelUrl,
      metadata: {
        planType,
        userEmail: token.email || '',
      }
    });

    return NextResponse.json({
      checkoutUrl: checkoutSession.url
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}