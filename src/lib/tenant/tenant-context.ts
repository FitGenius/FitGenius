import { prisma } from '../prisma';
import { cache } from 'react';
import { headers } from 'next/headers';

export interface TenantContext {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  businessType: string;
  maxUsers: number;
  features: Record<string, any>;
  settings: Record<string, any>;
  subscription?: {
    plan: string;
    status: string;
    maxUsers: number;
    features: Record<string, any>;
  };
}

/**
 * Get tenant context from request headers or domain
 */
export const getTenantContext = cache(async (): Promise<TenantContext | null> => {
  const headersList = headers();

  // Try to get tenant from custom header (for API calls)
  const tenantId = headersList.get('x-tenant-id');
  const tenantSlug = headersList.get('x-tenant-slug');

  // Try to get tenant from host domain
  const host = headersList.get('host');

  let tenant = null;

  if (tenantId) {
    tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  } else if (tenantSlug) {
    tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  } else if (host) {
    // Check if it's a subdomain (e.g., smartfit.fitgenius.com)
    const subdomain = host.split('.')[0];
    if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
      tenant = await prisma.tenant.findFirst({
        where: {
          OR: [
            { domain: host },
            { slug: subdomain },
          ],
        },
        include: {
          subscriptions: {
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });
    }
  }

  if (!tenant) {
    return null;
  }

  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    domain: tenant.domain || undefined,
    logo: tenant.logo || undefined,
    primaryColor: tenant.primaryColor,
    secondaryColor: tenant.secondaryColor,
    businessType: tenant.businessType,
    maxUsers: tenant.maxUsers,
    features: tenant.features as Record<string, any>,
    settings: tenant.settings as Record<string, any>,
    subscription: tenant.subscriptions[0] ? {
      plan: tenant.subscriptions[0].plan,
      status: tenant.subscriptions[0].status,
      maxUsers: tenant.subscriptions[0].maxUsers,
      features: tenant.subscriptions[0].features as Record<string, any>,
    } : undefined,
  };
});

/**
 * Middleware helper to check if tenant is active and has valid subscription
 */
export async function validateTenantAccess(tenantContext: TenantContext): Promise<{
  isValid: boolean;
  reason?: string;
}> {
  // Check if tenant is active
  if (!tenantContext) {
    return { isValid: false, reason: 'Tenant not found' };
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantContext.id },
    include: {
      subscriptions: {
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!tenant || !tenant.isActive) {
    return { isValid: false, reason: 'Tenant is inactive' };
  }

  // Check subscription status
  const activeSubscription = tenant.subscriptions[0];
  if (!activeSubscription) {
    return { isValid: false, reason: 'No active subscription' };
  }

  // Check if subscription is not expired
  if (new Date() > activeSubscription.currentPeriodEnd) {
    return { isValid: false, reason: 'Subscription expired' };
  }

  // Check user limits
  const userCount = await prisma.user.count({
    where: { tenantId: tenant.id },
  });

  if (userCount >= activeSubscription.maxUsers) {
    return { isValid: false, reason: 'User limit reached' };
  }

  return { isValid: true };
}

/**
 * Get tenant-scoped Prisma client
 * This ensures all queries are automatically scoped to the tenant
 */
export function getTenantPrisma(tenantId: string) {
  return prisma.$extends({
    query: {
      user: {
        async findMany({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findUnique({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async create({ args, query }) {
          args.data = { ...args.data, tenantId };
          return query(args);
        },
      },
      workout: {
        async findMany({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findUnique({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async create({ args, query }) {
          args.data = { ...args.data, tenantId };
          return query(args);
        },
      },
      exercise: {
        async findMany({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findUnique({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async create({ args, query }) {
          args.data = { ...args.data, tenantId };
          return query(args);
        },
      },
    },
  });
}

/**
 * Helper to check if user has permission within tenant
 */
export async function checkTenantPermission(
  userId: string,
  tenantId: string,
  permission: string
): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId,
    },
  });

  if (!user) return false;

  // Super admin has all permissions
  if (user.role === 'SUPER_ADMIN') return true;

  // Tenant admin has all tenant permissions
  if (user.role === 'TENANT_ADMIN') return true;

  // Check specific permissions
  const permissions = (user.permissions as string[]) || [];
  return permissions.includes(permission);
}

/**
 * Get tenant branding/theming
 */
export function getTenantBranding(tenantContext: TenantContext) {
  return {
    logo: tenantContext.logo,
    primaryColor: tenantContext.primaryColor,
    secondaryColor: tenantContext.secondaryColor,
    name: tenantContext.name,
    customCSS: `
      :root {
        --tenant-primary: ${tenantContext.primaryColor};
        --tenant-secondary: ${tenantContext.secondaryColor};
      }
    `,
  };
}

/**
 * Feature flag checker
 */
export function hasFeature(
  tenantContext: TenantContext,
  feature: string
): boolean {
  const subscriptionFeatures = tenantContext.subscription?.features || {};
  const tenantFeatures = tenantContext.features || {};

  return !!(subscriptionFeatures[feature] || tenantFeatures[feature]);
}

/**
 * Usage tracking for billing
 */
export async function trackUsage(
  tenantId: string,
  metric: string,
  value: number = 1,
  metadata?: Record<string, any>
) {
  // This would integrate with your usage tracking system
  // For now, we'll just log it
  console.log(`Usage tracking: ${tenantId} - ${metric}: ${value}`, metadata);

  // In production, you'd send this to a usage tracking service
  // or store in a usage_events table for billing calculations
}