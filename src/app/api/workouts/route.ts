import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');

    let whereClause: any = {};

    if (token.role === 'PROFESSIONAL') {
      const professional = await prisma.professional.findUnique({
        where: { userId: token.sub! }
      });

      if (!professional) {
        return NextResponse.json(
          { error: 'Professional profile not found' },
          { status: 404 }
        );
      }

      whereClause.professionalId = professional.id;

      if (clientId) {
        whereClause.clientId = clientId;
      }
    } else if (token.role === 'CLIENT') {
      const client = await prisma.client.findUnique({
        where: { userId: token.sub! }
      });

      if (!client) {
        return NextResponse.json(
          { error: 'Client profile not found' },
          { status: 404 }
        );
      }

      whereClause.clientId = client.id;
    }

    if (status) {
      whereClause.status = status;
    }

    const workouts = await prisma.workout.findMany({
      where: whereClause,
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
        },
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
        },
        exercises: {
          include: {
            exercise: true
          },
          orderBy: {
            order: 'asc'
          }
        },
        _count: {
          select: {
            exercises: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ workouts });

  } catch (error) {
    console.error('Error fetching workouts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const {
      name,
      description,
      clientId,
      scheduledDate,
      notes,
      exercises
    } = await request.json();

    if (!name || !clientId) {
      return NextResponse.json(
        { error: 'Name and client ID are required' },
        { status: 400 }
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

    const workout = await prisma.workout.create({
      data: {
        name,
        description: description || null,
        clientId,
        professionalId: professional.id,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        notes: notes || null,
        status: 'DRAFT'
      }
    });

    // Adicionar exercícios se fornecidos
    if (exercises && exercises.length > 0) {
      const workoutExercises = exercises.map((ex: any, index: number) => ({
        workoutId: workout.id,
        exerciseId: ex.exerciseId,
        order: index + 1,
        sets: ex.sets || null,
        reps: ex.reps || null,
        weight: ex.weight || null,
        rest: ex.rest || null,
        notes: ex.notes || null
      }));

      await prisma.workoutExercise.createMany({
        data: workoutExercises
      });
    }

    // Buscar workout completo para retornar
    const completeWorkout = await prisma.workout.findUnique({
      where: { id: workout.id },
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
        },
        exercises: {
          include: {
            exercise: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Workout created successfully',
      workout: completeWorkout
    });

  } catch (error) {
    console.error('Error creating workout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}