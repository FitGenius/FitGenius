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
    const clientId = searchParams.get('clientId');

    let whereClause: any = {};

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

      whereClause.professionalId = professional.id;

      if (clientId) {
        // Verificar se o cliente pertence ao professional
        const client = await prisma.client.findFirst({
          where: {
            id: clientId,
            professionalId: professional.id
          }
        });

        if (!client) {
          return NextResponse.json(
            { error: 'Client not found or not authorized' },
            { status: 404 }
          );
        }

        whereClause.clientId = clientId;
      }
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

      whereClause.clientId = client.id;
    }

    const assessments = await prisma.physicalAssessment.findMany({
      where: whereClause,
      include: {
        client: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        professional: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: {
        assessmentDate: 'desc'
      }
    });

    return NextResponse.json({ assessments });

  } catch (error) {
    console.error('Error fetching assessments:', error);
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
      clientId,
      assessmentDate,
      weight,
      height,
      bodyFat,
      muscleMass,
      waist,
      chest,
      arm,
      thigh,
      hip,
      restingHR,
      bloodPressure,
      notes,
      photos
    } = await request.json();

    if (!clientId || !assessmentDate) {
      return NextResponse.json(
        { error: 'Client ID and assessment date are required' },
        { status: 400 }
      );
    }

    // Verificar se o cliente pertence ao professional
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        professionalId: professional.id
      }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found or not authorized' },
        { status: 404 }
      );
    }

    // Calcular BMI se peso e altura estiverem disponíveis
    let bmi = null;
    if (weight && height) {
      const heightInMeters = height / 100;
      bmi = weight / (heightInMeters * heightInMeters);
    }

    const assessment = await prisma.physicalAssessment.create({
      data: {
        clientId,
        professionalId: professional.id,
        assessmentDate: new Date(assessmentDate),
        weight: weight || null,
        height: height || null,
        bodyFat: bodyFat || null,
        muscleMass: muscleMass || null,
        bmi,
        waist: waist || null,
        chest: chest || null,
        arm: arm || null,
        thigh: thigh || null,
        hip: hip || null,
        restingHR: restingHR || null,
        bloodPressure: bloodPressure || null,
        notes: notes || null,
        photos: photos ? JSON.stringify(photos) : null
      },
      include: {
        client: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                image: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Assessment created successfully',
      assessment
    });

  } catch (error) {
    console.error('Error creating assessment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}