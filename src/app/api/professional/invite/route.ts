import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { generateId } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (!token || token.role !== 'PROFESSIONAL') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const professional = await prisma.professional.findUnique({
      where: { userId: token.sub! }
    });

    if (!professional) {
      return NextResponse.json(
        { error: 'Professional profile not found' },
        { status: 404 }
      );
    }

    const { email, message } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Verificar se já existe convite pendente para este email
    const existingInvite = await prisma.clientInvite.findUnique({
      where: {
        professionalId_email: {
          professionalId: professional.id,
          email: email
        }
      }
    });

    if (existingInvite && existingInvite.status === 'PENDING') {
      return NextResponse.json(
        { error: 'Already sent invite to this email' },
        { status: 400 }
      );
    }

    // Verificar limite de clientes
    const currentClientsCount = await prisma.client.count({
      where: { professionalId: professional.id }
    });

    if (currentClientsCount >= professional.maxClients) {
      return NextResponse.json(
        { error: 'Maximum client limit reached' },
        { status: 400 }
      );
    }

    // Gerar código único do convite
    const inviteCode = generateId(8);

    // Data de expiração (7 dias)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = await prisma.clientInvite.create({
      data: {
        professionalId: professional.id,
        email,
        message: message || null,
        inviteCode,
        expiresAt,
        status: 'PENDING'
      }
    });

    return NextResponse.json({
      message: 'Invite sent successfully',
      inviteCode: invite.inviteCode
    });

  } catch (error) {
    console.error('Error creating invite:', error);
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

    if (!token || token.role !== 'PROFESSIONAL') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const professional = await prisma.professional.findUnique({
      where: { userId: token.sub! }
    });

    if (!professional) {
      return NextResponse.json(
        { error: 'Professional profile not found' },
        { status: 404 }
      );
    }

    const invites = await prisma.clientInvite.findMany({
      where: { professionalId: professional.id },
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
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
      }
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