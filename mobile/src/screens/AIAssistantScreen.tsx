import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'workout' | 'nutrition' | 'progress';
  metadata?: any;
}

const QUICK_ACTIONS = [
  {
    id: 'workout_recommendation',
    title: 'Recomendar Treino',
    icon: 'fitness' as keyof typeof Ionicons.glyphMap,
    prompt: 'Me recomende um treino para hoje baseado no meu histórico',
  },
  {
    id: 'nutrition_advice',
    title: 'Dicas de Nutrição',
    icon: 'restaurant' as keyof typeof Ionicons.glyphMap,
    prompt: 'Me dê dicas de nutrição para meus objetivos',
  },
  {
    id: 'progress_analysis',
    title: 'Analisar Progresso',
    icon: 'trending-up' as keyof typeof Ionicons.glyphMap,
    prompt: 'Analise meu progresso e me dê feedback',
  },
  {
    id: 'motivation',
    title: 'Motivação',
    icon: 'flame' as keyof typeof Ionicons.glyphMap,
    prompt: 'Preciso de motivação para treinar hoje',
  },
];

export const AIAssistantScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: `Olá ${user?.name || 'Usuário'}! 👋 Sou seu AI Assistant do FitGenius. Como posso te ajudar hoje?`,
      isUser: false,
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Simulate AI response (in production, would call actual AI API)
      const response = await simulateAIResponse(text.trim());

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        isUser: false,
        timestamp: new Date(),
        type: response.type || 'text',
        metadata: response.metadata,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Erro', 'Não foi possível enviar a mensagem. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const simulateAIResponse = async (message: string): Promise<{
    text: string;
    type?: string;
    metadata?: any;
  }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('treino') || lowerMessage.includes('exercício')) {
      return {
        text: `🏋️‍♂️ Baseado no seu histórico, recomendo um treino de peito e tríceps hoje!\n\n**Exercícios sugeridos:**\n• Supino reto: 4x10\n• Supino inclinado: 3x12\n• Mergulho: 3x15\n• Extensão tríceps: 3x12\n\nDuração estimada: 45 minutos\nCalorias: ~280 kcal\n\nQuer que eu crie este treino personalizado para você?`,
        type: 'workout',
        metadata: {
          workoutType: 'chest_triceps',
          duration: 45,
          calories: 280
        }
      };
    }

    if (lowerMessage.includes('nutrição') || lowerMessage.includes('alimentação')) {
      return {
        text: `🥗 Aqui estão algumas dicas de nutrição personalizadas:\n\n**Pré-treino (30-60 min antes):**\n• 1 banana + 1 colher de pasta de amendoim\n• Aveia com frutas vermelhas\n\n**Pós-treino (até 2h depois):**\n• Whey protein + água de coco\n• Frango + batata doce + salada\n\n**Hidratação:**\n• 35ml de água por kg de peso corporal\n• Durante treino: 150-200ml a cada 15-20 min\n\nQuer que eu calcule suas necessidades calóricas específicas?`,
        type: 'nutrition'
      };
    }

    if (lowerMessage.includes('progresso') || lowerMessage.includes('resultado')) {
      return {
        text: `📊 Análise do seu progresso nos últimos 30 dias:\n\n**Conquistas:**\n✅ 12 treinos completados\n✅ 2.340 calorias queimadas\n✅ 78.450 passos registrados\n✅ Sequência de 7 dias ativa\n\n**Áreas de melhoria:**\n⚠️ Consistência nos fins de semana\n⚠️ Hidratação diária\n\n**Próximas metas:**\n🎯 15 treinos este mês\n🎯 Aumentar 5% no supino\n🎯 Correr 5km sem parar\n\nVocê está no caminho certo! Continue assim! 💪`,
        type: 'progress'
      };
    }

    if (lowerMessage.includes('motivação') || lowerMessage.includes('desânimo')) {
      const motivationalMessages = [
        "💪 Cada treino é um investimento no seu futuro! Você já chegou até aqui, não desista agora!",
        "🔥 Lembre-se: você nunca se arrepende de um treino feito, apenas dos que você deixou passar!",
        "⭐ Seu maior concorrente é quem você era ontem. Supere-se a cada dia!",
        "🏆 Champions são feitos quando ninguém está olhando. Treine pela sua versão futura!",
        "💎 Pressão faz diamantes. Cada dificuldade hoje é força amanhã!"
      ];

      return {
        text: motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)] +
              "\n\nQue tal começarmos com um treino leve hoje? Até 10 minutos já fazem diferença!"
      };
    }

    // Default response
    return {
      text: `Entendi! ${message.includes('?') ? 'Ótima pergunta!' : 'Interessante!'}

Posso te ajudar com:
🏋️‍♂️ Recomendações de treinos
🥗 Dicas de nutrição
📊 Análise de progresso
💪 Motivação e coaching
🎯 Definição de metas

Como posso te ajudar especificamente?`
    };
  };

  const speakMessage = async (text: string) => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    // Remove markdown and emojis for better TTS
    const cleanText = text
      .replace(/[*#_~`]/g, '')
      .replace(/[🏋️‍♂️🥗📊💪🔥⭐🏆💎✅⚠️🎯👋]/g, '')
      .replace(/\n+/g, '. ');

    setIsSpeaking(true);

    Speech.speak(cleanText, {
      language: 'pt-BR',
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
    sendMessage(action.prompt);
  };

  const MessageBubble = ({ message }: { message: ChatMessage }) => (
    <View style={[
      styles.messageBubble,
      message.isUser ? styles.userMessage : styles.aiMessage,
      { backgroundColor: message.isUser ? theme.colors.primary : theme.colors.surface }
    ]}>
      <Text style={[
        styles.messageText,
        { color: message.isUser ? 'white' : theme.colors.text }
      ]}>
        {message.text}
      </Text>

      <View style={styles.messageFooter}>
        <Text style={[
          styles.messageTime,
          { color: message.isUser ? 'rgba(255,255,255,0.8)' : theme.colors.textSecondary }
        ]}>
          {message.timestamp.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>

        {!message.isUser && (
          <TouchableOpacity
            style={styles.speakButton}
            onPress={() => speakMessage(message.text)}
          >
            <Ionicons
              name={isSpeaking ? 'stop' : 'volume-high'}
              size={16}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {message.metadata?.workoutType && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.primary + '20' }]}
          onPress={() => navigation.navigate('Workouts')}
        >
          <Ionicons name="fitness" size={16} color={theme.colors.primary} />
          <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
            Ver Treinos
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.headerContent}>
          <View style={[styles.aiAvatar, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="brain" size={20} color="white" />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              AI Assistant
            </Text>
            <Text style={[styles.headerStatus, { color: theme.colors.textSecondary }]}>
              {isLoading ? 'Digitando...' : 'Online'}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(message => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading && (
          <View style={[styles.loadingBubble, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.typingIndicator}>
              <View style={[styles.typingDot, { backgroundColor: theme.colors.primary }]} />
              <View style={[styles.typingDot, { backgroundColor: theme.colors.primary }]} />
              <View style={[styles.typingDot, { backgroundColor: theme.colors.primary }]} />
            </View>
          </View>
        )}

        {/* Quick Actions */}
        {messages.length === 1 && (
          <View style={styles.quickActionsContainer}>
            <Text style={[styles.quickActionsTitle, { color: theme.colors.textSecondary }]}>
              Ações Rápidas:
            </Text>
            <View style={styles.quickActions}>
              {QUICK_ACTIONS.map(action => (
                <TouchableOpacity
                  key={action.id}
                  style={[styles.quickActionButton, { backgroundColor: theme.colors.surface }]}
                  onPress={() => handleQuickAction(action)}
                >
                  <Ionicons name={action.icon} size={20} color={theme.colors.primary} />
                  <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
                    {action.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
        <TextInput
          ref={inputRef}
          style={[styles.textInput, { color: theme.colors.text }]}
          placeholder="Digite sua mensagem..."
          placeholderTextColor={theme.colors.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor: inputText.trim() && !isLoading
                ? theme.colors.primary
                : theme.colors.textSecondary + '40'
            }
          ]}
          onPress={() => sendMessage(inputText)}
          disabled={!inputText.trim() || isLoading}
        >
          <Ionicons
            name="send"
            size={20}
            color={inputText.trim() && !isLoading ? 'white' : theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  userMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  speakButton: {
    padding: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  loadingBubble: {
    alignSelf: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderBottomLeftRadius: 4,
    marginBottom: 12,
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.6,
  },
  quickActionsContainer: {
    marginTop: 20,
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  quickActions: {
    gap: 8,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    fontSize: 16,
    lineHeight: 20,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});