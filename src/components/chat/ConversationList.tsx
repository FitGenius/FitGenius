'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Search, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Conversation {
  userId: string;
  userName: string;
  userImage?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isOnline?: boolean;
}

interface ConversationListProps {
  onSelectConversation: (userId: string, userName: string, userImage?: string) => void;
  selectedUserId?: string;
  className?: string;
}

export function ConversationList({ 
  onSelectConversation, 
  selectedUserId,
  className 
}: ConversationListProps) {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/conversations');
      const data = await response.json();
      
      if (response.ok) {
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      // Fallback: carregar lista de usuários disponíveis
      loadAvailableUsers();
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      // Para profissionais: carregar clientes
      // Para clientes: carregar profissional
      const endpoint = session?.user?.role === 'PROFESSIONAL' 
        ? '/api/professional/clients'
        : '/api/client/professional';
        
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (response.ok) {
        const users = session?.user?.role === 'PROFESSIONAL'
          ? data.clients?.map((client: any) => ({
              userId: client.user.id,
              userName: client.user.name || 'Cliente',
              userImage: client.user.image,
              unreadCount: 0,
              isOnline: false
            })) || []
          : data.professional ? [{
              userId: data.professional.user.id,
              userName: data.professional.user.name || 'Profissional',
              userImage: data.professional.user.image,
              unreadCount: 0,
              isOnline: false
            }] : [];
            
        setConversations(users);
      }
    } catch (error) {
      console.error('Error loading available users:', error);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  return (
    <div className={cn('flex flex-col h-full bg-card border-r border-border/50', className)}>
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-gold" />
          Mensagens
        </h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gold" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground p-4">
            <MessageCircle className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm text-center">
              {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
            </p>
            {!searchTerm && (
              <p className="text-xs text-center mt-1">
                {session?.user?.role === 'PROFESSIONAL' 
                  ? 'Seus clientes aparecerão aqui'
                  : 'Inicie uma conversa com seu profissional'
                }
              </p>
            )}
          </div>
        ) : (
          <div className="p-2">
            {filteredConversations.map((conversation, index) => (
              <motion.div
                key={conversation.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelectConversation(
                  conversation.userId, 
                  conversation.userName, 
                  conversation.userImage
                )}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-background/50',
                  selectedUserId === conversation.userId && 'bg-gold/10 border border-gold/20'
                )}
              >
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conversation.userImage} />
                    <AvatarFallback className="bg-gradient-to-br from-gold/20 to-gold/10">
                      {conversation.userName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {conversation.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-foreground truncate">
                      {conversation.userName}
                    </h3>
                    {conversation.lastMessageTime && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatTime(conversation.lastMessageTime)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessage || 'Nenhuma mensagem ainda'}
                    </p>
                    
                    {conversation.unreadCount > 0 && (
                      <div className="bg-gold text-background rounded-full text-xs font-semibold px-2 py-1 min-w-[20px] text-center flex-shrink-0">
                        {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/50">
        <div className="text-xs text-muted-foreground text-center">
          {session?.user?.role === 'PROFESSIONAL'
            ? `${conversations.length} cliente${conversations.length !== 1 ? 's' : ''}`
            : 'Chat com seu profissional'
          }
        </div>
      </div>
    </div>
  );
}