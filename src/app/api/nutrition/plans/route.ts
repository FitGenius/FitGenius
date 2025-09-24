import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

// GET - Buscar planos nutricionais
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

    const client = await prisma.client.findUnique({
      where: { userId: token.sub! }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    const plans = await prisma.nutritionPlan.findMany({
      where: { clientId: client.id },
      include: {
        createdBy: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        meals: {
          include: {
            foods: {
              include: {
                food: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ plans });

  } catch (error) {
    console.error('Error fetching nutrition plans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Criar novo plano nutricional (apenas profissionais)
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
        { error: 'Professional not found' },
        { status: 404 }
      );
    }

    const {
      clientId,
      title,
      description,
      duration,
      dailyCalories,
      dailyCarbs,
      dailyProtein,
      dailyFat,
      dailyFiber,
      dailyWater,
      meals,
      notes
    } = await request.json();

    if (!clientId || !title || !dailyCalories || !meals) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verificar se o cliente pertence ao profissional
    const clientExists = await prisma.client.findFirst({
      where: {
        id: clientId,
        professionalId: professional.id
      }
    });

    if (!clientExists) {
      return NextResponse.json(
        { error: 'Client not found or not assigned to this professional' },
        { status: 404 }
      );
    }

    const plan = await prisma.nutritionPlan.create({
      data: {
        clientId,
        createdById: professional.id,
        title,
        description,
        duration,
        dailyCalories,
        dailyCarbs,
        dailyProtein,
        dailyFat,
        dailyFiber,
        dailyWater,
        notes,
        meals: {
          create: meals.map((meal: any) => ({
            name: meal.name,
            time: meal.time,
            description: meal.description,
            foods: {
              create: meal.foods?.map((food: any) => ({
                foodId: food.foodId,
                quantity: food.quantity,
                notes: food.notes
              })) || []
            }
          }))
        }
      },
      include: {
        meals: {
          include: {
            foods: {
              include: {
                food: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(plan, { status: 201 });

  } catch (error) {
    console.error('Error creating nutrition plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}