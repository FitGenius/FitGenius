import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AIChatbotAssistant, ChatContext } from '@/lib/ai/chatbot-assistant';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check subscription for AI chat
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id }
    });

    if (!subscription || subscription.plan === 'FREE') {
      return NextResponse.json(
        {
          error: 'AI Chat Assistant requires Professional or Enterprise plan',
          upgradeUrl: '/pricing'
        },
        { status: 403 }
      );
    }

    const { message, clientId, conversationId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Verify client access if clientId provided
    if (clientId) {
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
    }

    // Get previous messages for context
    const previousMessages = await prisma.aiConversation.findMany({
      where: {
        userId: session.user.id,
        ...(clientId && { clientId }),
      },
      orderBy: { timestamp: 'desc' },
      take: 10
    });

    // Build chat context
    const context: ChatContext = {
      userId: session.user.id,
      clientId: clientId || undefined,
      conversationId: conversationId || `conv-${Date.now()}`,
      language: 'pt-BR',
      userRole: session.user.role as 'PROFESSIONAL' | 'CLIENT',
      previousMessages: previousMessages.map(conv => ({
        id: conv.id,
        role: 'user' as const,
        content: conv.userMessage,
        timestamp: conv.timestamp,
      }))
    };

    // Initialize AI chatbot
    const chatbot = new AIChatbotAssistant();

    // Process message
    const response = await chatbot.processMessage(message, context);

    // Log AI usage
    await prisma.aiUsage.create({
      data: {
        userId: session.user.id,
        feature: 'CHAT_ASSISTANT',
        clientId: clientId || null,
        requestData: JSON.stringify({ message: message.substring(0, 100) }), // Truncate for privacy
        responseCount: 1,
      }
    });

    return NextResponse.json({
      response,
      conversationId: context.conversationId,
      timestamp: new Date().toISOString(),
      context: {
        clientId,
        hasClientContext: !!clientId
      }
    });

  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get conversation history
    const conversations = await prisma.aiConversation.findMany({
      where: {
        userId: session.user.id,
        ...(clientId && { clientId }),
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    });

    // Transform to chat format
    const chatHistory = conversations.flatMap(conv => [
      {
        id: `user-${conv.id}`,
        role: 'user' as const,
        content: conv.userMessage,
        timestamp: conv.timestamp,
      },
      {
        id: `assistant-${conv.id}`,
        role: 'assistant' as const,
        content: conv.assistantResponse,
        timestamp: conv.timestamp,
        metadata: {
          confidence: conv.confidence,
          intent: conv.intent
        }
      }
    ]).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return NextResponse.json({
      chatHistory,
      totalMessages: chatHistory.length,
      clientId
    });

  } catch (error) {
    console.error('Chat history error:', error);
    return NextResponse.json(
      { error: 'Failed to load chat history' },
      { status: 500 }
    );
  }
}