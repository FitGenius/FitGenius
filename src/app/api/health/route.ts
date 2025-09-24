import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const checks = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      status: 'healthy',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: 'unknown',
      redis: 'unknown',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
        limit: Math.round(process.memoryUsage().rss / 1024 / 1024 * 100) / 100
      },
      cpu: {
        usage: process.cpuUsage(),
        load: process.platform === 'linux' ? require('os').loadavg() : [0, 0, 0]
      }
    };

    // Database health check
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = 'healthy';
    } catch (error) {
      checks.database = 'unhealthy';
      checks.status = 'degraded';
      console.error('Database health check failed:', error);
    }

    // Redis health check (if available)
    try {
      // Add Redis ping here if using Redis
      checks.redis = 'not_configured';
    } catch (error) {
      checks.redis = 'unhealthy';
      console.error('Redis health check failed:', error);
    }

    // Overall status determination
    if (checks.database === 'unhealthy') {
      checks.status = 'unhealthy';
      return NextResponse.json(checks, { status: 503 });
    }

    if (checks.database === 'degraded' || checks.redis === 'unhealthy') {
      checks.status = 'degraded';
      return NextResponse.json(checks, { status: 200 });
    }

    return NextResponse.json(checks, { status: 200 });
  } catch (error) {
    console.error('Health check error:', error);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      error: 'Internal server error',
      uptime: process.uptime()
    }, { status: 503 });
  }
}

export async function HEAD() {
  // Simple health check for load balancers
  try {
    await prisma.$queryRaw`SELECT 1`;
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}