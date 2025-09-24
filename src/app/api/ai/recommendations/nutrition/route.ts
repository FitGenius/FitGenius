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

    // Check subscription for AI features
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id }
    });

    if (!subscription || subscription.plan === 'FREE') {
      return NextResponse.json(
        {
          error: 'AI nutrition recommendations require Professional or Enterprise plan',
          upgradeUrl: '/pricing'
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const mealType = searchParams.get('mealType') as 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | null;

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
      }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found or access denied' },
        { status: 404 }
      );
    }

    const aiEngine = new AIRecommendationEngine();

    // Generate nutrition recommendations
    const recommendations = await aiEngine.generateNutritionRecommendations(
      clientId,
      mealType || undefined
    );

    // Log AI usage
    await prisma.aiUsage.create({
      data: {
        userId: session.user.id,
        feature: 'NUTRITION_RECOMMENDATIONS',
        clientId,
        requestData: JSON.stringify({ mealType }),
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
        dietaryRestrictions: client.dietaryRestrictions,
        allergies: client.allergies
      }
    });

  } catch (error) {
    console.error('AI nutrition recommendations error:', error);
    return NextResponse.json(
      { error: 'Failed to generate nutrition recommendations' },
      { status: 500 }
    );
  }
}