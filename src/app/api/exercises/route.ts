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
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const search = searchParams.get('search');

    let whereClause: any = {
      OR: [
        { isPublic: true },
        token.role === 'PROFESSIONAL' ? {
          createdBy: {
            userId: token.sub
          }
        } : undefined
      ].filter(Boolean)
    };

    if (category) {
      whereClause.category = category;
    }

    if (difficulty) {
      whereClause.difficulty = difficulty;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const exercises = await prisma.exercise.findMany({
      where: whereClause,
      include: {
        createdBy: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            workoutExercises: true
          }
        }
      },
      orderBy: [
        { isPublic: 'desc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({ exercises });

  } catch (error) {
    console.error('Error fetching exercises:', error);
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
      instructions,
      category,
      difficulty,
      muscleGroups,
      equipment,
      videoUrl,
      imageUrl,
      isPublic
    } = await request.json();

    if (!name || !category) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      );
    }

    const exercise = await prisma.exercise.create({
      data: {
        name,
        description: description || null,
        instructions: instructions || null,
        category,
        difficulty: difficulty || 'BEGINNER',
        muscleGroups: muscleGroups ? JSON.stringify(muscleGroups) : null,
        equipment: equipment || null,
        videoUrl: videoUrl || null,
        imageUrl: imageUrl || null,
        isPublic: isPublic || false,
        createdById: professional.id
      },
      include: {
        createdBy: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Exercise created successfully',
      exercise
    });

  } catch (error) {
    console.error('Error creating exercise:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}