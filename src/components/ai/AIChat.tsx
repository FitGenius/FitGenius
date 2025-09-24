'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
  X,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    confidence?: number;
    sources?: string[];
    suggestedActions?: string[];
  };
}

interface AIChatProps {
  clientId?: string;
  isFloating?: boolean;
  onClose?: () => void;
}

export function AIChat({ clientId, isFloating = false, onClose }: AIChatProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!isFloating);
  const [conversationId, setConversationId] = useState<string>('');
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory();
  }, [clientId]);

  // Auto scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const params = new URLSearchParams();
      if (clientId) params.append('clientId', clientId);
      params.append('limit', '10');

      const response = await fetch(`/api/ai/chat?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.chatHistory);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputMessage.trim(),
          clientId: clientId || null,
          conversationId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setMessages(prev => [...prev, data.response]);
      setConversationId(data.conversationId);

      // Text-to-speech for assistant response
      if (isSpeechEnabled && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(data.response.content);
        utterance.lang = 'pt-BR';
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
      }

    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Erro ao processar mensagem. Tente novamente.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessage = (content: string) => {
    // Convert markdown-like formatting to JSX
    return content
      .split('\n')
      .map((line, index) => {
        // Bold text
        if (line.startsWith('**') && line.endsWith('**')) {
          return (
            <div key={index} className="font-semibold text-foreground mb-2">
              {line.slice(2, -2)}
            </div>
          );
        }

        // Bullet points
        if (line.startsWith('• ')) {
          return (
            <div key={index} className="ml-4 mb-1 flex items-start">
              <span className="text-gold mr-2">•</span>
              <span>{line.slice(2)}</span>
            </div>
          );
        }

        // Numbered lists
        if (line.match(/^\d+\./)) {
          return (
            <div key={index} className="ml-4 mb-1">
              {line}
            </div>
          );
        }

        // Regular text
        return line.trim() ? (
          <div key={index} className="mb-1">
            {line}
          </div>
        ) : (
          <div key={index} className="mb-2" />
        );
      });
  };

  if (!session) {
    return null;
  }

  const chatContent = (
    <div className={`flex flex-col h-full ${isFloating ? 'bg-surface border border-border rounded-lg shadow-xl' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center">
            <Bot size={18} className="text-black" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">FitGenius AI</h3>
            <p className="text-xs text-foreground-secondary">
              {clientId ? 'Assistente personalizado' : 'Assistente geral'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Speech toggle */}
          <button
            onClick={() => setIsSpeechEnabled(!isSpeechEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              isSpeechEnabled
                ? 'bg-gold text-black'
                : 'bg-surface-hover text-foreground-secondary hover:text-foreground'
            }`}
            title={isSpeechEnabled ? 'Desativar áudio' : 'Ativar áudio'}
          >
            {isSpeechEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {isFloating && (
            <>
              {/* Expand/Minimize */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-lg bg-surface-hover text-foreground-secondary hover:text-foreground transition-colors"
                title={isExpanded ? 'Minimizar' : 'Expandir'}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              {/* Close */}
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-surface-hover text-foreground-secondary hover:text-red-500 transition-colors"
                title="Fechar chat"
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gold/20 to-yellow-600/20 flex items-center justify-center">
                  <Sparkles size={24} className="text-gold" />
                </div>
                <h4 className="font-medium text-foreground mb-2">
                  Olá! Como posso ajudar você hoje?
                </h4>
                <p className="text-sm text-foreground-secondary max-w-sm mx-auto">
                  Pergunte sobre exercícios, nutrição, progresso ou peça recomendações personalizadas.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center flex-shrink-0">
                    <Bot size={16} className="text-black" />
                  </div>
                )}

                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-gold text-black ml-auto'
                      : 'bg-surface-hover text-foreground'
                  }`}
                >
                  <div className="text-sm">
                    {message.role === 'assistant'
                      ? formatMessage(message.content)
                      : message.content}
                  </div>

                  {message.metadata?.confidence && (
                    <div className="mt-2 pt-2 border-t border-border/20">
                      <div className="text-xs text-foreground-secondary">
                        Confiança: {Math.round(message.metadata.confidence)}%
                      </div>
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-white" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center">
                  <Bot size={16} className="text-black" />
                </div>
                <div className="bg-surface-hover px-4 py-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                    <Loader2 size={16} className="animate-spin" />
                    Pensando...
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua pergunta..."
                rows={1}
                className="flex-1 resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-secondary focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="px-4 py-2 rounded-lg bg-gold text-black hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Enviar mensagem"
              >
                <Send size={16} />
              </button>
            </div>
            <div className="mt-2 text-xs text-foreground-secondary text-center">
              Pressione Enter para enviar, Shift+Enter para nova linha
            </div>
          </div>
        </>
      )}
    </div>
  );

  if (isFloating) {
    return (
      <div className="fixed bottom-4 right-4 w-96 h-96 z-50">
        {chatContent}
      </div>
    );
  }

  return <div className="h-full">{chatContent}</div>;
}

// Floating chat trigger button
export function AIChatTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 w-14 h-14 bg-gradient-to-br from-gold to-yellow-600 text-black rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 z-40 flex items-center justify-center"
      title="Abrir AI Assistant"
    >
      <MessageCircle size={24} />
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
        <Sparkles size={8} className="text-white" />
      </div>
    </button>
  );
}