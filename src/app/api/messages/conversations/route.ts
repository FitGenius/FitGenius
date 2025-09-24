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

    let conversations: any[] = [];

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

      // Buscar todos os clientes do profissional
      const clients = await prisma.client.findMany({
        where: {
          professionalId: professional.id
        },
        include: {
          user: {
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

      // Para cada cliente, buscar a última mensagem
      conversations = await Promise.all(
        clients.map(async (client) => {
          const lastMessage = await prisma.message.findFirst({
            where: {
              OR: [
                {
                  senderId: token.sub!,
                  receiverId: client.userId
                },
                {
                  senderId: client.userId,
                  receiverId: token.sub!
                }
              ]
            },
            orderBy: {
              createdAt: 'desc'
            }
          });

          const unreadCount = await prisma.message.count({
            where: {
              senderId: client.userId,
              receiverId: token.sub!,
              readAt: null
            }
          });

          return {
            userId: client.userId,
            user: client.user,
            lastMessage,
            unreadCount
          };
        })
      );

    } else if (token.role === 'CLIENT') {
      const client = await prisma.client.findUnique({
        where: { userId: token.sub! },
        include: {
          professional: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                  role: true
                }
              }
            }
          }
        }
      });

      if (!client || !client.professional) {
        return NextResponse.json(
          { error: 'Client profile or professional not found' },
          { status: 404 }
        );
      }

      // Buscar última mensagem com o profissional
      const lastMessage = await prisma.message.findFirst({
        where: {
          OR: [
            {
              senderId: token.sub!,
              receiverId: client.professional.userId
            },
            {
              senderId: client.professional.userId,
              receiverId: token.sub!
            }
          ]
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const unreadCount = await prisma.message.count({
        where: {
          senderId: client.professional.userId,
          receiverId: token.sub!,
          readAt: null
        }
      });

      conversations = [{
        userId: client.professional.userId,
        user: client.professional.user,
        lastMessage,
        unreadCount
      }];
    }

    // Ordenar por data da última mensagem
    conversations.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
    });

    return NextResponse.json({ conversations });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}