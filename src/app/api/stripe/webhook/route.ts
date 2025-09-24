import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== 'subscription' || !session.subscription) return;

  const userId = session.metadata?.userId;
  if (!userId) {
    console.error('No userId in session metadata');
    return;
  }

  // Buscar a subscription do Stripe
  const stripeSubscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  // Determinar o tipo de plano baseado no price ID
  let planType: 'FREE' | 'PROFESSIONAL' | 'ENTERPRISE' = 'FREE';
  const priceId = stripeSubscription.items.data[0]?.price.id;

  if (priceId === process.env.STRIPE_PROFESSIONAL_PRICE_ID) {
    planType = 'PROFESSIONAL';
  } else if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) {
    planType = 'ENTERPRISE';
  }

  // Criar ou atualizar a assinatura no banco
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: stripeSubscription.customer as string,
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: priceId,
      plan: planType,
      status: stripeSubscription.status.toUpperCase() as any,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      trialStart: stripeSubscription.trial_start ?
        new Date(stripeSubscription.trial_start * 1000) : null,
      trialEnd: stripeSubscription.trial_end ?
        new Date(stripeSubscription.trial_end * 1000) : null,
    },
    update: {
      stripeCustomerId: stripeSubscription.customer as string,
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: priceId,
      plan: planType,
      status: stripeSubscription.status.toUpperCase() as any,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      canceledAt: stripeSubscription.canceled_at ?
        new Date(stripeSubscription.canceled_at * 1000) : null,
    }
  });

  console.log(`Subscription created/updated for user ${userId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const subscriptionRecord = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id }
  });

  if (!subscriptionRecord) return;

  await prisma.subscription.update({
    where: { id: subscriptionRecord.id },
    data: {
      status: subscription.status.toUpperCase() as any,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ?
        new Date(subscription.canceled_at * 1000) : null,
    }
  });

  console.log(`Subscription updated: ${subscription.id}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const subscriptionRecord = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id }
  });

  if (!subscriptionRecord) return;

  // Voltar para plano gratuito
  await prisma.subscription.update({
    where: { id: subscriptionRecord.id },
    data: {
      plan: 'FREE',
      status: 'CANCELED',
      stripeSubscriptionId: null,
      stripePriceId: 'free',
      canceledAt: new Date(),
      currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias de graça
    }
  });

  console.log(`Subscription deleted, reverted to FREE plan: ${subscription.id}`);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const subscriptionRecord = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: invoice.subscription as string }
  });

  if (!subscriptionRecord) return;

  // Criar registro de pagamento
  await prisma.payment.create({
    data: {
      subscriptionId: subscriptionRecord.id,
      stripePaymentId: invoice.payment_intent as string || null,
      amount: (invoice.amount_paid || 0) / 100, // Converter centavos para reais
      currency: invoice.currency?.toUpperCase() || 'BRL',
      status: 'SUCCEEDED',
      paymentMethod: invoice.collection_method || null,
      paidAt: invoice.status_transitions?.paid_at ?
        new Date(invoice.status_transitions.paid_at * 1000) : new Date(),
    }
  });

  console.log(`Payment succeeded for subscription: ${invoice.subscription}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const subscriptionRecord = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: invoice.subscription as string }
  });

  if (!subscriptionRecord) return;

  // Criar registro de pagamento falhado
  await prisma.payment.create({
    data: {
      subscriptionId: subscriptionRecord.id,
      stripePaymentId: invoice.payment_intent as string || null,
      amount: (invoice.amount_due || 0) / 100,
      currency: invoice.currency?.toUpperCase() || 'BRL',
      status: 'FAILED',
      paymentMethod: invoice.collection_method || null,
      failureReason: 'Payment failed',
    }
  });

  // Criar notificação para o usuário
  await prisma.notification.create({
    data: {
      userId: subscriptionRecord.userId,
      type: 'PAYMENT_FAILED',
      title: 'Falha no Pagamento',
      message: 'Não foi possível processar seu pagamento. Verifique seus dados de cobrança.',
      data: JSON.stringify({
        invoiceId: invoice.id,
        amount: (invoice.amount_due || 0) / 100,
      })
    }
  });

  console.log(`Payment failed for subscription: ${invoice.subscription}`);
}