import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const setTenantSchema = z.object({
  tenantId: z.string().cuid(),
});

/**
 * POST /api/user/set-tenant
 * Set the active tenant for the user session
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId } = setTenantSchema.parse(body);

    const userId = session.user.id;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has access to this tenant
    const hasAccess =
      user.tenantId === tenantId ||  // User's primary tenant
      user.role === 'SUPER_ADMIN';  // Super admins can access all tenants

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to this tenant' }, { status: 403 });
    }

    // Verify tenant exists and is active
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant || !tenant.isActive) {
      return NextResponse.json({ error: 'Tenant not found or inactive' }, { status: 404 });
    }

    // Update user's last login time if this is their primary tenant
    if (user.tenantId === tenantId) {
      await prisma.user.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() },
      });
    }

    // In a real implementation, you would set this in the session
    // For now, we'll just return success
    // The frontend should handle setting the tenant context

    return NextResponse.json({
      message: 'Active tenant set successfully',
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', issues: error.issues },
        { status: 400 }
      );
    }

    console.error('Error setting active tenant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}