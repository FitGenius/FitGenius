'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MessageCircle,
  Send,
  User,
  Clock,
  CheckCheck,
  Check,
  UserCheck
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: 'PROFESSIONAL' | 'CLIENT';
}

interface Message {
  id: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE';
  createdAt: string;
  readAt: string | null;
  senderId: string;
  receiverId: string;
  sender: User;
  receiver: User;
}

interface Conversation {
  userId: string;
  user: User;
  lastMessage: Message | null;
  unreadCount: number;
}

export default function ClientMessagesPage() {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversation();
  }, []);

  useEffect(() => {
    if (conversation) {
      fetchMessages(conversation.userId);
    }
  }, [conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversation = async () => {
    try {
      const response = await fetch('/api/messages/conversations');
      if (response.ok) {
        const data = await response.json();
        if (data.conversations && data.conversations.length > 0) {
          setConversation(data.conversations[0]); // Cliente só tem uma conversa (com seu profissional)
        }
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId: string) => {
    try {
      const response = await fetch(`/api/messages?conversationWith=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation || sending) return;

    setSending(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiverId: conversation.userId,
          content: newMessage.trim(),
          type: 'TEXT'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [data.data, ...prev]);
        setNewMessage('');
        fetchConversation(); // Atualizar conversa
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full mx-auto"></div>
          <p className="text-foreground-secondary mt-4">Carregando mensagens...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mensagens</h1>
          <p className="text-foreground-secondary">
            Converse com seu profissional
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserCheck size={64} className="text-foreground-muted mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum profissional vinculado
            </h3>
            <p className="text-foreground-secondary text-center">
              Você precisa estar vinculado a um profissional para trocar mensagens
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mensagens</h1>
        <p className="text-foreground-secondary">
          Converse com seu profissional - {conversation.user.name}
        </p>
      </div>

      {/* Chat Card */}
      <Card className="h-[calc(100vh-12rem)] flex flex-col">
        {/* Chat Header */}
        <CardHeader className="border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
              <User size={24} className="text-gold" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-lg">{conversation.user.name}</h3>
              <p className="text-sm text-foreground-secondary">{conversation.user.email}</p>
            </div>
            {conversation.unreadCount > 0 && (
              <div className="bg-gold text-black px-2 py-1 rounded-full text-xs font-medium">
                {conversation.unreadCount} nova{conversation.unreadCount > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 flex flex-col p-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle size={48} className="text-foreground-muted mx-auto mb-4" />
                <p className="text-foreground-secondary">Inicie uma conversa</p>
                <p className="text-foreground-muted text-sm">
                  Envie sua primeira mensagem para {conversation.user.name}
                </p>
              </div>
            ) : (
              messages.slice().reverse().map((message) => {
                const isOwn = message.senderId !== conversation.userId;
                return (
                  <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      isOwn
                        ? 'bg-gold text-black'
                        : 'bg-surface border border-border'
                    }`}>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <div className={`flex items-center justify-end gap-1 mt-2 text-xs ${
                        isOwn ? 'text-black/70' : 'text-foreground-muted'
                      }`}>
                        <Clock size={12} />
                        <span>{formatTime(message.createdAt)}</span>
                        {isOwn && (
                          message.readAt ? (
                            <CheckCheck size={12} className="text-green-600" />
                          ) : (
                            <Check size={12} />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-border p-4">
            <div className="flex gap-3">
              <Input
                placeholder={`Digite sua mensagem para ${conversation.user.name}...`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={sending}
                className="flex-1 text-sm"
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                size="sm"
                className="px-6"
              >
                {sending ? (
                  <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
                ) : (
                  <Send size={16} />
                )}
              </Button>
            </div>
            <div className="flex justify-between items-center mt-2 text-xs text-foreground-muted">
              <span>Pressione Enter para enviar</span>
              {conversation.lastMessage && (
                <span>
                  Última mensagem: {formatTime(conversation.lastMessage.createdAt)}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}