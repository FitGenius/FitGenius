import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/options';
import { getTenantContext, checkTenantPermission } from '@/lib/tenant/tenant-context';
import { sendInvitationEmail } from '@/lib/email/invitation-email';
import { z } from 'zod';
import { randomBytes } from 'crypto';

const invitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['TENANT_ADMIN', 'MANAGER', 'TRAINER', 'USER']),
  name: z.string().min(1).max(100),
});

const bulkInvitationSchema = z.object({
  invitations: z.array(invitationSchema).min(1).max(50),
});

/**
 * POST /api/tenants/[tenantId]/invitations
 * Send invitations to join tenant
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = params.tenantId;

    // Check if user has permission to invite users
    const hasPermission = await checkTenantPermission(
      session.user.id,
      tenantId,
      'users.invite'
    );

    if (!hasPermission) {
      // Allow super admins to invite users to any tenant during onboarding
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      if (user?.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
    }

    const body = await request.json();
    const validatedData = bulkInvitationSchema.parse(body);

    // Get tenant information
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

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Check subscription limits
    const currentUserCount = await prisma.user.count({
      where: { tenantId },
    });

    const activeSubscription = tenant.subscriptions[0];
    if (activeSubscription && currentUserCount + validatedData.invitations.length > activeSubscription.maxUsers) {
      return NextResponse.json(
        {
          error: 'User limit exceeded',
          message: `Cannot invite ${validatedData.invitations.length} users. Current: ${currentUserCount}, Limit: ${activeSubscription.maxUsers}`,
        },
        { status: 400 }
      );
    }

    const invitationResults = [];
    const errors = [];

    for (const invitationData of validatedData.invitations) {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: invitationData.email },
        });

        if (existingUser && existingUser.tenantId === tenantId) {
          errors.push({
            email: invitationData.email,
            error: 'User already exists in this tenant',
          });
          continue;
        }

        // Generate invitation token
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Create invitation
        const invitation = await prisma.tenantInvitation.create({
          data: {
            tenantId,
            email: invitationData.email,
            name: invitationData.name,
            role: invitationData.role,
            token,
            expiresAt,
            invitedById: session.user.id,
          },
        });

        // Send invitation email
        await sendInvitationEmail({
          email: invitationData.email,
          name: invitationData.name,
          tenantName: tenant.name,
          inviterName: session.user.name || 'Equipe',
          inviteUrl: `${process.env.NEXTAUTH_URL}/invite/${token}`,
          role: getRoleDisplayName(invitationData.role),
        });

        invitationResults.push({
          id: invitation.id,
          email: invitationData.email,
          name: invitationData.name,
          role: invitationData.role,
          status: 'sent',
        });
      } catch (error) {
        console.error(`Error creating invitation for ${invitationData.email}:`, error);
        errors.push({
          email: invitationData.email,
          error: 'Failed to create invitation',
        });
      }
    }

    return NextResponse.json({
      invitations: invitationResults,
      errors: errors.length > 0 ? errors : undefined,
      message: `${invitationResults.length} invitation(s) sent successfully`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', issues: error.issues },
        { status: 400 }
      );
    }

    console.error('Error sending invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tenants/[tenantId]/invitations
 * Get pending invitations for tenant
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = params.tenantId;

    // Check permissions
    const hasPermission = await checkTenantPermission(
      session.user.id,
      tenantId,
      'users.view'
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const invitations = await prisma.tenantInvitation.findMany({
      where: {
        tenantId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      invitations: invitations.map(invitation => ({
        id: invitation.id,
        email: invitation.email,
        name: invitation.name,
        role: invitation.role,
        status: invitation.status,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt,
        invitedBy: invitation.invitedBy,
      })),
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tenants/[tenantId]/invitations
 * Cancel invitation
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get('invitationId');

    if (!invitationId) {
      return NextResponse.json({ error: 'Invitation ID required' }, { status: 400 });
    }

    const invitation = await prisma.tenantInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Check permissions
    const hasPermission = await checkTenantPermission(
      session.user.id,
      invitation.tenantId,
      'users.manage'
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await prisma.tenantInvitation.update({
      where: { id: invitationId },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({ message: 'Invitation cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getRoleDisplayName(role: string): string {
  const roleNames = {
    'TENANT_ADMIN': 'Administrador',
    'MANAGER': 'Gerente',
    'TRAINER': 'Treinador',
    'USER': 'Usuário',
  };

  return roleNames[role as keyof typeof roleNames] || role;
}