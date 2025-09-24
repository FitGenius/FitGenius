import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { ACHIEVEMENTS } from '@/lib/achievements';

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

    // Buscar todas as conquistas do usuário
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId: token.sub! },
      include: {
        achievement: true
      }
    });

    // Mapear conquistas com informações completas
    const unlockedAchievements = userAchievements.map(ua => {
      const definition = ACHIEVEMENTS.find(a => a.key === ua.achievement.key);
      return {
        ...ua.achievement,
        unlockedAt: ua.unlockedAt,
        progress: ua.progress,
        seen: ua.seen,
        icon: definition?.icon || '🏆'
      };
    });

    // Buscar conquistas não desbloqueadas
    const unlockedKeys = userAchievements.map(ua => ua.achievement.key);
    const lockedAchievements = ACHIEVEMENTS.filter(a => !unlockedKeys.includes(a.key));

    // Buscar progresso atual para conquistas bloqueadas
    const userStats = await prisma.userStats.findUnique({
      where: { userId: token.sub! }
    });

    const lockedWithProgress = lockedAchievements.map(achievement => ({
      ...achievement,
      locked: true,
      progress: calculateProgress(achievement, userStats)
    }));

    // Buscar streaks atuais
    const streaks = await prisma.streak.findMany({
      where: {
        userId: token.sub!,
        isActive: true
      }
    });

    return NextResponse.json({
      unlocked: unlockedAchievements,
      locked: lockedWithProgress,
      streaks,
      stats: {
        total: ACHIEVEMENTS.length,
        unlocked: unlockedAchievements.length,
        points: userStats?.totalPoints || 0,
        level: userStats?.level || 1
      }
    });

  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateProgress(achievement: any, userStats: any): number {
  if (!userStats) return 0;

  switch (achievement.category) {
    case 'WORKOUT':
      if (achievement.type === 'COUNTER') {
        return Math.min((userStats.totalWorkouts / achievement.requirement) * 100, 100);
      }
      break;
    case 'CONSISTENCY':
      // Progress será baseado na streak atual
      return 0; // Implementar baseado em streaks
    default:
      return 0;
  }

  return 0;
}

// Marcar conquista como vista
export async function PATCH(request: NextRequest) {
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

    const { achievementIds } = await request.json();

    if (!achievementIds || !Array.isArray(achievementIds)) {
      return NextResponse.json(
        { error: 'Achievement IDs array is required' },
        { status: 400 }
      );
    }

    // Marcar conquistas como vistas
    await prisma.userAchievement.updateMany({
      where: {
        userId: token.sub!,
        achievementId: { in: achievementIds }
      },
      data: {
        seen: true
      }
    });

    return NextResponse.json({
      message: 'Achievements marked as seen'
    });

  } catch (error) {
    console.error('Error updating achievements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}