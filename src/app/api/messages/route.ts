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
    const conversationWith = searchParams.get('conversationWith');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

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

      if (conversationWith) {
        // Conversa específica com um cliente
        whereClause = {
          OR: [
            {
              senderId: token.sub!,
              receiverId: conversationWith
            },
            {
              senderId: conversationWith,
              receiverId: token.sub!
            }
          ]
        };
      } else {
        // Todas as mensagens relacionadas ao profissional
        whereClause = {
          OR: [
            { senderId: token.sub! },
            { receiverId: token.sub! }
          ]
        };
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

      if (conversationWith) {
        // Conversa específica com o profissional
        whereClause = {
          OR: [
            {
              senderId: token.sub!,
              receiverId: conversationWith
            },
            {
              senderId: conversationWith,
              receiverId: token.sub!
            }
          ]
        };
      } else {
        // Todas as mensagens do cliente
        whereClause = {
          OR: [
            { senderId: token.sub! },
            { receiverId: token.sub! }
          ]
        };
      }
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Marcar mensagens como lidas
    if (conversationWith) {
      await prisma.message.updateMany({
        where: {
          senderId: conversationWith,
          receiverId: token.sub!,
          readAt: null
        },
        data: {
          readAt: new Date()
        }
      });
    }

    return NextResponse.json({ messages });

  } catch (error) {
    console.error('Error fetching messages:', error);
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

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { receiverId, content, type = 'TEXT' } = await request.json();

    if (!receiverId || !content) {
      return NextResponse.json(
        { error: 'Receiver ID and content are required' },
        { status: 400 }
      );
    }

    // Verificar se o receptor existe
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    });

    if (!receiver) {
      return NextResponse.json(
        { error: 'Receiver not found' },
        { status: 404 }
      );
    }

    // Verificar autorização para enviar mensagem
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

      // Verificar se o receptor é um cliente do profissional
      const client = await prisma.client.findFirst({
        where: {
          userId: receiverId,
          professionalId: professional.id
        }
      });

      if (!client) {
        return NextResponse.json(
          { error: 'Can only send messages to your clients' },
          { status: 403 }
        );
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

      // Verificar se o receptor é o profissional do cliente
      const professional = await prisma.professional.findFirst({
        where: {
          userId: receiverId,
          id: client.professionalId
        }
      });

      if (!professional) {
        return NextResponse.json(
          { error: 'Can only send messages to your professional' },
          { status: 403 }
        );
      }
    }

    const message = await prisma.message.create({
      data: {
        senderId: token.sub!,
        receiverId,
        content,
        type,
        createdAt: new Date()
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Message sent successfully',
      data: message
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}