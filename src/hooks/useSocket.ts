'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket;

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Conectar ao socket apenas se não estiver conectado
    if (!socket || !socket.connected) {
      socketInitializer();
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const socketInitializer = async () => {
    // Inicializar servidor socket
    await fetch('/api/socket');

    socket = io({
      path: '/api/socket',
      addTrailingSlash: false,
    });

    socket.on('connect', () => {
      console.log('Connected to socket server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setIsConnected(false);
    });
  };

  const joinConversation = (conversationId: string) => {
    if (socket) {
      socket.emit('join-conversation', conversationId);
    }
  };

  const leaveConversation = (conversationId: string) => {
    if (socket) {
      socket.emit('leave-conversation', conversationId);
    }
  };

  const sendMessage = (conversationId: string, message: any) => {
    if (socket) {
      socket.emit('new-message', { conversationId, message });
    }
  };

  const startTyping = (conversationId: string, userId: string, userName: string) => {
    if (socket) {
      socket.emit('typing-start', { conversationId, userId, userName });
    }
  };

  const stopTyping = (conversationId: string, userId: string) => {
    if (socket) {
      socket.emit('typing-stop', { conversationId, userId });
    }
  };

  const onMessageReceived = (callback: (message: any) => void) => {
    if (socket) {
      socket.on('message-received', callback);
    }
  };

  const onUserTyping = (callback: (data: { userId: string; userName: string }) => void) => {
    if (socket) {
      socket.on('user-typing', callback);
    }
  };

  const onUserStoppedTyping = (callback: (data: { userId: string }) => void) => {
    if (socket) {
      socket.on('user-stopped-typing', callback);
    }
  };

  const onUserStatusChanged = (callback: (data: { userId: string; status: string }) => void) => {
    if (socket) {
      socket.on('user-status-changed', callback);
    }
  };

  const offAllListeners = () => {
    if (socket) {
      socket.off('message-received');
      socket.off('user-typing');
      socket.off('user-stopped-typing');
      socket.off('user-status-changed');
    }
  };

  return {
    socket,
    isConnected,
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    onMessageReceived,
    onUserTyping,
    onUserStoppedTyping,
    onUserStatusChanged,
    offAllListeners
  };
};