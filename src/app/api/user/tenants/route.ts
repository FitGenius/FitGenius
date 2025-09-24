import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/user/tenants
 * Get all tenants the user has access to
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user with tenant information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            primaryColor: true,
            secondaryColor: true,
            businessType: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const tenants = [];

    // Add user's primary tenant
    if (user.tenant) {
      tenants.push({
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        logo: user.tenant.logo,
        primaryColor: user.tenant.primaryColor,
        secondaryColor: user.tenant.secondaryColor,
        businessType: user.tenant.businessType,
        userRole: user.role,
        lastAccessed: user.lastLoginAt,
        isPrimary: true,
      });
    }

    // If user is SUPER_ADMIN, they can access all tenants
    if (user.role === 'SUPER_ADMIN') {
      const allTenants = await prisma.tenant.findMany({
        where: {
          isActive: true,
          id: { not: user.tenantId }, // Exclude primary tenant (already added)
        },
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          primaryColor: true,
          secondaryColor: true,
          businessType: true,
        },
        orderBy: { name: 'asc' },
      });

      allTenants.forEach(tenant => {
        tenants.push({
          ...tenant,
          userRole: 'SUPER_ADMIN',
          lastAccessed: null,
          isPrimary: false,
        });
      });
    }

    // TODO: Add support for users who are members of multiple tenants
    // This would require a UserTenantAccess junction table

    return NextResponse.json({
      tenants: tenants.sort((a, b) => {
        // Primary tenant first, then by last accessed, then by name
        if (a.isPrimary) return -1;
        if (b.isPrimary) return 1;
        if (a.lastAccessed && !b.lastAccessed) return -1;
        if (!a.lastAccessed && b.lastAccessed) return 1;
        return a.name.localeCompare(b.name);
      }),
    });
  } catch (error) {
    console.error('Error fetching user tenants:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}