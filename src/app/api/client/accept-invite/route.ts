import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (!token || token.role !== 'CLIENT') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { inviteCode } = await request.json();

    if (!inviteCode) {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      );
    }

    // Encontrar convite pelo código
    const invite = await prisma.clientInvite.findUnique({
      where: { inviteCode },
      include: {
        professional: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!invite) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 404 }
      );
    }

    if (invite.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Invite is no longer valid' },
        { status: 400 }
      );
    }

    if (new Date() > invite.expiresAt) {
      await prisma.clientInvite.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' }
      });

      return NextResponse.json(
        { error: 'Invite has expired' },
        { status: 400 }
      );
    }

    // Verificar se o client já tem um professional
    let client = await prisma.client.findUnique({
      where: { userId: token.sub! }
    });

    if (!client) {
      // Criar perfil de cliente se não existe
      client = await prisma.client.create({
        data: {
          userId: token.sub!,
          professionalId: invite.professionalId,
          status: 'ACTIVE'
        }
      });
    } else if (client.professionalId && client.professionalId !== invite.professionalId) {
      return NextResponse.json(
        { error: 'You already have a professional assigned' },
        { status: 400 }
      );
    } else {
      // Atualizar cliente existente
      client = await prisma.client.update({
        where: { id: client.id },
        data: {
          professionalId: invite.professionalId,
          status: 'ACTIVE'
        }
      });
    }

    // Verificar limite de clientes do professional
    const currentClientsCount = await prisma.client.count({
      where: { professionalId: invite.professionalId }
    });

    if (currentClientsCount > invite.professional.maxClients) {
      return NextResponse.json(
        { error: 'Professional has reached maximum client limit' },
        { status: 400 }
      );
    }

    // Marcar convite como aceito
    await prisma.clientInvite.update({
      where: { id: invite.id },
      data: {
        status: 'ACCEPTED',
        clientId: client.id
      }
    });

    // Marcar outros convites pendentes para o mesmo cliente como expirados
    await prisma.clientInvite.updateMany({
      where: {
        email: token.email,
        status: 'PENDING',
        id: { not: invite.id }
      },
      data: { status: 'DECLINED' }
    });

    return NextResponse.json({
      message: 'Invite accepted successfully',
      professional: {
        name: invite.professional.user.name,
        email: invite.professional.user.email
      }
    });

  } catch (error) {
    console.error('Error accepting invite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (!token || token.role !== 'CLIENT') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Buscar convites pendentes para este usuário
    const invites = await prisma.clientInvite.findMany({
      where: {
        email: token.email,
        status: 'PENDING',
        expiresAt: { gt: new Date() }
      },
      include: {
        professional: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ invites });

  } catch (error) {
    console.error('Error fetching invites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}