import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '@/lib/email/invitation-email';

const acceptInvitationSchema = z.object({
  password: z.string().min(8),
});

/**
 * GET /api/invitations/[token]
 * Get invitation details by token
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;

    const invitation = await prisma.tenantInvitation.findUnique({
      where: { token },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            logo: true,
            primaryColor: true,
            secondaryColor: true,
            businessType: true,
          },
        },
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json({ error: 'Invitation is no longer valid' }, { status: 410 });
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 });
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        name: invitation.name,
        role: getRoleDisplayName(invitation.role),
        tenant: invitation.tenant,
        invitedBy: invitation.invitedBy,
        expiresAt: invitation.expiresAt,
        status: invitation.status,
      },
    });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invitations/[token]/accept
 * Accept invitation and create user account
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    const body = await request.json();
    const { password } = acceptInvitationSchema.parse(body);

    // Get invitation
    const invitation = await prisma.tenantInvitation.findUnique({
      where: { token },
      include: {
        tenant: true,
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json({ error: 'Invitation already used or cancelled' }, { status: 400 });
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      // If user exists but not in this tenant, add them to the tenant
      if (existingUser.tenantId !== invitation.tenantId) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            tenantId: invitation.tenantId,
            role: invitation.role,
          },
        });

        // Update invitation status
        await prisma.tenantInvitation.update({
          where: { id: invitation.id },
          data: { status: 'ACCEPTED' },
        });

        return NextResponse.json({
          message: 'User added to tenant successfully',
          user: {
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
          },
        });
      } else {
        return NextResponse.json({ error: 'User already exists in this tenant' }, { status: 400 });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user account
    const newUser = await prisma.user.create({
      data: {
        email: invitation.email,
        name: invitation.name,
        password: hashedPassword,
        role: invitation.role,
        tenantId: invitation.tenantId,
        emailVerified: new Date(), // Auto-verify since they're accepting an invitation
      },
    });

    // Update invitation status
    await prisma.tenantInvitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' },
    });

    // Send welcome email
    try {
      await sendWelcomeEmail({
        email: newUser.email,
        name: newUser.name || 'Usuário',
        tenantName: invitation.tenant.name,
        loginUrl: `${process.env.NEXTAUTH_URL}/login`,
        role: getRoleDisplayName(newUser.role),
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't fail the invitation acceptance if email fails
    }

    return NextResponse.json({
      message: 'Account created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        tenantId: newUser.tenantId,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', issues: error.issues },
        { status: 400 }
      );
    }

    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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