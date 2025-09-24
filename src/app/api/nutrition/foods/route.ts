import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { searchFoods } from '@/lib/brazilian-foods';

// GET - Buscar alimentos
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
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    let whereClause: any = {
      isPublic: true
    };

    if (category) {
      whereClause.category = category;
    }

    if (query) {
      whereClause.name = {
        contains: query,
        mode: 'insensitive'
      };
    }

    // Buscar alimentos no banco de dados
    const foods = await prisma.food.findMany({
      where: whereClause,
      orderBy: {
        name: 'asc'
      },
      skip: offset,
      take: limit
    });

    // Se não encontrou no banco, buscar no arquivo estático
    let fallbackFoods = [];
    if (foods.length === 0 && query) {
      fallbackFoods = searchFoods(query, limit);
    }

    const total = await prisma.food.count({ where: whereClause });

    return NextResponse.json({
      foods: foods.length > 0 ? foods : fallbackFoods,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching foods:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Criar novo alimento
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
      name,
      brand,
      category,
      servingSize,
      servingUnit,
      calories,
      carbs,
      protein,
      fat,
      fiber,
      sugar,
      sodium,
      vitamins,
      minerals,
      isPublic = false
    } = await request.json();

    if (!name || !category || !calories || carbs === undefined || protein === undefined || fat === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const food = await prisma.food.create({
      data: {
        name,
        brand,
        category,
        servingSize: servingSize || 100,
        servingUnit: servingUnit || 'g',
        calories,
        carbs,
        protein,
        fat,
        fiber,
        sugar,
        sodium,
        vitamins: vitamins ? JSON.stringify(vitamins) : null,
        minerals: minerals ? JSON.stringify(minerals) : null,
        isPublic,
        createdById: professional.id
      }
    });

    return NextResponse.json(food, { status: 201 });

  } catch (error) {
    console.error('Error creating food:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}