import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { getTenantContext, checkTenantPermission } from '@/lib/tenant/tenant-context';
import { z } from 'zod';

const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  granularity: z.enum(['day', 'week', 'month']).default('day'),
  metrics: z.array(z.enum([
    'users',
    'workouts',
    'retention',
    'engagement',
    'features'
  ])).default(['users', 'workouts']),
});

interface AnalyticsData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    totalWorkouts: number;
    avgWorkoutsPerUser: number;
    retentionRate: number;
    avgSessionDuration: number;
    topFeatures: Array<{ name: string; usage: number }>;
  };
  timeSeries: Array<{
    date: string;
    activeUsers: number;
    newUsers: number;
    totalWorkouts: number;
    avgSessionDuration: number;
  }>;
  userSegments: {
    byRole: Record<string, number>;
    byActivity: Record<string, number>;
    byRetention: Record<string, number>;
  };
  workoutAnalytics: {
    topExercises: Array<{ name: string; count: number }>;
    avgWorkoutDuration: number;
    workoutsByType: Record<string, number>;
    completionRate: number;
  };
  featureUsage: Array<{
    feature: string;
    uniqueUsers: number;
    totalUsage: number;
    avgUsagePerUser: number;
  }>;
}

/**
 * GET /api/tenant/analytics
 * Get comprehensive analytics for the tenant
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
      'analytics.view'
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const queryData = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      granularity: searchParams.get('granularity') as 'day' | 'week' | 'month' || 'day',
      metrics: searchParams.get('metrics')?.split(',') || ['users', 'workouts'],
    };

    const validatedQuery = analyticsQuerySchema.parse(queryData);

    // Set default date range (last 30 days)
    const endDate = validatedQuery.endDate ? new Date(validatedQuery.endDate) : new Date();
    const startDate = validatedQuery.startDate
      ? new Date(validatedQuery.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const analytics = await generateAnalytics(tenantContext.id, startDate, endDate, validatedQuery);

    return NextResponse.json(analytics);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', issues: error.issues },
        { status: 400 }
      );
    }

    console.error('Error fetching tenant analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateAnalytics(
  tenantId: string,
  startDate: Date,
  endDate: Date,
  query: z.infer<typeof analyticsQuerySchema>
): Promise<AnalyticsData> {
  // Get basic tenant metrics
  const [
    totalUsers,
    activeUsers,
    newUsers,
    totalWorkouts,
    recentWorkouts,
    userActivity,
  ] = await Promise.all([
    // Total users
    prisma.user.count({
      where: { tenantId },
    }),

    // Active users (logged in last 30 days)
    prisma.user.count({
      where: {
        tenantId,
        lastLoginAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),

    // New users in period
    prisma.user.count({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),

    // Total workouts
    prisma.workout.count({
      where: { tenantId },
    }),

    // Recent workouts for completion rate
    prisma.workout.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        completed: true,
        duration: true,
        type: true,
        exercises: {
          select: {
            exercise: {
              select: { name: true }
            }
          }
        }
      },
    }),

    // User activity for time series
    prisma.$queryRaw`
      SELECT
        DATE(created_at) as date,
        COUNT(CASE WHEN last_login_at >= DATE(created_at) THEN 1 END) as active_users,
        COUNT(*) as new_users
      FROM users
      WHERE tenant_id = ${tenantId}
        AND created_at >= ${startDate}
        AND created_at <= ${endDate}
      GROUP BY DATE(created_at)
      ORDER BY date
    `,
  ]);

  // Calculate derived metrics
  const avgWorkoutsPerUser = totalUsers > 0 ? totalWorkouts / totalUsers : 0;
  const completedWorkouts = recentWorkouts.filter(w => w.completed).length;
  const completionRate = recentWorkouts.length > 0 ? (completedWorkouts / recentWorkouts.length) * 100 : 0;
  const avgWorkoutDuration = recentWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0) / recentWorkouts.length;

  // Workout analytics
  const workoutsByType = recentWorkouts.reduce((acc, workout) => {
    acc[workout.type] = (acc[workout.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Top exercises
  const exerciseCount = recentWorkouts.flatMap(w => w.exercises).reduce((acc, ex) => {
    const name = ex.exercise.name;
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topExercises = Object.entries(exerciseCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Mock some additional data for demo
  const retentionRate = Math.min((activeUsers / totalUsers) * 100, 100) || 0;
  const avgSessionDuration = 1800 + Math.random() * 900; // 30-45 minutes

  // Generate time series data
  const timeSeries = generateTimeSeries(startDate, endDate, query.granularity, {
    totalUsers,
    activeUsers,
    totalWorkouts,
  });

  // User segments
  const userSegments = {
    byRole: await getUsersByRole(tenantId),
    byActivity: {
      'Muito Ativo (>10 treinos/mês)': Math.floor(activeUsers * 0.2),
      'Ativo (5-10 treinos/mês)': Math.floor(activeUsers * 0.4),
      'Moderado (2-5 treinos/mês)': Math.floor(activeUsers * 0.3),
      'Pouco Ativo (<2 treinos/mês)': Math.floor(activeUsers * 0.1),
    },
    byRetention: {
      'Novos (0-30 dias)': newUsers,
      'Ativos (30-90 dias)': Math.floor(activeUsers * 0.4),
      'Fiéis (90+ dias)': Math.floor(activeUsers * 0.6),
    },
  };

  // Feature usage (mock data for now)
  const featureUsage = [
    { feature: 'AI Assistant', uniqueUsers: Math.floor(activeUsers * 0.85), totalUsage: 1240, avgUsagePerUser: 4.2 },
    { feature: 'Workout Tracking', uniqueUsers: Math.floor(activeUsers * 0.95), totalUsage: 2840, avgUsagePerUser: 8.9 },
    { feature: 'Progress Analytics', uniqueUsers: Math.floor(activeUsers * 0.65), totalUsage: 980, avgUsagePerUser: 3.1 },
    { feature: 'Nutrition Tracking', uniqueUsers: Math.floor(activeUsers * 0.55), totalUsage: 750, avgUsagePerUser: 2.8 },
    { feature: 'Social Features', uniqueUsers: Math.floor(activeUsers * 0.35), totalUsage: 420, avgUsagePerUser: 1.9 },
  ];

  return {
    overview: {
      totalUsers,
      activeUsers,
      newUsers,
      totalWorkouts,
      avgWorkoutsPerUser,
      retentionRate,
      avgSessionDuration,
      topFeatures: featureUsage.slice(0, 5).map(f => ({ name: f.feature, usage: f.avgUsagePerUser })),
    },
    timeSeries,
    userSegments,
    workoutAnalytics: {
      topExercises,
      avgWorkoutDuration,
      workoutsByType,
      completionRate,
    },
    featureUsage,
  };
}

async function getUsersByRole(tenantId: string): Promise<Record<string, number>> {
  const roleDistribution = await prisma.user.groupBy({
    by: ['role'],
    where: { tenantId },
    _count: { role: true },
  });

  return roleDistribution.reduce((acc, item) => {
    const roleName = getRoleDisplayName(item.role);
    acc[roleName] = item._count.role;
    return acc;
  }, {} as Record<string, number>);
}

function getRoleDisplayName(role: string): string {
  const roleNames = {
    'SUPER_ADMIN': 'Super Admin',
    'TENANT_ADMIN': 'Administrador',
    'MANAGER': 'Gerente',
    'TRAINER': 'Treinador',
    'USER': 'Usuário',
    'GUEST': 'Visitante',
  };

  return roleNames[role as keyof typeof roleNames] || role;
}

function generateTimeSeries(
  startDate: Date,
  endDate: Date,
  granularity: 'day' | 'week' | 'month',
  baseMetrics: { totalUsers: number; activeUsers: number; totalWorkouts: number }
): AnalyticsData['timeSeries'] {
  const timeSeries: AnalyticsData['timeSeries'] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    // Generate realistic mock data based on base metrics
    const dayOfWeek = current.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Weekend and weekday variations
    const weekendMultiplier = isWeekend ? 0.7 : 1.1;
    const randomVariation = 0.8 + Math.random() * 0.4; // 80-120% variation

    timeSeries.push({
      date: current.toISOString().split('T')[0],
      activeUsers: Math.floor(baseMetrics.activeUsers * 0.1 * weekendMultiplier * randomVariation),
      newUsers: Math.floor(Math.random() * 5 + 1),
      totalWorkouts: Math.floor(baseMetrics.totalWorkouts * 0.05 * weekendMultiplier * randomVariation),
      avgSessionDuration: 1500 + Math.random() * 1200, // 25-45 minutes
    });

    // Increment date based on granularity
    switch (granularity) {
      case 'day':
        current.setDate(current.getDate() + 1);
        break;
      case 'week':
        current.setDate(current.getDate() + 7);
        break;
      case 'month':
        current.setMonth(current.getMonth() + 1);
        break;
    }
  }

  return timeSeries;
}