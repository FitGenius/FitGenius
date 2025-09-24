'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Users } from 'lucide-react';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatInterface } from '@/components/chat/ChatInterface';

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<{
    userId: string;
    userName: string;
    userImage?: string;
  } | null>(null);

  const handleSelectConversation = (userId: string, userName: string, userImage?: string) => {
    setSelectedConversation({ userId, userName, userImage });
  };

  return (
    <div className="h-[calc(100vh-2rem)] max-w-7xl mx-auto p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gold to-gold/60 bg-clip-text text-transparent">
          Mensagens
        </h1>
        <p className="text-muted-foreground mt-1">
          Converse em tempo real com seus {' '}
          <span className="text-gold">clientes e profissionais</span>
        </p>
      </motion.div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100%-120px)]">
        {/* Conversation List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-4 h-full"
        >
          <ConversationList
            onSelectConversation={handleSelectConversation}
            selectedUserId={selectedConversation?.userId}
            className="h-full rounded-xl"
          />
        </motion.div>

        {/* Chat Interface */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-8 h-full"
        >
          {selectedConversation ? (
            <ChatInterface
              recipientId={selectedConversation.userId}
              recipientName={selectedConversation.userName}
              recipientImage={selectedConversation.userImage}
              className="h-full"
            />
          ) : (
            <div className="h-full bg-card border border-border/50 rounded-xl flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Selecione uma conversa</h3>
                <p className="text-sm max-w-md">
                  Escolha uma conversa da lista ao lado para começar a trocar mensagens em tempo real.
                </p>
                <div className="mt-6 p-4 bg-background/50 rounded-lg border border-border/30">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Status: Online</span>
                  </div>
                  <p className="text-xs text-left">
                    • Mensagens em tempo real<br />
                    • Indicador de digitação<br />
                    • Confirmação de leitura<br />
                    • Upload de arquivos (em breve)
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}