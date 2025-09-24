import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantContext, checkTenantPermission } from '@/lib/tenant/tenant-context';
import { stripe } from '@/lib/stripe';
import { z } from 'zod';

const createSubscriptionSchema = z.object({
  tenantId: z.string(),
  plan: z.enum(['basic', 'premium', 'enterprise']),
  billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
  maxUsers: z.number().min(1).max(10000),
  features: z.record(z.any()).optional(),
  customPrice: z.number().optional(),
});

const updateSubscriptionSchema = z.object({
  plan: z.enum(['basic', 'premium', 'enterprise']).optional(),
  maxUsers: z.number().min(1).max(10000).optional(),
  features: z.record(z.any()).optional(),
  billingCycle: z.enum(['monthly', 'yearly']).optional(),
});

interface BillingInfo {
  tenant: {
    id: string;
    name: string;
    email: string;
    billingEmail?: string;
    billingAddress?: string;
  };
  subscription: {
    id: string;
    plan: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    maxUsers: number;
    pricePerUser: number;
    totalAmount: number;
    currency: string;
    billingCycle: string;
    features: Record<string, any>;
    stripeSubscriptionId?: string;
  };
  usage: {
    currentUsers: number;
    utilizationRate: number;
    monthlyActiveUsers: number;
    totalWorkouts: number;
    apiCalls: number;
    storageUsed: number;
  };
  invoices: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    issueDate: Date;
    dueDate: Date;
    paidDate?: Date;
    downloadUrl?: string;
  }>;
  paymentMethods: Array<{
    id: string;
    type: string;
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
    isDefault: boolean;
  }>;
}

