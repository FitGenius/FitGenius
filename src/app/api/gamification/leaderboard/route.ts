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
    const period = searchParams.get('period') || 'WEEKLY';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Determinar a data do período
    let periodDate: Date;
    const now = new Date();

    switch (period) {
      case 'WEEKLY':
        periodDate = new Date(now);
        periodDate.setDate(now.getDate() - now.getDay());
        periodDate.setHours(0, 0, 0, 0);
        break;
      case 'MONTHLY':
        periodDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'ALL_TIME':
        periodDate = new Date(2024, 0, 1); // Data fixa para all-time
        break;
      default:
        periodDate = new Date();
    }

    // Buscar top rankings
    const topEntries = await prisma.leaderboardEntry.findMany({
      where: {
        period: period as any,
        periodDate
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            stats: {
              select: {
                level: true,
                totalPoints: true
              }
            }
          }
        }
      },
      orderBy: {
        points: 'desc'
      },
      take: limit
    });

    // Buscar posição do usuário atual
    const userEntry = await prisma.leaderboardEntry.findUnique({
      where: {
        userId_period_periodDate: {
          userId: token.sub!,
          period: period as any,
          periodDate
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            stats: {
              select: {
                level: true,
                totalPoints: true
              }
            }
          }
        }
      }
    });

    // Se o usuário não está no top, buscar vizinhos
    let nearbyEntries: any[] = [];
    if (userEntry && userEntry.rank && userEntry.rank > limit) {
      nearbyEntries = await prisma.leaderboardEntry.findMany({
        where: {
          period: period as any,
          periodDate,
          rank: {
            gte: userEntry.rank - 2,
            lte: userEntry.rank + 2
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              stats: {
                select: {
                  level: true,
                  totalPoints: true
                }
              }
            }
          }
        },
        orderBy: {
          rank: 'asc'
        }
      });
    }

    // Formatar resposta
    const formatEntry = (entry: any) => ({
      rank: entry.rank,
      userId: entry.userId,
      name: entry.user.name,
      avatar: entry.user.image,
      level: entry.user.stats?.level || 1,
      points: entry.points,
      workouts: entry.workouts,
      isCurrentUser: entry.userId === token.sub
    });

    return NextResponse.json({
      period,
      topRanking: topEntries.map(formatEntry),
      userRanking: userEntry ? formatEntry(userEntry) : null,
      nearbyRanking: nearbyEntries.map(formatEntry),
      totalParticipants: await prisma.leaderboardEntry.count({
        where: {
          period: period as any,
          periodDate
        }
      })
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}