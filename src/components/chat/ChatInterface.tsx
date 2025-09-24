'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Smile, MoreVertical, Phone, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSocket } from '@/hooks/useSocket';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE';
  attachmentUrl?: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    image?: string;
  };
  receiver: {
    id: string;
    name: string;
    image?: string;
  };
}

interface ChatInterfaceProps {
  recipientId: string;
  recipientName: string;
  recipientImage?: string;
  className?: string;
}

export function ChatInterface({ 
  recipientId, 
  recipientName, 
  recipientImage,
  className 
}: ChatInterfaceProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isConnected,
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    onMessageReceived,
    onUserTyping,
    onUserStoppedTyping,
    offAllListeners
  } = useSocket();

  // Gerar ID da conversa (sempre o mesmo independente da ordem)
  const conversationId = [session?.user?.id, recipientId].sort().join('-');

  useEffect(() => {
    if (isConnected && conversationId) {
      joinConversation(conversationId);
      loadMessages();
    }

    return () => {
      if (conversationId) {
        leaveConversation(conversationId);
      }
      offAllListeners();
    };
  }, [isConnected, conversationId]);

  useEffect(() => {
    // Configurar listeners do socket
    onMessageReceived((message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    onUserTyping(({ userId, userName }) => {
      if (userId === recipientId) {
        setTyping(userName);
      }
    });

    onUserStoppedTyping(({ userId }) => {
      if (userId === recipientId) {
        setTyping(null);
      }
    });
  }, [recipientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/messages?withUserId=${recipientId}`);
      const data = await response.json();
      
      if (response.ok) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !session?.user?.id) return;

    const messageData = {
      content: newMessage,
      senderId: session.user.id,
      receiverId: recipientId,
      messageType: 'TEXT' as const,
      createdAt: new Date().toISOString(),
      sender: {
        id: session.user.id,
        name: session.user.name || 'Você',
        image: session.user.image
      },
      receiver: {
        id: recipientId,
        name: recipientName,
        image: recipientImage
      },
      id: `temp-${Date.now()}`,
      isRead: false
    };

    // Adicionar mensagem localmente
    setMessages(prev => [...prev, messageData]);
    setNewMessage('');
    
    // Parar indicador de digitação
    handleStopTyping();

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: recipientId,
          content: newMessage,
          messageType: 'TEXT'
        })
      });

      if (response.ok) {
        const savedMessage = await response.json();
        
        // Atualizar mensagem local com dados do servidor
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageData.id ? savedMessage : msg
          )
        );

        // Enviar via socket para tempo real
        sendMessage(conversationId, savedMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // TODO: Mostrar erro e permitir reenvio
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = () => {
    if (!isTyping && session?.user?.id) {
      setIsTyping(true);
      startTyping(conversationId, session.user.id, session.user.name || 'Usuário');
    }

    // Reset timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 1000);
  };

  const handleStopTyping = () => {
    if (isTyping && session?.user?.id) {
      setIsTyping(false);
      stopTyping(conversationId, session.user.id);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });
    }
  };

  return (
    <div className={cn('flex flex-col h-full bg-card border border-border/50 rounded-xl', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={recipientImage} />
            <AvatarFallback className="bg-gradient-to-br from-gold/20 to-gold/10">
              {recipientName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-foreground">{recipientName}</h3>
            <p className="text-xs text-muted-foreground">
              {isConnected ? 'Online' : 'Desconectado'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gold" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <p>Nenhuma mensagem ainda. Inicie a conversa!</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwn = message.senderId === session?.user?.id;
              const showDate = index === 0 || 
                formatDate(messages[index - 1].createdAt) !== formatDate(message.createdAt);
              
              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="flex justify-center mb-4">
                      <span className="text-xs text-muted-foreground bg-background px-3 py-1 rounded-full border">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                  )}
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'flex gap-2 max-w-[80%]',
                      isOwn ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    )}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={isOwn ? session?.user?.image : recipientImage} />
                      <AvatarFallback className="bg-gradient-to-br from-gold/20 to-gold/10 text-xs">
                        {isOwn 
                          ? session?.user?.name?.slice(0, 2).toUpperCase()
                          : recipientName.slice(0, 2).toUpperCase()
                        }
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={cn('space-y-1', isOwn ? 'items-end' : 'items-start')}>
                      <div
                        className={cn(
                          'px-4 py-2 rounded-2xl max-w-sm break-words',
                          isOwn 
                            ? 'bg-gold text-background rounded-br-md'
                            : 'bg-muted text-foreground rounded-bl-md'
                        )}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <p className={cn(
                        'text-xs text-muted-foreground px-1',
                        isOwn ? 'text-right' : 'text-left'
                      )}>
                        {formatTime(message.createdAt)}
                        {isOwn && (
                          <span className="ml-1">
                            {message.isRead ? '✓✓' : '✓'}
                          </span>
                        )}
                      </p>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </>
        )}
        
        {/* Typing Indicator */}
        <AnimatePresence>
          {typing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 text-muted-foreground text-sm"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={recipientImage} />
                <AvatarFallback className="bg-gradient-to-br from-gold/20 to-gold/10 text-xs">
                  {recipientName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-1">
                <span className="text-xs">{typing} está digitando</span>
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" />
                  <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce delay-75" />
                  <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce delay-150" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border/50">
        <div className="flex items-end gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              placeholder="Digite uma mensagem..."
              className="w-full px-4 py-2 bg-background border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none"
              disabled={!isConnected}
            />
          </div>
          
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
            <Smile className="h-4 w-4" />
          </Button>
          
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !isConnected}
            size="sm" 
            className="h-8 w-8 p-0 flex-shrink-0 bg-gold hover:bg-gold/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}