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

    // Buscar as últimas mensagens para cada conversa
    const recentMessages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: token.sub! },
          { receiverId: token.sub! }
        ]
      },
      distinct: ['senderId', 'receiverId'],
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      take: 50
    });

    // Agrupar por conversa e pegar a mensagem mais recente
    const conversationsMap = new Map();
    
    recentMessages.forEach(message => {
      const otherUserId = message.senderId === token.sub ? message.receiverId : message.senderId;
      const otherUser = message.senderId === token.sub ? message.receiver : message.sender;
      
      const conversationKey = otherUserId;
      
      if (!conversationsMap.has(conversationKey) || 
          new Date(message.createdAt) > new Date(conversationsMap.get(conversationKey).lastMessageTime)) {
        conversationsMap.set(conversationKey, {
          userId: otherUserId,
          userName: otherUser.name || 'Usuário',
          userImage: otherUser.image,
          lastMessage: message.content,
          lastMessageTime: message.createdAt,
          unreadCount: 0 // TODO: Implementar contagem de não lidas
        });
      }
    });

    const conversations = Array.from(conversationsMap.values())
      .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

    // Se não há conversas, buscar usuários disponíveis
    if (conversations.length === 0) {
      let availableUsers = [];
      
      if (token.role === 'PROFESSIONAL') {
        // Buscar clientes do profissional
        const professional = await prisma.professional.findUnique({
          where: { userId: token.sub! },
          include: {
            clients: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true
                  }
                }
              }
            }
          }
        });
        
        availableUsers = professional?.clients.map(client => ({
          userId: client.user.id,
          userName: client.user.name || 'Cliente',
          userImage: client.user.image,
          lastMessage: null,
          lastMessageTime: null,
          unreadCount: 0
        })) || [];
      } else {
        // Buscar profissional do cliente
        const client = await prisma.client.findUnique({
          where: { userId: token.sub! },
          include: {
            professional: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true
                  }
                }
              }
            }
          }
        });
        
        if (client?.professional) {
          availableUsers = [{
            userId: client.professional.user.id,
            userName: client.professional.user.name || 'Profissional',
            userImage: client.professional.user.image,
            lastMessage: null,
            lastMessageTime: null,
            unreadCount: 0
          }];
        }
      }
      
      return NextResponse.json({ conversations: availableUsers });
    }

    return NextResponse.json({ conversations });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}