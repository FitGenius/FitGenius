import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { checkAndUnlockAchievements } from '@/lib/gamification';

export async function POST(request: NextRequest) {
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

    const { workoutId } = await request.json();

    if (!workoutId) {
      return NextResponse.json(
        { error: 'Workout ID is required' },
        { status: 400 }
      );
    }

    // Verificar se o treino pertence ao usuário
    const workout = await prisma.workout.findFirst({
      where: {
        id: workoutId,
        client: {
          userId: token.sub!
        }
      }
    });

    if (!workout) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      );
    }

    // Marcar treino como concluído
    await prisma.workout.update({
      where: { id: workoutId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    // Verificar e desbloquear conquistas
    await checkAndUnlockAchievements(token.sub!, 'WORKOUT');

    // Buscar estatisticas atualizadas
    const userStats = await prisma.userStats.findUnique({
      where: { userId: token.sub! },
      select: {
        totalWorkouts: true,
        totalPoints: true,
        level: true
      }
    });

    return NextResponse.json({
      message: 'Workout completed successfully',
      stats: userStats
    });

  } catch (error) {
    console.error('Error completing workout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}