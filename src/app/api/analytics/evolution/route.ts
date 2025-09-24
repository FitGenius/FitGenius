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
    const period = searchParams.get('period') || '6m'; // 1m, 3m, 6m, 1y, all
    const type = searchParams.get('type') || 'weight';

    // Calcular data de início baseada no período
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '1m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '3m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case '6m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case '1y':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(2020, 0, 1); // Data muito antiga para pegar todos
    }

    // Buscar cliente do usuário
    const client = await prisma.client.findUnique({
      where: { userId: token.sub! }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Buscar avaliações físicas ordenadas por data
    const assessments = await prisma.physicalAssessment.findMany({
      where: {
        clientId: client.id,
        assessmentDate: {
          gte: startDate
        }
      },
      orderBy: {
        assessmentDate: 'asc'
      },
      select: {
        id: true,
        assessmentDate: true,
        weight: true,
        height: true,
        bodyFat: true,
        muscleMass: true,
        bmi: true,
        waist: true,
        chest: true,
        arm: true,
        thigh: true,
        hip: true
      }
    });

    // Buscar dados de treinos (força/performance)
    const workouts = await prisma.workout.findMany({
      where: {
        clientId: client.id,
        status: 'COMPLETED',
        completedAt: {
          gte: startDate
        }
      },
      include: {
        exercises: {
          include: {
            exercise: {
              select: {
                name: true,
                category: true
              }
            }
          }
        }
      },
      orderBy: {
        completedAt: 'asc'
      }
    });

    // Processar dados baseado no tipo solicitado
    let evolutionData: any[] = [];

    switch (type) {
      case 'weight':
        evolutionData = assessments.map(assessment => ({
          date: assessment.assessmentDate,
          weight: assessment.weight,
          bmi: assessment.bmi
        })).filter(item => item.weight);
        break;

      case 'body_composition':
        evolutionData = assessments.map(assessment => ({
          date: assessment.assessmentDate,
          bodyFat: assessment.bodyFat,
          muscleMass: assessment.muscleMass,
          weight: assessment.weight
        })).filter(item => item.bodyFat || item.muscleMass);
        break;

      case 'measurements':
        evolutionData = assessments.map(assessment => ({
          date: assessment.assessmentDate,
          waist: assessment.waist,
          chest: assessment.chest,
          arm: assessment.arm,
          thigh: assessment.thigh,
          hip: assessment.hip
        })).filter(item => item.waist || item.chest || item.arm);
        break;

      case 'performance':
        // Agrupar exercícios por categoria e calcular médias de peso
        const performanceMap = new Map();
        
        workouts.forEach(workout => {
          if (!workout.completedAt) return;
          
          const date = workout.completedAt.toISOString().split('T')[0];
          
          workout.exercises.forEach(we => {
            if (we.weight && we.weight > 0) {
              const key = `${date}-${we.exercise.name}`;
              if (!performanceMap.has(key)) {
                performanceMap.set(key, {
                  date: workout.completedAt,
                  exercise: we.exercise.name,
                  category: we.exercise.category,
                  weights: []
                });
              }
              performanceMap.get(key).weights.push(we.weight);
            }
          });
        });
        
        evolutionData = Array.from(performanceMap.values()).map(item => ({
          date: item.date,
          exercise: item.exercise,
          category: item.category,
          maxWeight: Math.max(...item.weights),
          avgWeight: item.weights.reduce((a, b) => a + b, 0) / item.weights.length
        }));
        break;
    }

    // Calcular estatísticas
    const stats = calculateStats(evolutionData, type);

    return NextResponse.json({
      data: evolutionData,
      stats,
      period,
      type
    });

  } catch (error) {
    console.error('Error fetching evolution data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateStats(data: any[], type: string) {
  if (data.length === 0) return null;

  const stats: any = {
    totalRecords: data.length,
    dateRange: {
      start: data[0]?.date,
      end: data[data.length - 1]?.date
    }
  };

  switch (type) {
    case 'weight':
      const weights = data.map(d => d.weight).filter(w => w);
      if (weights.length > 0) {
        stats.weight = {
          current: weights[weights.length - 1],
          initial: weights[0],
          change: weights[weights.length - 1] - weights[0],
          min: Math.min(...weights),
          max: Math.max(...weights)
        };
      }
      break;

    case 'body_composition':
      const bodyFats = data.map(d => d.bodyFat).filter(bf => bf);
      const muscleMasses = data.map(d => d.muscleMass).filter(mm => mm);
      
      if (bodyFats.length > 0) {
        stats.bodyFat = {
          current: bodyFats[bodyFats.length - 1],
          initial: bodyFats[0],
          change: bodyFats[bodyFats.length - 1] - bodyFats[0]
        };
      }
      
      if (muscleMasses.length > 0) {
        stats.muscleMass = {
          current: muscleMasses[muscleMasses.length - 1],
          initial: muscleMasses[0],
          change: muscleMasses[muscleMasses.length - 1] - muscleMasses[0]
        };
      }
      break;

    case 'measurements':
      ['waist', 'chest', 'arm', 'thigh', 'hip'].forEach(measurement => {
        const values = data.map(d => d[measurement]).filter(v => v);
        if (values.length > 0) {
          stats[measurement] = {
            current: values[values.length - 1],
            initial: values[0],
            change: values[values.length - 1] - values[0]
          };
        }
      });
      break;

    case 'performance':
      const exerciseStats = {};
      data.forEach(item => {
        if (!exerciseStats[item.exercise]) {
          exerciseStats[item.exercise] = {
            records: [],
            category: item.category
          };
        }
        exerciseStats[item.exercise].records.push({
          date: item.date,
          maxWeight: item.maxWeight,
          avgWeight: item.avgWeight
        });
      });
      
      Object.keys(exerciseStats).forEach(exercise => {
        const records = exerciseStats[exercise].records;
        if (records.length > 0) {
          const maxWeights = records.map(r => r.maxWeight);
          exerciseStats[exercise].improvement = {
            initial: maxWeights[0],
            current: maxWeights[maxWeights.length - 1],
            change: maxWeights[maxWeights.length - 1] - maxWeights[0],
            best: Math.max(...maxWeights)
          };
        }
      });
      
      stats.exercises = exerciseStats;
      break;
  }

  return stats;
}