import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { createBillingPortalSession } from '@/lib/stripe';

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

    const { returnUrl } = await request.json();

    if (!returnUrl) {
      return NextResponse.json(
        { error: 'Return URL is required' },
        { status: 400 }
      );
    }

    // Buscar a assinatura do usuário
    const subscription = await prisma.subscription.findUnique({
      where: { userId: token.sub! }
    });

    if (!subscription || !subscription.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No active subscription found or missing customer ID' },
        { status: 404 }
      );
    }

    // Criar sessão do portal de billing
    const billingPortalSession = await createBillingPortalSession({
      customerId: subscription.stripeCustomerId,
      returnUrl
    });

    return NextResponse.json({
      portalUrl: billingPortalSession.url
    });

  } catch (error) {
    console.error('Error creating billing portal session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}