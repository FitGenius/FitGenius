import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantContext } from '@/lib/tenant/tenant-context';
import { z } from 'zod';

const createTenantSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  businessType: z.enum(['GYM', 'CORPORATE', 'PERSONAL_TRAINER', 'CLINIC', 'SPORTS_TEAM']),
  subscriptionPlan: z.enum(['basic', 'premium', 'enterprise']).default('basic'),
  maxUsers: z.number().min(1).max(10000).default(100),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).default('#6366F1'),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).default('#8B5CF6'),
});

const updateTenantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  logo: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  settings: z.record(z.any()).optional(),
  features: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/enterprise/tenants
 * List all tenants (Super Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Super Admin required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const businessType = searchParams.get('businessType') || '';
    const isActive = searchParams.get('isActive');

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (businessType) {
      where.businessType = businessType;
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const [tenants, totalCount] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: {
          subscriptions: {
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              users: true,
              workouts: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.tenant.count({ where }),
    ]);

    return NextResponse.json({
      tenants: tenants.map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain,
        email: tenant.email,
        businessType: tenant.businessType,
        isActive: tenant.isActive,
        userCount: tenant._count.users,
        workoutCount: tenant._count.workouts,
        subscription: tenant.subscriptions[0] || null,
        createdAt: tenant.createdAt,
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/enterprise/tenants
 * Create new tenant (Super Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Super Admin required' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createTenantSchema.parse(body);

    // Check if slug is unique
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      );
    }

    // Create tenant with default subscription
    const tenant = await prisma.tenant.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        email: validatedData.email,
        phone: validatedData.phone,
        address: validatedData.address,
        businessType: validatedData.businessType,
        maxUsers: validatedData.maxUsers,
        primaryColor: validatedData.primaryColor,
        secondaryColor: validatedData.secondaryColor,
        subscriptions: {
          create: {
            plan: validatedData.subscriptionPlan,
            status: 'ACTIVE',
            maxUsers: validatedData.maxUsers,
            features: getDefaultFeatures(validatedData.subscriptionPlan),
            pricePerUser: getPricePerUser(validatedData.subscriptionPlan),
            totalAmount: getPricePerUser(validatedData.subscriptionPlan) * validatedData.maxUsers,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        },
      },
      include: {
        subscriptions: true,
      },
    });

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        email: tenant.email,
        businessType: tenant.businessType,
        subscription: tenant.subscriptions[0],
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', issues: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating tenant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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

function getPricePerUser(plan: string): number {
  const prices = {
    basic: 5, // $5 per user per month
    premium: 15, // $15 per user per month
    enterprise: 25, // $25 per user per month
  };

  return prices[plan as keyof typeof prices] || prices.basic;
}