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

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    let whereClause: any = { clientId };

    // Verificar autorização
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
    } else if (token.role === 'CLIENT') {
      const client = await prisma.client.findUnique({
        where: { userId: token.sub! }
      });

      if (!client || client.id !== clientId) {
        return NextResponse.json(
          { error: 'Unauthorized to view this client data' },
          { status: 403 }
        );
      }
    }

    // Buscar todas as avaliações do cliente
    const assessments = await prisma.physicalAssessment.findMany({
      where: whereClause,
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
        hip: true,
        restingHR: true
      }
    });

    if (assessments.length === 0) {
      return NextResponse.json({
        progress: [],
        summary: {
          totalAssessments: 0,
          firstAssessment: null,
          lastAssessment: null,
          changes: {}
        }
      });
    }

    const firstAssessment = assessments[0];
    const lastAssessment = assessments[assessments.length - 1];

    // Calcular mudanças entre primeira e última avaliação
    const calculateChange = (first: number | null, last: number | null) => {
      if (first === null || last === null) return null;
      return {
        absolute: last - first,
        percentage: first !== 0 ? ((last - first) / Math.abs(first)) * 100 : 0
      };
    };

    const changes = {
      weight: calculateChange(firstAssessment.weight, lastAssessment.weight),
      bodyFat: calculateChange(firstAssessment.bodyFat, lastAssessment.bodyFat),
      muscleMass: calculateChange(firstAssessment.muscleMass, lastAssessment.muscleMass),
      bmi: calculateChange(firstAssessment.bmi, lastAssessment.bmi),
      waist: calculateChange(firstAssessment.waist, lastAssessment.waist),
      chest: calculateChange(firstAssessment.chest, lastAssessment.chest),
      arm: calculateChange(firstAssessment.arm, lastAssessment.arm),
      thigh: calculateChange(firstAssessment.thigh, lastAssessment.thigh),
      hip: calculateChange(firstAssessment.hip, lastAssessment.hip),
      restingHR: calculateChange(firstAssessment.restingHR, lastAssessment.restingHR)
    };

    // Preparar dados para gráficos (últimos 12 meses ou todas se menos que 12)
    const maxPoints = 12;
    const progressData = assessments.length > maxPoints
      ? assessments.slice(-maxPoints)
      : assessments;

    const progress = progressData.map(assessment => ({
      date: assessment.assessmentDate,
      weight: assessment.weight,
      bodyFat: assessment.bodyFat,
      muscleMass: assessment.muscleMass,
      bmi: assessment.bmi,
      waist: assessment.waist,
      chest: assessment.chest,
      arm: assessment.arm,
      thigh: assessment.thigh,
      hip: assessment.hip,
      restingHR: assessment.restingHR
    }));

    const summary = {
      totalAssessments: assessments.length,
      firstAssessment: firstAssessment.assessmentDate,
      lastAssessment: lastAssessment.assessmentDate,
      changes
    };

    return NextResponse.json({
      progress,
      summary
    });

  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}