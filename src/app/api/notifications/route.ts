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
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let whereClause: any = {
      userId: token.sub!
    };

    if (unreadOnly) {
      whereClause.readAt = null;
    }

    const [notifications, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      }),
      prisma.notification.count({
        where: whereClause
      })
    ]);

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
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

    const {
      recipientId,
      title,
      message,
      type = 'INFO',
      data
    } = await request.json();

    if (!recipientId || !title || !message) {
      return NextResponse.json(
        { error: 'Recipient ID, title and message are required' },
        { status: 400 }
      );
    }

    // Verificar se o recipient existe
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId }
    });

    if (!recipient) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      );
    }

    // Verificar autorização para enviar notificação
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

      // Verificar se o recipient é um cliente do profissional
      const client = await prisma.client.findFirst({
        where: {
          userId: recipientId,
          professionalId: professional.id
        }
      });

      if (!client) {
        return NextResponse.json(
          { error: 'Can only send notifications to your clients' },
          { status: 403 }
        );
      }
    }

    const notification = await prisma.notification.create({
      data: {
        userId: recipientId,
        title,
        message,
        type,
        data: data ? JSON.stringify(data) : null,
        createdAt: new Date()
      }
    });

    return NextResponse.json({
      message: 'Notification sent successfully',
      notification
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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

    const { notificationIds, action } = await request.json();

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'Notification IDs array is required' },
        { status: 400 }
      );
    }

    if (action === 'markAsRead') {
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: token.sub!,
          readAt: null
        },
        data: {
          readAt: new Date()
        }
      });

      return NextResponse.json({
        message: 'Notifications marked as read'
      });
    } else if (action === 'markAsUnread') {
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: token.sub!
        },
        data: {
          readAt: null
        }
      });

      return NextResponse.json({
        message: 'Notifications marked as unread'
      });
    } else if (action === 'delete') {
      await prisma.notification.deleteMany({
        where: {
          id: { in: notificationIds },
          userId: token.sub!
        }
      });

      return NextResponse.json({
        message: 'Notifications deleted'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}