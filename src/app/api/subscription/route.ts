import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
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

    // Buscar assinatura do usuário
    const subscription = await prisma.subscription.findUnique({
      where: { userId: token.sub! }
    });

    if (!subscription) {
      // Se não tem assinatura, criar uma gratuita
      const freeSubscription = await prisma.subscription.create({
        data: {
          userId: token.sub!,
          plan: 'FREE',
          status: 'ACTIVE',
          stripePriceId: 'free',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
        }
      });

      return NextResponse.json({
        subscription: {
          id: freeSubscription.id,
          plan: freeSubscription.plan,
          status: freeSubscription.status,
          currentPeriodEnd: freeSubscription.currentPeriodEnd,
          cancelAtPeriodEnd: freeSubscription.cancelAtPeriodEnd
        }
      });
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        stripeCustomerId: subscription.stripeCustomerId,
        stripeSubscriptionId: subscription.stripeSubscriptionId
      }
    });

  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}