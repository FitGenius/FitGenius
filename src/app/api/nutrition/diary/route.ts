import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

// GET - Buscar entradas do diário alimentar
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

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const date = dateParam ? new Date(dateParam) : new Date();

    // Início e fim do dia para buscar entradas
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const entries = await prisma.foodEntry.findMany({
      where: {
        clientId: client.id,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        food: true
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Calcular totais do dia
    let totalCalories = 0;
    let totalCarbs = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalFiber = 0;

    entries.forEach(entry => {
      const ratio = entry.quantity / 100; // converter para proporção de 100g
      totalCalories += entry.food.calories * ratio;
      totalCarbs += entry.food.carbs * ratio;
      totalProtein += entry.food.protein * ratio;
      totalFat += entry.food.fat * ratio;
      if (entry.food.fiber) totalFiber += entry.food.fiber * ratio;
    });

    // Agrupar por refeição
    const entriesByMeal = entries.reduce((acc, entry) => {
      if (!acc[entry.meal]) {
        acc[entry.meal] = [];
      }
      acc[entry.meal].push(entry);
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      date: date.toISOString().split('T')[0],
      entries: entriesByMeal,
      totals: {
        calories: Math.round(totalCalories),
        carbs: Math.round(totalCarbs * 10) / 10,
        protein: Math.round(totalProtein * 10) / 10,
        fat: Math.round(totalFat * 10) / 10,
        fiber: Math.round(totalFiber * 10) / 10
      }
    });

  } catch (error) {
    console.error('Error fetching food diary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Adicionar entrada no diário alimentar
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

    const client = await prisma.client.findUnique({
      where: { userId: token.sub! }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    const { foodId, quantity, meal, date } = await request.json();

    if (!foodId || !quantity || !meal) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verificar se o alimento existe
    const food = await prisma.food.findUnique({
      where: { id: foodId }
    });

    if (!food) {
      return NextResponse.json(
        { error: 'Food not found' },
        { status: 404 }
      );
    }

    const entryDate = date ? new Date(date) : new Date();

    const entry = await prisma.foodEntry.create({
      data: {
        clientId: client.id,
        foodId,
        quantity,
        meal,
        date: entryDate
      },
      include: {
        food: true
      }
    });

    return NextResponse.json(entry, { status: 201 });

  } catch (error) {
    console.error('Error creating food entry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remover entrada do diário
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get('id');

    if (!entryId) {
      return NextResponse.json(
        { error: 'Entry ID required' },
        { status: 400 }
      );
    }

    // Verificar se a entrada pertence ao cliente
    const entry = await prisma.foodEntry.findFirst({
      where: {
        id: entryId,
        clientId: client.id
      }
    });

    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    await prisma.foodEntry.delete({
      where: { id: entryId }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting food entry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}