/**
 * GET /api/enterprise/billing
 * Get billing information for tenant
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 });
    }

    // Check permissions
    const hasPermission = await checkTenantPermission(
      session.user.id,
      tenantContext.id,
      'billing.view'
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const billingInfo = await getBillingInfo(tenantContext.id);

    return NextResponse.json(billingInfo);
  } catch (error) {
    console.error('Error fetching billing info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/enterprise/billing
 * Update subscription
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 });
    }

    // Check permissions
    const hasPermission = await checkTenantPermission(
      session.user.id,
      tenantContext.id,
      'billing.manage'
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateSubscriptionSchema.parse(body);

    // Get current subscription
    const currentSubscription = await prisma.tenantSubscription.findFirst({
      where: {
        tenantId: tenantContext.id,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!currentSubscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Calculate new pricing
    const newPricePerUser = getPricePerUser(
      validatedData.plan || currentSubscription.plan,
      validatedData.billingCycle || currentSubscription.billingCycle
    );
    const newMaxUsers = validatedData.maxUsers || currentSubscription.maxUsers;
    const newTotalAmount = newPricePerUser * newMaxUsers;

    // Update Stripe subscription if exists
    if (currentSubscription.stripeSubscriptionId) {
      await updateStripeSubscription(
        currentSubscription.stripeSubscriptionId,
        {
          plan: validatedData.plan,
          maxUsers: newMaxUsers,
          billingCycle: validatedData.billingCycle,
        }
      );
    }

    // Update database
    const updatedSubscription = await prisma.tenantSubscription.update({
      where: { id: currentSubscription.id },
      data: {
        plan: validatedData.plan || currentSubscription.plan,
        maxUsers: newMaxUsers,
        pricePerUser: newPricePerUser,
        totalAmount: newTotalAmount,
        billingCycle: validatedData.billingCycle || currentSubscription.billingCycle,
        features: validatedData.features || currentSubscription.features,
      },
    });

    return NextResponse.json({
      subscription: updatedSubscription,
      message: 'Subscription updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', issues: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/enterprise/billing
 * Create new subscription for tenant
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admins can create subscriptions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Super Admin required' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createSubscriptionSchema.parse(body);

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: validatedData.tenantId },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Create Stripe customer if doesn't exist
    let stripeCustomerId = null;
    if (process.env.STRIPE_SECRET_KEY) {
      const stripeCustomer = await stripe.customers.create({
        email: tenant.billingEmail || tenant.email,
        name: tenant.name,
        metadata: {
          tenantId: tenant.id,
          businessType: tenant.businessType,
        },
      });
      stripeCustomerId = stripeCustomer.id;
    }

    // Calculate pricing
    const pricePerUser = validatedData.customPrice || getPricePerUser(
      validatedData.plan,
      validatedData.billingCycle
    );
    const totalAmount = pricePerUser * validatedData.maxUsers;

    // Create subscription
    const subscription = await prisma.tenantSubscription.create({
      data: {
        tenantId: validatedData.tenantId,
        plan: validatedData.plan,
        status: 'ACTIVE',
        maxUsers: validatedData.maxUsers,
        features: validatedData.features || getDefaultFeatures(validatedData.plan),
        pricePerUser,
        totalAmount,
        currency: 'USD',
        billingCycle: validatedData.billingCycle,
        stripeCustomerId,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + (validatedData.billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({
      subscription,
      message: 'Subscription created successfully',
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', issues: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getBillingInfo(tenantId: string): Promise<BillingInfo> {
  // Get tenant with subscription
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      subscriptions: {
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!tenant || !tenant.subscriptions[0]) {
    throw new Error('Tenant or subscription not found');
  }

  const subscription = tenant.subscriptions[0];

  // Get usage metrics
  const [currentUsers, monthlyActiveUsers, totalWorkouts] = await Promise.all([
    prisma.user.count({ where: { tenantId } }),
    prisma.user.count({
      where: {
        tenantId,
        lastLoginAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.workout.count({ where: { tenantId } }),
  ]);

  // Get Stripe data if available
  let invoices: BillingInfo['invoices'] = [];
  let paymentMethods: BillingInfo['paymentMethods'] = [];

  if (subscription.stripeCustomerId && process.env.STRIPE_SECRET_KEY) {
    try {
      // Get invoices
      const stripeInvoices = await stripe.invoices.list({
        customer: subscription.stripeCustomerId,
        limit: 10,
      });

      invoices = stripeInvoices.data.map(invoice => ({
        id: invoice.id,
        amount: invoice.total / 100, // Convert from cents
        currency: invoice.currency.toUpperCase(),
        status: invoice.status || 'unknown',
        issueDate: new Date(invoice.created * 1000),
        dueDate: new Date((invoice.due_date || invoice.created) * 1000),
        paidDate: invoice.status_transitions.paid_at
          ? new Date(invoice.status_transitions.paid_at * 1000)
          : undefined,
        downloadUrl: invoice.hosted_invoice_url,
      }));

      // Get payment methods
      const stripePaymentMethods = await stripe.paymentMethods.list({
        customer: subscription.stripeCustomerId,
        type: 'card',
      });

      paymentMethods = stripePaymentMethods.data.map(pm => ({
        id: pm.id,
        type: 'card',
        last4: pm.card?.last4,
        brand: pm.card?.brand,
        expiryMonth: pm.card?.exp_month,
        expiryYear: pm.card?.exp_year,
        isDefault: false, // You'd need to check customer's default payment method
      }));
    } catch (error) {
      console.warn('Failed to fetch Stripe data:', error);
    }
  }

  return {
    tenant: {
      id: tenant.id,
      name: tenant.name,
      email: tenant.email,
      billingEmail: tenant.billingEmail || undefined,
      billingAddress: tenant.billingAddress || undefined,
    },
    subscription: {
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      maxUsers: subscription.maxUsers,
      pricePerUser: Number(subscription.pricePerUser),
      totalAmount: Number(subscription.totalAmount),
      currency: subscription.currency,
      billingCycle: subscription.billingCycle,
      features: subscription.features as Record<string, any>,
      stripeSubscriptionId: subscription.stripeSubscriptionId || undefined,
    },
    usage: {
      currentUsers,
      utilizationRate: (currentUsers / subscription.maxUsers) * 100,
      monthlyActiveUsers,
      totalWorkouts,
      apiCalls: Math.floor(Math.random() * 10000), // Mock data
      storageUsed: Math.floor(Math.random() * 1000), // Mock data in MB
    },
    invoices,
    paymentMethods,
  };
}

async function updateStripeSubscription(
  subscriptionId: string,
  updates: {
    plan?: string;
    maxUsers?: number;
    billingCycle?: string;
  }
) {
  if (!process.env.STRIPE_SECRET_KEY) return;

  try {
    await stripe.subscriptions.update(subscriptionId, {
      metadata: {
        plan: updates.plan || '',
        maxUsers: updates.maxUsers?.toString() || '',
        billingCycle: updates.billingCycle || '',
      },
    });
  } catch (error) {
    console.error('Failed to update Stripe subscription:', error);
    throw error;
  }
}

function getPricePerUser(plan: string, billingCycle: string): number {
  const monthlyPrices = {
    basic: 5,
    premium: 15,
    enterprise: 25,
  };

  const yearlyDiscount = 0.8; // 20% discount for yearly billing

  const monthlyPrice = monthlyPrices[plan as keyof typeof monthlyPrices] || 5;

  return billingCycle === 'yearly' ? monthlyPrice * yearlyDiscount : monthlyPrice;
}

function getDefaultFeatures(plan: string) {
  const features = {
    basic: {
      aiAssistant: false,
      advancedAnalytics: false,
      whiteLabel: false,
      apiAccess: false,
      prioritySupport: false,
      maxWorkouts: 50,
      maxExercises: 100,
    },
    premium: {
      aiAssistant: true,
      advancedAnalytics: true,
      whiteLabel: false,
      apiAccess: true,
      prioritySupport: false,
      maxWorkouts: 500,
      maxExercises: 1000,
    },
    enterprise: {
      aiAssistant: true,
      advancedAnalytics: true,
      whiteLabel: true,
      apiAccess: true,
      prioritySupport: true,
      maxWorkouts: -1, // unlimited
      maxExercises: -1, // unlimited
    },
  };

  return features[plan as keyof typeof features] || features.basic;
}