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

    // Check if user has access to AI features (Professional+ plans)
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id }
    });

    if (!subscription || subscription.plan === 'FREE') {
      return NextResponse.json(
        {
          error: 'AI recommendations require Professional or Enterprise plan',
          upgradeUrl: '/pricing'
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const duration = searchParams.get('duration');
    const equipment = searchParams.getAll('equipment');
    const focusAreas = searchParams.getAll('focusAreas');

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Verify client belongs to the professional
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        professionalId: session.user.id
      }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found or access denied' },
        { status: 404 }
      );
    }

    // Initialize AI recommendation engine
    const aiEngine = new AIRecommendationEngine();

    // Generate workout recommendations
    const recommendations = await aiEngine.generateWorkoutRecommendations(
      clientId,
      new Date(),
      {
        duration: duration ? parseInt(duration) : undefined,
        equipment: equipment.length > 0 ? equipment : undefined,
        focusAreas: focusAreas.length > 0 ? focusAreas : undefined,
      }
    );

    // Log AI usage for analytics
    await prisma.aiUsage.create({
      data: {
        userId: session.user.id,
        feature: 'WORKOUT_RECOMMENDATIONS',
        clientId,
        requestData: JSON.stringify({
          duration,
          equipment,
          focusAreas
        }),
        responseCount: recommendations.length,
      }
    });

    return NextResponse.json({
      recommendations,
      generatedAt: new Date().toISOString(),
      clientProfile: {
        id: client.id,
        name: client.name,
        fitnessGoal: client.fitnessGoal,
        experienceLevel: client.experienceLevel
      }
    });

  } catch (error) {
    console.error('AI workout recommendations error:', error);

    // Log error for monitoring
    await prisma.errorLog.create({
      data: {
        feature: 'AI_WORKOUT_RECOMMENDATIONS',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId: session?.user?.id,
        timestamp: new Date(),
      }
    }).catch(console.error);

    return NextResponse.json(
      { error: 'Failed to generate workout recommendations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { clientId, feedback, recommendationId, rating } = body;

    if (!clientId || !recommendationId) {
      return NextResponse.json(
        { error: 'Client ID and recommendation ID are required' },
        { status: 400 }
      );
    }

    // Store feedback to improve AI recommendations
    await prisma.aiRecommendationFeedback.create({
      data: {
        userId: session.user.id,
        clientId,
        recommendationId,
        feedback,
        rating: rating || null,
        feature: 'WORKOUT_RECOMMENDATIONS',
        createdAt: new Date(),
      }
    });

    return NextResponse.json({
      message: 'Feedback recorded successfully',
      status: 'success'
    });

  } catch (error) {
    console.error('AI feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to record feedback' },
      { status: 500 }
    );
  }
}