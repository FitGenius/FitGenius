import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { stripe, createCheckoutSession, PLANS } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { planType, successUrl, cancelUrl } = await req.json();

    // Validate plan type
    if (!['PROFESSIONAL', 'ENTERPRISE'].includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    const plan = PLANS[planType as keyof typeof PLANS];

    if (!plan.stripePriceId) {
      return NextResponse.json(
        { error: 'Plan not available for subscription' },
        { status: 400 }
      );
    }

    // Get or create user in database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user already has an active subscription
    if (user.subscription && user.subscription.status === 'ACTIVE') {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      );
    }

    // Create or get Stripe customer
    let customerId = user.subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
          platform: 'fitgenius',
        },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const checkoutSession = await createCheckoutSession({
      priceId: plan.stripePriceId,
      userId: user.id,
      successUrl: successUrl || `${process.env.NEXTAUTH_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: cancelUrl || `${process.env.NEXTAUTH_URL}/pricing`,
      metadata: {
        planType,
        userId: user.id,
      },
    });

    // Update user subscription record with checkout session info
    await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        stripeCustomerId: customerId,
        stripePriceId: plan.stripePriceId,
        plan: planType as any,
        status: 'PENDING',
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        stripeCustomerId: customerId,
        stripePriceId: plan.stripePriceId,
        plan: planType as any,
        status: 'PENDING',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}