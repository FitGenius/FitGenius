import { prisma } from '@/lib/prisma';
import { ACHIEVEMENTS, AchievementDefinition } from '@/lib/achievements';
import { StreakType } from '@prisma/client';

// Função para verificar e desbloquear conquistas
export async function checkAndUnlockAchievements(
  userId: string,
  category: 'WORKOUT' | 'NUTRITION' | 'ASSESSMENT',
  count?: number
) {
  try {
    // Buscar ou criar stats do usuário
    let userStats = await prisma.userStats.findUnique({
      where: { userId }
    });

    if (!userStats) {
      userStats = await prisma.userStats.create({
        data: { userId }
      });
    }

    // Atualizar contadores baseado na categoria
    const updateData: any = {};
    if (category === 'WORKOUT') {
      updateData.totalWorkouts = { increment: 1 };
      updateData.lastWorkout = new Date();
    }

    await prisma.userStats.update({
      where: { userId },
      data: updateData
    });

    // Verificar conquistas baseadas em contador
    const relevantAchievements = ACHIEVEMENTS.filter(a =>
      a.category === category && a.type === 'COUNTER'
    );

    for (const achievement of relevantAchievements) {
      // Verificar se já foi desbloqueada
      const existing = await prisma.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievement.key
          }
        }
      });

      if (existing) continue;

      // Verificar se atingiu o requisito
      const currentCount = count || userStats.totalWorkouts;
      if (currentCount >= achievement.requirement) {
        await unlockAchievement(userId, achievement);
      }
    }

    // Verificar e atualizar streaks
    await updateStreak(userId, category);

  } catch (error) {
    console.error('Error checking achievements:', error);
  }
}

// Função para desbloquear uma conquista específica
export async function unlockAchievement(
  userId: string,
  achievement: AchievementDefinition
) {
  try {
    // Verificar se a conquista existe no banco
    let dbAchievement = await prisma.achievement.findUnique({
      where: { key: achievement.key }
    });

    // Se não existe, criar
    if (!dbAchievement) {
      dbAchievement = await prisma.achievement.create({
        data: {
          key: achievement.key,
          name: achievement.name,
          description: achievement.description,
          category: achievement.category,
          type: achievement.type,
          icon: achievement.icon,
          points: achievement.points,
          requirement: achievement.requirement,
          tier: achievement.tier
        }
      });
    }

    // Criar registro de conquista do usuário
    await prisma.userAchievement.create({
      data: {
        userId,
        achievementId: dbAchievement.id,
        progress: achievement.requirement
      }
    });

    // Atualizar pontos totais
    await prisma.userStats.update({
      where: { userId },
      data: {
        totalPoints: { increment: achievement.points },
        totalAchievements: { increment: 1 }
      }
    });

    // Criar notificação
    await prisma.notification.create({
      data: {
        userId,
        type: 'ACHIEVEMENT_UNLOCKED',
        title: '🏆 Nova Conquista Desbloqueada!',
        message: `Você desbloqueou: ${achievement.name} - ${achievement.description}`,
        data: JSON.stringify({
          achievementKey: achievement.key,
          points: achievement.points,
          tier: achievement.tier
        })
      }
    });

    return true;
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    return false;
  }
}

// Função para atualizar streak
export async function updateStreak(
  userId: string,
  activity: 'WORKOUT' | 'NUTRITION' | 'ASSESSMENT'
) {
  try {
    const streakType: StreakType = activity === 'WORKOUT' ? 'WORKOUT' :
                                   activity === 'NUTRITION' ? 'NUTRITION' :
                                   'CHECK_IN';

    // Buscar streak atual
    let streak = await prisma.streak.findUnique({
      where: {
        userId_type: {
          userId,
          type: streakType
        }
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!streak) {
      // Criar nova streak
      streak = await prisma.streak.create({
        data: {
          userId,
          type: streakType,
          currentDays: 1,
          longestDays: 1,
          lastActivity: new Date(),
          startDate: today
        }
      });
    } else {
      const lastActivity = new Date(streak.lastActivity);
      lastActivity.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 0) {
        // Mesma data, não atualizar
        return;
      } else if (daysDiff === 1) {
        // Dia consecutivo, incrementar streak
        const newCurrentDays = streak.currentDays + 1;
        const newLongestDays = Math.max(newCurrentDays, streak.longestDays);

        await prisma.streak.update({
          where: { id: streak.id },
          data: {
            currentDays: newCurrentDays,
            longestDays: newLongestDays,
            lastActivity: new Date()
          }
        });

        // Verificar conquistas de streak
        await checkStreakAchievements(userId, streakType, newCurrentDays);

      } else {
        // Quebrou a streak, reiniciar
        await prisma.streak.update({
          where: { id: streak.id },
          data: {
            currentDays: 1,
            lastActivity: new Date(),
            startDate: today
          }
        });
      }
    }
  } catch (error) {
    console.error('Error updating streak:', error);
  }
}

// Função para verificar conquistas de streak
async function checkStreakAchievements(
  userId: string,
  streakType: StreakType,
  currentDays: number
) {
  const streakAchievements = ACHIEVEMENTS.filter(a =>
    a.category === 'CONSISTENCY' &&
    a.type === 'STREAK' &&
    currentDays >= a.requirement
  );

  for (const achievement of streakAchievements) {
    const existing = await prisma.userAchievement.findFirst({
      where: {
        userId,
        achievement: {
          key: achievement.key
        }
      }
    });

    if (!existing) {
      await unlockAchievement(userId, achievement);
    }
  }
}

// Função para calcular e atualizar ranking
export async function updateLeaderboard() {
  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Buscar todos os usuários com stats
    const userStats = await prisma.userStats.findMany({
      include: {
        user: true
      }
    });

    // Atualizar ranking semanal
    for (const stats of userStats) {
      const weeklyWorkouts = await prisma.workout.count({
        where: {
          client: {
            userId: stats.userId
          },
          createdAt: {
            gte: weekStart
          }
        }
      });

      await prisma.leaderboardEntry.upsert({
        where: {
          userId_period_periodDate: {
            userId: stats.userId,
            period: 'WEEKLY',
            periodDate: weekStart
          }
        },
        create: {
          userId: stats.userId,
          period: 'WEEKLY',
          periodDate: weekStart,
          points: stats.totalPoints,
          workouts: weeklyWorkouts
        },
        update: {
          points: stats.totalPoints,
          workouts: weeklyWorkouts
        }
      });
    }

    // Atualizar ranking mensal
    for (const stats of userStats) {
      const monthlyWorkouts = await prisma.workout.count({
        where: {
          client: {
            userId: stats.userId
          },
          createdAt: {
            gte: monthStart
          }
        }
      });

      await prisma.leaderboardEntry.upsert({
        where: {
          userId_period_periodDate: {
            userId: stats.userId,
            period: 'MONTHLY',
            periodDate: monthStart
          }
        },
        create: {
          userId: stats.userId,
          period: 'MONTHLY',
          periodDate: monthStart,
          points: stats.totalPoints,
          workouts: monthlyWorkouts
        },
        update: {
          points: stats.totalPoints,
          workouts: monthlyWorkouts
        }
      });
    }

    // Atualizar ranking all-time
    for (const stats of userStats) {
      await prisma.leaderboardEntry.upsert({
        where: {
          userId_period_periodDate: {
            userId: stats.userId,
            period: 'ALL_TIME',
            periodDate: new Date(2024, 0, 1) // Data fixa para all-time
          }
        },
        create: {
          userId: stats.userId,
          period: 'ALL_TIME',
          periodDate: new Date(2024, 0, 1),
          points: stats.totalPoints,
          workouts: stats.totalWorkouts
        },
        update: {
          points: stats.totalPoints,
          workouts: stats.totalWorkouts
        }
      });
    }

    // Atualizar posições (rank)
    await updateRankPositions('WEEKLY', weekStart);
    await updateRankPositions('MONTHLY', monthStart);
    await updateRankPositions('ALL_TIME', new Date(2024, 0, 1));

  } catch (error) {
    console.error('Error updating leaderboard:', error);
  }
}

