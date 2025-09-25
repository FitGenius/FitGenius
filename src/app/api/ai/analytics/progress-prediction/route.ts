import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AIRecommendationEngine } from '@/lib/ai/recommendation-engine';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check subscription for AI analytics
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id }
    });

    if (!subscription || subscription.plan === 'FREE') {
      return NextResponse.json(
        {
          error: 'AI progress analytics require Professional or Enterprise plan',
          upgradeUrl: '/pricing'
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const timeframe = searchParams.get('timeframe') as 'week' | 'month' | 'quarter' || 'month';

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Verify client access
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        professionalId: session.user.id
      },
      include: {
        physicalAssessments: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found or access denied' },
        { status: 404 }
      );
    }

    // Check if client has enough historical data
    if (client.physicalAssessments.length < 3) {
      return NextResponse.json(
        {
          error: 'Insufficient historical data for predictions',
          message: 'At least 3 assessments are needed for accurate predictions',
          currentAssessments: client.physicalAssessments.length,
          requiredAssessments: 3
        },
        { status: 400 }
      );
    }

    const aiEngine = new AIRecommendationEngine();

    // Generate progress predictions
    const predictions = await aiEngine.predictProgress(clientId, timeframe);

    // Calculate additional insights
    const insights = await this.generateProgressInsights(client, predictions);

    // Log AI usage
    await prisma.aiUsage.create({
      data: {
        userId: session.user.id,
        feature: 'PROGRESS_PREDICTION',
        clientId,
        requestData: JSON.stringify({ timeframe }),
        responseCount: 1,
      }
    });

    return NextResponse.json({
      predictions,
      insights,
      timeframe,
      generatedAt: new Date().toISOString(),
      clientProfile: {
        id: client.id,
        name: client.name,
        currentWeight: client.weight,
        fitnessGoal: client.fitnessGoal,
        dataPoints: client.physicalAssessments.length
      }
    });

  } catch (error) {
    console.error('AI progress prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to generate progress predictions' },
      { status: 500 }
    );
  }
}

async function generateProgressInsights(client: unknown, predictions: unknown) {
  const assessments = client.physicalAssessments;

  // Calculate current trends
  const weightTrend = calculateTrend(assessments.slice(0, 5).map((a: unknown) => a.weight).filter(Boolean));
  const bodyFatTrend = calculateTrend(assessments.slice(0, 5).map((a: unknown) => a.bodyFat).filter(Boolean));

  const insights = [];

  // Weight trend analysis
  if (weightTrend > 0.5) {
    insights.push({
      type: 'WARNING',
      category: 'WEIGHT',
      message: 'Weight increasing faster than expected',
      recommendation: 'Consider adjusting caloric intake or increasing cardio'
    });
  } else if (weightTrend < -1) {
    insights.push({
      type: 'WARNING',
      category: 'WEIGHT',
      message: 'Rapid weight loss detected',
      recommendation: 'Ensure adequate nutrition to maintain muscle mass'
    });
  } else if (Math.abs(weightTrend) < 0.1 && client.fitnessGoal === 'WEIGHT_LOSS') {
    insights.push({
      type: 'INFO',
      category: 'PLATEAU',
      message: 'Weight plateau detected',
      recommendation: 'Consider changing workout routine or adjusting macros'
    });
  }

  // Prediction confidence analysis
  if (predictions.weightPrediction.confidence < 60) {
    insights.push({
      type: 'INFO',
      category: 'DATA',
      message: 'Prediction confidence is moderate',
      recommendation: 'More consistent data collection will improve accuracy'
    });
  }

  // Goal alignment check
  const predictedWeightChange = predictions.weightPrediction.value - client.weight;
  if (client.fitnessGoal === 'WEIGHT_LOSS' && predictedWeightChange > 0) {
    insights.push({
      type: 'ALERT',
      category: 'GOAL_MISALIGNMENT',
      message: 'Current trajectory may not align with weight loss goals',
      recommendation: 'Review nutrition plan and increase activity level'
    });
  }

  return insights;
}

function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0;

  const n = values.length;
  const sumX = n * (n + 1) / 2;
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((sum, y, i) => sum + (i + 1) * y, 0);
  const sumX2 = n * (n + 1) * (2 * n + 1) / 6;

  return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
}