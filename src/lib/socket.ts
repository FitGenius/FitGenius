import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO;
    };
  };
};

export const config = {
  api: {
    bodyParser: false,
  },
};

const SocketHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (res.socket.server.io) {
    console.log('Socket is already running');
  } else {
    console.log('Socket is initializing');
    const io = new ServerIO(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? [process.env.NEXTAUTH_URL || '']
          : ['http://localhost:3005'],
        methods: ['GET', 'POST']
      }
    });
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Join conversation rooms
      socket.on('join-conversation', (conversationId: string) => {
        socket.join(`conversation-${conversationId}`);
        console.log(`User ${socket.id} joined conversation ${conversationId}`);
      });

      // Leave conversation rooms
      socket.on('leave-conversation', (conversationId: string) => {
        socket.leave(`conversation-${conversationId}`);
        console.log(`User ${socket.id} left conversation ${conversationId}`);
      });

      // Handle new messages
      socket.on('new-message', (data) => {
        const { conversationId, message } = data;
        socket.to(`conversation-${conversationId}`).emit('message-received', message);
      });

      // Handle typing indicators
      socket.on('typing-start', (data) => {
        const { conversationId, userId, userName } = data;
        socket.to(`conversation-${conversationId}`).emit('user-typing', { userId, userName });
      });

      socket.on('typing-stop', (data) => {
        const { conversationId, userId } = data;
        socket.to(`conversation-${conversationId}`).emit('user-stopped-typing', { userId });
      });

      // Handle user status
      socket.on('user-online', (userId: string) => {
        socket.broadcast.emit('user-status-changed', { userId, status: 'online' });
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });
  }
  res.end();
};

export default SocketHandler;