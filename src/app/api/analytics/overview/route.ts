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

      // Buscar estatísticas do profissional
      const [
        totalClients,
        activeClients,
        totalWorkouts,
        totalAssessments,
        thisMonthAssessments,
        thisMonthWorkouts,
        recentActivity
      ] = await Promise.all([
        // Total de clientes
        prisma.client.count({
          where: { professionalId: professional.id }
        }),

        // Clientes ativos (que tiveram atividade nos últimos 30 dias)
        prisma.client.count({
          where: {
            professionalId: professional.id,
            OR: [
              {
                workouts: {
                  some: {
                    createdAt: {
                      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    }
                  }
                }
              },
              {
                physicalAssessments: {
                  some: {
                    assessmentDate: {
                      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    }
                  }
                }
              }
            ]
          }
        }),

        // Total de treinos criados
        prisma.workout.count({
          where: { professionalId: professional.id }
        }),

        // Total de avaliações
        prisma.physicalAssessment.count({
          where: { professionalId: professional.id }
        }),

        // Avaliações deste mês
        prisma.physicalAssessment.count({
          where: {
            professionalId: professional.id,
            assessmentDate: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }),

        // Treinos criados este mês
        prisma.workout.count({
          where: {
            professionalId: professional.id,
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }),

        // Atividade recente (últimas avaliações e treinos)
        Promise.all([
          prisma.physicalAssessment.findMany({
            where: { professionalId: professional.id },
            include: {
              client: {
                include: {
                  user: {
                    select: { name: true, email: true }
                  }
                }
              }
            },
            orderBy: { assessmentDate: 'desc' },
            take: 5
          }),
          prisma.workout.findMany({
            where: { professionalId: professional.id },
            include: {
              client: {
                include: {
                  user: {
                    select: { name: true, email: true }
                  }
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          })
        ])
      ]);

      // Estatísticas de crescimento (comparar com mês anterior)
      const lastMonthAssessments = await prisma.physicalAssessment.count({
        where: {
          professionalId: professional.id,
          assessmentDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      });

      const lastMonthWorkouts = await prisma.workout.count({
        where: {
          professionalId: professional.id,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      });

      const assessmentGrowth = lastMonthAssessments > 0
        ? ((thisMonthAssessments - lastMonthAssessments) / lastMonthAssessments) * 100
        : thisMonthAssessments > 0 ? 100 : 0;

      const workoutGrowth = lastMonthWorkouts > 0
        ? ((thisMonthWorkouts - lastMonthWorkouts) / lastMonthWorkouts) * 100
        : thisMonthWorkouts > 0 ? 100 : 0;

      // Combinar e ordenar atividade recente
      const [recentAssessments, recentWorkouts] = recentActivity;
      const combinedActivity = [
        ...recentAssessments.map(a => ({
          type: 'assessment',
          id: a.id,
          date: a.assessmentDate,
          client: a.client.user.name,
          description: 'Nova avaliação física'
        })),
        ...recentWorkouts.map(w => ({
          type: 'workout',
          id: w.id,
          date: w.createdAt,
          client: w.client.user.name,
          description: w.name
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

      return NextResponse.json({
        stats: {
          totalClients,
          activeClients,
          totalWorkouts,
          totalAssessments,
          thisMonthAssessments,
          thisMonthWorkouts,
          assessmentGrowth: Math.round(assessmentGrowth * 10) / 10,
          workoutGrowth: Math.round(workoutGrowth * 10) / 10
        },
        recentActivity: combinedActivity
      });

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

      // Buscar estatísticas do cliente
      const [
        totalWorkouts,
        totalAssessments,
        thisMonthWorkouts,
        thisMonthAssessments,
        recentActivity,
        latestAssessment
      ] = await Promise.all([
        // Total de treinos
        prisma.workout.count({
          where: { clientId: client.id }
        }),

        // Total de avaliações
        prisma.physicalAssessment.count({
          where: { clientId: client.id }
        }),

        // Treinos deste mês
        prisma.workout.count({
          where: {
            clientId: client.id,
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }),

        // Avaliações deste mês
        prisma.physicalAssessment.count({
          where: {
            clientId: client.id,
            assessmentDate: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }),

        // Atividade recente
        Promise.all([
          prisma.physicalAssessment.findMany({
            where: { clientId: client.id },
            include: {
              professional: {
                include: {
                  user: {
                    select: { name: true, email: true }
                  }
                }
              }
            },
            orderBy: { assessmentDate: 'desc' },
            take: 5
          }),
          prisma.workout.findMany({
            where: { clientId: client.id },
            include: {
              professional: {
                include: {
                  user: {
                    select: { name: true, email: true }
                  }
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          })
        ]),

        // Última avaliação
        prisma.physicalAssessment.findFirst({
          where: { clientId: client.id },
          orderBy: { assessmentDate: 'desc' }
        })
      ]);

      // Combinar atividade recente
      const [recentAssessments, recentWorkouts] = recentActivity;
      const combinedActivity = [
        ...recentAssessments.map(a => ({
          type: 'assessment',
          id: a.id,
          date: a.assessmentDate,
          professional: a.professional.user.name,
          description: 'Avaliação física realizada'
        })),
        ...recentWorkouts.map(w => ({
          type: 'workout',
          id: w.id,
          date: w.createdAt,
          professional: w.professional.user.name,
          description: w.name
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

      return NextResponse.json({
        stats: {
          totalWorkouts,
          totalAssessments,
          thisMonthWorkouts,
          thisMonthAssessments,
          hasLatestAssessment: !!latestAssessment,
          daysSinceLastAssessment: latestAssessment
            ? Math.floor((Date.now() - new Date(latestAssessment.assessmentDate).getTime()) / (1000 * 60 * 60 * 24))
            : null
        },
        recentActivity: combinedActivity,
        latestAssessment
      });
    }

    return NextResponse.json(
      { error: 'Invalid role' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}