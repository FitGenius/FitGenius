import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

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

    const clients = await prisma.client.findMany({
      where: { professionalId: professional.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            lastLogin: true
          }
        },
        workouts: {
          select: {
            id: true,
            name: true,
            status: true,
            scheduledDate: true,
            completedAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 3
        },
        _count: {
          select: {
            workouts: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ clients });

  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
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

    // Verificar se o cliente pertence ao professional
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        professionalId: professional.id
      }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found or not authorized' },
        { status: 404 }
      );
    }

    // Remover relacionamento (não deletar o cliente, apenas desassociar)
    await prisma.client.update({
      where: { id: clientId },
      data: {
        professionalId: null,
        status: 'INACTIVE'
      }
    });

    return NextResponse.json({
      message: 'Client relationship removed successfully'
    });

  } catch (error) {
    console.error('Error removing client:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}