// Função auxiliar para atualizar posições do ranking
async function updateRankPositions(
  period: 'WEEKLY' | 'MONTHLY' | 'ALL_TIME',
  periodDate: Date
) {
  const entries = await prisma.leaderboardEntry.findMany({
    where: {
      period,
      periodDate
    },
    orderBy: {
      points: 'desc'
    }
  });

  for (let i = 0; i < entries.length; i++) {
    await prisma.leaderboardEntry.update({
      where: { id: entries[i].id },
      data: { rank: i + 1 }
    });

    // Atualizar rank no userStats para all-time
    if (period === 'ALL_TIME') {
      await prisma.userStats.update({
        where: { userId: entries[i].userId },
        data: { rank: i + 1 }
      });
    }
  }
}

// Função para criar um desafio
export async function createChallenge(
  name: string,
  description: string,
  type: 'INDIVIDUAL' | 'TEAM' | 'GLOBAL',
  target: number,
  reward: number,
  duration: number, // dias
  createdBy?: string
) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + duration);

  return await prisma.challenge.create({
    data: {
      name,
      description,
      type,
      startDate,
      endDate,
      target,
      reward,
      createdBy
    }
  });
}

// Função para participar de um desafio
export async function joinChallenge(userId: string, challengeId: string) {
  try {
    await prisma.challengeParticipant.create({
      data: {
        userId,
        challengeId
      }
    });

    // Verificar conquista de primeiro desafio
    const firstChallenge = ACHIEVEMENTS.find(a => a.key === 'first_challenge');
    if (firstChallenge) {
      const existing = await prisma.userAchievement.findFirst({
        where: {
          userId,
          achievement: {
            key: firstChallenge.key
          }
        }
      });

      if (!existing) {
        await unlockAchievement(userId, firstChallenge);
      }
    }

    return true;
  } catch (error) {
    console.error('Error joining challenge:', error);
    return false;
  }
}

// Função para atualizar progresso do desafio
export async function updateChallengeProgress(
  userId: string,
  challengeId: string,
  progress: number
) {
  try {
    const participant = await prisma.challengeParticipant.findUnique({
      where: {
        userId_challengeId: {
          userId,
          challengeId
        }
      },
      include: {
        challenge: true
      }
    });

    if (!participant) return false;

    const newProgress = Math.min(participant.progress + progress, participant.challenge.target);
    const completed = newProgress >= participant.challenge.target;

    await prisma.challengeParticipant.update({
      where: { id: participant.id },
      data: {
        progress: newProgress,
        completed,
        completedAt: completed ? new Date() : null
      }
    });

    // Se completou, adicionar recompensa
    if (completed && !participant.completed) {
      await prisma.userStats.update({
        where: { userId },
        data: {
          totalPoints: { increment: participant.challenge.reward }
        }
      });

      // Verificar conquista de vencer desafio
      const winnerAchievement = ACHIEVEMENTS.find(a => a.key === 'challenge_winner');
      if (winnerAchievement) {
        const existing = await prisma.userAchievement.findFirst({
          where: {
            userId,
            achievement: {
              key: winnerAchievement.key
            }
          }
        });

        if (!existing) {
          await unlockAchievement(userId, winnerAchievement);
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating challenge progress:', error);
    return false;
  }
}