import { prisma } from '@/lib/prisma';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    confidence?: number;
    sources?: string[];
    suggestedActions?: string[];
    clientContext?: {
      id: string;
      name: string;
      goal: string;
    };
  };
}

export interface ChatContext {
  userId: string;
  clientId?: string;
  conversationId: string;
  language: 'pt-BR' | 'en-US';
  previousMessages: ChatMessage[];
  userRole: 'PROFESSIONAL' | 'CLIENT';
}

export interface KnowledgeBase {
  exercises: {
    [key: string]: {
      name: string;
      description: string;
      muscleGroups: string[];
      equipment: string[];
      difficulty: string;
      instructions: string[];
      commonMistakes: string[];
      variations: string[];
    };
  };
  nutrition: {
    foods: {
      [key: string]: {
        name: string;
        calories: number;
        macros: { protein: number; carbs: number; fat: number };
        benefits: string[];
        bestTimes: string[];
        pairsWith: string[];
      };
    };
    principles: {
      [key: string]: {
        title: string;
        description: string;
        applications: string[];
        examples: string[];
      };
    };
  };
  protocols: {
    [key: string]: {
      name: string;
      description: string;
      steps: string[];
      indications: string[];
      contraindications: string[];
    };
  };
}

export class AIChatbotAssistant {
  private knowledgeBase: KnowledgeBase;

  constructor() {
    this.knowledgeBase = this.initializeKnowledgeBase();
  }

  /**
   * Process a chat message and generate an intelligent response
   */
  async processMessage(
    message: string,
    context: ChatContext
  ): Promise<ChatMessage> {
    try {
      // Analyze message intent and extract entities
      const analysis = await this.analyzeMessage(message, context);

      // Generate response based on intent
      let response: string;
      let metadata: any = {};

      switch (analysis.intent) {
        case 'EXERCISE_QUESTION':
          response = await this.handleExerciseQuestion(analysis, context);
          metadata.sources = ['exercise_database'];
          break;

        case 'NUTRITION_QUESTION':
          response = await this.handleNutritionQuestion(analysis, context);
          metadata.sources = ['nutrition_database'];
          break;

        case 'PROGRESS_INQUIRY':
          response = await this.handleProgressInquiry(analysis, context);
          metadata.sources = ['client_data', 'analytics'];
          break;

        case 'RECOMMENDATION_REQUEST':
          response = await this.handleRecommendationRequest(analysis, context);
          metadata.sources = ['ai_recommendations'];
          metadata.suggestedActions = ['view_recommendations', 'create_workout'];
          break;

        case 'GENERAL_QUESTION':
          response = await this.handleGeneralQuestion(analysis, context);
          break;

        case 'GREETING':
          response = this.handleGreeting(context);
          break;

        default:
          response = await this.handleUnknownIntent(message, context);
      }

      // Create response message
      const responseMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        metadata: {
          confidence: analysis.confidence,
          ...metadata
        }
      };

      // Store conversation in database
      await this.storeConversation(context, message, responseMessage);

      return responseMessage;

    } catch (error) {
      console.error('Chatbot processing error:', error);
      return this.generateErrorResponse();
    }
  }

  /**
   * Analyze user message to understand intent and extract entities
   */
  private async analyzeMessage(
    message: string,
    context: ChatContext
  ): Promise<{
    intent: string;
    entities: any[];
    confidence: number;
    keywords: string[];
  }> {
    const lowercaseMessage = message.toLowerCase();

    // Keyword-based intent classification
    const intents = [
      {
        name: 'EXERCISE_QUESTION',
        keywords: ['exercício', 'treino', 'série', 'repetição', 'peso', 'muscle', 'workout', 'exercise'],
        confidence: 0.8
      },
      {
        name: 'NUTRITION_QUESTION',
        keywords: ['dieta', 'alimentação', 'calorias', 'proteína', 'carboidrato', 'gordura', 'nutrition', 'food'],
        confidence: 0.8
      },
      {
        name: 'PROGRESS_INQUIRY',
        keywords: ['progresso', 'evolução', 'resultado', 'peso', 'medidas', 'progress', 'results'],
        confidence: 0.7
      },
      {
        name: 'RECOMMENDATION_REQUEST',
        keywords: ['recomende', 'sugira', 'melhor', 'recommend', 'suggest', 'best'],
        confidence: 0.9
      },
      {
        name: 'GREETING',
        keywords: ['oi', 'olá', 'hello', 'hi', 'bom dia', 'boa tarde', 'boa noite'],
        confidence: 0.95
      }
    ];

    // Find best matching intent
    let bestIntent = { name: 'GENERAL_QUESTION', confidence: 0.3 };

    for (const intent of intents) {
      const matches = intent.keywords.filter(keyword =>
        lowercaseMessage.includes(keyword)
      );

      if (matches.length > 0) {
        const confidence = (matches.length / intent.keywords.length) * intent.confidence;
        if (confidence > bestIntent.confidence) {
          bestIntent = { name: intent.name, confidence };
        }
      }
    }

    // Extract entities (simplified)
    const entities = this.extractEntities(message);

    return {
      intent: bestIntent.name,
      entities,
      confidence: bestIntent.confidence,
      keywords: lowercaseMessage.split(' ')
    };
  }

  /**
   * Handle exercise-related questions
   */
  private async handleExerciseQuestion(analysis: any, context: ChatContext): Promise<string> {
    const message = context.previousMessages[context.previousMessages.length - 1]?.content || '';

    // Check if asking about specific exercise
    const exerciseNames = Object.keys(this.knowledgeBase.exercises);
    const mentionedExercise = exerciseNames.find(name =>
      message.toLowerCase().includes(name.toLowerCase())
    );

    if (mentionedExercise) {
      const exercise = this.knowledgeBase.exercises[mentionedExercise];
      return `**${exercise.name}**

📋 **Descrição:** ${exercise.description}

🎯 **Grupos musculares:** ${exercise.muscleGroups.join(', ')}
🏋️ **Equipamentos:** ${exercise.equipment.join(', ')}
⭐ **Dificuldade:** ${exercise.difficulty}

**Instruções:**
${exercise.instructions.map((inst, i) => `${i + 1}. ${inst}`).join('\n')}

⚠️ **Erros comuns:**
${exercise.commonMistakes.map(mistake => `• ${mistake}`).join('\n')}

💡 **Variações:**
${exercise.variations.map(variation => `• ${variation}`).join('\n')}

Precisa de mais alguma informação sobre este exercício?`;
    }

    // General exercise advice
    if (context.clientId) {
      const clientData = await this.getClientContext(context.clientId);
      return `Com base no seu perfil (${clientData.goal}), posso recomendar exercícios específicos.

Algumas opções gerais excelentes:
• **Para força:** Agachamento, supino, levantamento terra
• **Para resistência:** Burpees, mountain climbers, jumping jacks
• **Para hipertrofia:** Exercícios compostos com 8-12 repetições

Gostaria que eu recomende um treino personalizado para você?`;
    }

    return `Posso te ajudar com informações sobre exercícios!

Algumas categorias que domino:
• **Exercícios compostos** - Trabalham múltiplos grupos musculares
• **Exercícios isolados** - Focam em músculos específicos
• **Cardio** - Para resistência cardiovascular
• **Flexibilidade** - Alongamentos e mobilidade

Sobre qual tipo de exercício você gostaria de saber mais?`;
  }

  /**
   * Handle nutrition-related questions
   */
  private async handleNutritionQuestion(analysis: any, context: ChatContext): Promise<string> {
    if (context.clientId) {
      const clientData = await this.getClientContext(context.clientId);

      return `Com base no seu objetivo de ${clientData.goal.toLowerCase()}, aqui estão algumas diretrizes nutricionais:

🥗 **Macronutrientes recomendados:**
• **Proteína:** ${this.getProteinRecommendation(clientData.goal)}
• **Carboidratos:** ${this.getCarbRecommendation(clientData.goal)}
• **Gorduras:** ${this.getFatRecommendation(clientData.goal)}

🍎 **Alimentos prioritários:**
${this.getFoodRecommendations(clientData.goal).map(food => `• ${food}`).join('\n')}

⏰ **Timing das refeições:**
• Pré-treino: Carboidratos + pouca proteína (30-60 min antes)
• Pós-treino: Proteína + carboidratos (até 30 min após)

Gostaria de recomendações mais específicas ou um plano alimentar personalizado?`;
    }

    return `Posso te ajudar com orientações nutricionais!

📊 **Áreas que domino:**
• **Macronutrientes** - Proteínas, carboidratos e gorduras
• **Timing nutricional** - Quando comer para otimizar resultados
• **Suplementação** - Quando e como usar
• **Hidratação** - Necessidades hídricas para treino

Sobre qual aspecto da nutrição você gostaria de saber mais?`;
  }

  /**
   * Handle progress inquiry
   */
  private async handleProgressInquiry(analysis: any, context: ChatContext): Promise<string> {
    if (!context.clientId) {
      return `Para analisar seu progresso, preciso acessar seus dados de cliente. Certifique-se de que está logado corretamente.`;
    }

    try {
      // Get recent progress data
      const progressData = await prisma.physicalAssessment.findMany({
        where: { clientId: context.clientId },
        orderBy: { createdAt: 'desc' },
        take: 3
      });

      if (progressData.length === 0) {
        return `Ainda não temos dados de avaliação física suficientes para análise de progresso.

📋 **Recomendo registrar:**
• Peso corporal
• Medidas corporais
• Fotos de progresso
• Performance nos exercícios

Quando tivermos mais dados, poderei fornecer insights valiosos sobre sua evolução!`;
      }

      const latest = progressData[0];
      const previous = progressData[1];

      let progressAnalysis = `📊 **Sua Evolução Recente:**\n\n`;

      if (previous) {
        const weightChange = latest.weight - previous.weight;
        const daysBetween = Math.ceil((latest.createdAt.getTime() - previous.createdAt.getTime()) / (1000 * 60 * 60 * 24));

        progressAnalysis += `⚖️ **Peso:** ${latest.weight}kg `;
        if (weightChange > 0) {
          progressAnalysis += `(+${weightChange.toFixed(1)}kg em ${daysBetween} dias) 📈\n`;
        } else if (weightChange < 0) {
          progressAnalysis += `(${weightChange.toFixed(1)}kg em ${daysBetween} dias) 📉\n`;
        } else {
          progressAnalysis += `(estável) ➡️\n`;
        }

        if (latest.bodyFat && previous.bodyFat) {
          const bfChange = latest.bodyFat - previous.bodyFat;
          progressAnalysis += `📊 **Gordura corporal:** ${latest.bodyFat}% `;
          progressAnalysis += bfChange > 0 ? `(+${bfChange.toFixed(1)}%)\n` : `(${bfChange.toFixed(1)}%)\n`;
        }
      }

      progressAnalysis += `\n💡 **Insights:**\n`;
      progressAnalysis += `• Última avaliação: ${latest.createdAt.toLocaleDateString('pt-BR')}\n`;
      progressAnalysis += `• Consistência é fundamental - continue registrando dados!\n`;
      progressAnalysis += `• Quer uma análise mais detalhada? Posso gerar um relatório completo.\n`;

      return progressAnalysis;

    } catch (error) {
      return `Ocorreu um erro ao acessar seus dados de progresso. Tente novamente em alguns instantes.`;
    }
  }

  /**
   * Handle recommendation requests
   */
  private async handleRecommendationRequest(analysis: any, context: ChatContext): Promise<string> {
    if (!context.clientId) {
      return `Para fornecer recomendações personalizadas, preciso acessar seu perfil de cliente.`;
    }

    const clientData = await this.getClientContext(context.clientId);

    return `🤖 **Recomendações Personalizadas para ${clientData.name}**

Com base no seu objetivo de **${clientData.goal}**, posso sugerir:

🏋️ **Treinos Inteligentes:**
• Exercícios adaptados ao seu nível
• Progressão automática baseada no seu histórico
• Foco nos seus pontos de melhoria

🥗 **Nutrição Otimizada:**
• Planos alimentares alinhados com seus objetivos
• Sugestões de refeições práticas
• Cálculos automáticos de macronutrientes

📈 **Análises Preditivas:**
• Previsão do seu progresso futuro
• Identificação de possíveis plateaus
• Ajustes preventivos para melhores resultados

Qual tipo de recomendação você gostaria que eu gerasse primeiro? Digite:
• "treino" para recomendações de exercícios
• "dieta" para sugestões nutricionais
• "progresso" para análise preditiva`;
  }

  /**
   * Handle general fitness questions
   */
  private async handleGeneralQuestion(analysis: any, context: ChatContext): Promise<string> {
    const commonTopics = {
      'iniciante': 'Como iniciante, recomendo começar com exercícios básicos, focar na técnica e progressão gradual. Quer um plano específico?',
      'plateau': 'Plateaus são normais! Geralmente resolvemos variando exercícios, ajustando cargas ou revisando a dieta. Há quanto tempo não vê progressos?',
      'lesão': 'Para questões de lesão, sempre recomendo consultar um profissional da saúde. Posso sugerir exercícios de baixo impacto enquanto isso.',
      'suplemento': 'Suplementos podem ajudar, mas não substituem uma boa alimentação. Whey protein e creatina são os mais estudados. Qual seu objetivo?',
      'tempo': 'Resultados visíveis geralmente aparecem em 4-6 semanas com consistência. O mais importante é criar hábitos sustentáveis!',
    };

    const message = context.previousMessages[context.previousMessages.length - 1]?.content?.toLowerCase() || '';

    for (const [topic, response] of Object.entries(commonTopics)) {
      if (message.includes(topic)) {
        return response;
      }
    }

    return `Sou seu assistente especializado em fitness e nutrição! 💪

Posso te ajudar com:
• **Exercícios** - Técnicas, variações e programação
• **Nutrição** - Dietas, macros e timing
• **Progresso** - Análise de dados e previsões
• **Dicas gerais** - Motivação e boas práticas

Sobre o que você gostaria de conversar hoje?`;
  }

  /**
   * Handle greeting messages
   */
  private handleGreeting(context: ChatContext): string {
    const timeOfDay = new Date().getHours();
    let greeting = 'Olá';

    if (timeOfDay < 12) greeting = 'Bom dia';
    else if (timeOfDay < 18) greeting = 'Boa tarde';
    else greeting = 'Boa noite';

    const userName = context.userId ? 'professor' : 'atleta';

    return `${greeting}! 👋

Sou o **FitGenius AI**, seu assistente inteligente para fitness e nutrição.

Estou aqui para ajudar você a:
• 💪 Otimizar seus treinos
• 🥗 Melhorar sua alimentação
• 📈 Acompanhar seu progresso
• 🎯 Alcançar seus objetivos

Como posso te ajudar hoje? Pode perguntar qualquer coisa sobre exercícios, nutrição ou seus resultados!`;
  }

  /**
   * Handle unknown intents
   */
  private async handleUnknownIntent(message: string, context: ChatContext): Promise<string> {
    return `Desculpe, não entendi completamente sua pergunta. 😅

Posso te ajudar melhor se você perguntar sobre:
• **Exercícios específicos** - "Como fazer supino corretamente?"
• **Dicas de nutrição** - "Quantas proteínas devo comer?"
• **Seu progresso** - "Como estou evoluindo?"
• **Recomendações** - "Que treino é melhor para mim?"

Pode reformular sua pergunta ou escolher um dos tópicos acima?`;
  }

  /**
   * Generate error response
   */
  private generateErrorResponse(): ChatMessage {
    return {
      id: `error-${Date.now()}`,
      role: 'assistant',
      content: `Ops! Ocorreu um erro temporário. 😔

Por favor, tente novamente em alguns instantes. Se o problema persistir, entre em contato com o suporte.`,
      timestamp: new Date(),
      metadata: { confidence: 0 }
    };
  }

  /**
   * Extract entities from message (simplified NER)
   */
  private extractEntities(message: string): any[] {
    const entities = [];

    // Numbers (weights, reps, etc.)
    const numbers = message.match(/\d+/g);
    if (numbers) {
      entities.push({ type: 'NUMBER', values: numbers });
    }

    // Exercise names
    const exerciseNames = Object.keys(this.knowledgeBase.exercises);
    const mentionedExercises = exerciseNames.filter(name =>
      message.toLowerCase().includes(name.toLowerCase())
    );
    if (mentionedExercises.length > 0) {
      entities.push({ type: 'EXERCISE', values: mentionedExercises });
    }

    return entities;
  }

  /**
   * Get client context data
   */
  private async getClientContext(clientId: string) {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: { user: true }
    });

    return {
      id: client?.id || '',
      name: client?.user?.name || 'Cliente',
      goal: client?.fitnessGoal || 'Condicionamento geral'
    };
  }

  /**
   * Store conversation in database
   */
  private async storeConversation(
    context: ChatContext,
    userMessage: string,
    assistantMessage: ChatMessage
  ) {
    try {
      await prisma.aiConversation.create({
        data: {
          userId: context.userId,
          clientId: context.clientId,
          userMessage,
          assistantResponse: assistantMessage.content,
          intent: assistantMessage.metadata?.sources?.[0] || 'general',
          confidence: assistantMessage.metadata?.confidence || 0,
          timestamp: new Date(),
        }
      });
    } catch (error) {
      console.error('Error storing conversation:', error);
    }
  }

  /**
   * Get nutrition recommendations based on goal
   */
  private getProteinRecommendation(goal: string): string {
    switch (goal.toUpperCase()) {
      case 'MUSCLE_GAIN':
        return '1.8-2.2g por kg de peso corporal';
      case 'WEIGHT_LOSS':
        return '2.0-2.5g por kg de peso corporal';
      case 'ENDURANCE':
        return '1.4-1.6g por kg de peso corporal';
      default:
        return '1.6-2.0g por kg de peso corporal';
    }
  }

  private getCarbRecommendation(goal: string): string {
    switch (goal.toUpperCase()) {
      case 'MUSCLE_GAIN':
        return '4-6g por kg de peso corporal';
      case 'WEIGHT_LOSS':
        return '2-3g por kg de peso corporal';
      case 'ENDURANCE':
        return '5-7g por kg de peso corporal';
      default:
        return '3-5g por kg de peso corporal';
    }
  }

  private getFatRecommendation(goal: string): string {
    return '0.8-1.2g por kg de peso corporal (20-30% do total de calorias)';
  }

  private getFoodRecommendations(goal: string): string[] {
    const base = [
      'Proteínas magras (frango, peixe, ovos)',
      'Carboidratos complexos (aveia, batata doce)',
      'Gorduras boas (abacate, oleaginosas)',
      'Vegetais variados',
      'Frutas da época'
    ];

    switch (goal.toUpperCase()) {
      case 'MUSCLE_GAIN':
        return [...base, 'Whey protein', 'Creatina', 'Mais calorias no geral'];
      case 'WEIGHT_LOSS':
        return [...base, 'Alimentos termogênicos', 'Fibras extras', 'Controle de porções'];
      default:
        return base;
    }
  }

  /**
   * Initialize knowledge base with fitness data
   */
  private initializeKnowledgeBase(): KnowledgeBase {
    return {
      exercises: {
        'supino': {
          name: 'Supino Reto',
          description: 'Exercício fundamental para desenvolvimento do peitoral, deltoides anterior e tríceps',
          muscleGroups: ['Peitoral', 'Deltoides anterior', 'Tríceps'],
          equipment: ['Barra', 'Banco', 'Anilhas'],
          difficulty: 'Intermediário',
          instructions: [
            'Deite no banco com os pés apoiados no chão',
            'Segure a barra com pegada um pouco mais larga que os ombros',
            'Retire a barra do suporte e posicione sobre o peito',
            'Desça controladamente até quase tocar o peito',
            'Empurre a barra de volta à posição inicial'
          ],
          commonMistakes: [
            'Arco excessivo nas costas',
            'Pegada muito aberta ou muito fechada',
            'Não controlar a descida',
            'Não tocar o peito'
          ],
          variations: [
            'Supino inclinado',
            'Supino declinado',
            'Supino com halteres',
            'Supino fechado'
          ]
        },
        'agachamento': {
          name: 'Agachamento',
          description: 'Movimento fundamental para desenvolvimento de pernas e glúteos',
          muscleGroups: ['Quadríceps', 'Glúteos', 'Isquiotibiais', 'Core'],
          equipment: ['Barra', 'Anilhas', 'Rack'],
          difficulty: 'Intermediário',
          instructions: [
            'Posicione a barra no trapézio superior',
            'Pés na largura dos ombros',
            'Desça empurrando o quadril para trás',
            'Mantenha os joelhos alinhados com os pés',
            'Suba empurrando o chão com os pés'
          ],
          commonMistakes: [
            'Joelhos convergindo para dentro',
            'Não descer o suficiente',
            'Peso nos dedos dos pés',
            'Coluna arqueada demais'
          ],
          variations: [
            'Agachamento frontal',
            'Agachamento búlgaro',
            'Agachamento sumô',
            'Agachamento livre'
          ]
        }
      },
      nutrition: {
        foods: {
          'frango': {
            name: 'Peito de frango',
            calories: 165,
            macros: { protein: 31, carbs: 0, fat: 3.6 },
            benefits: ['Alto teor proteico', 'Baixo teor de gordura', 'Rico em B6'],
            bestTimes: ['Pós-treino', 'Almoço', 'Jantar'],
            pairsWith: ['Batata doce', 'Arroz integral', 'Vegetais']
          }
        },
        principles: {
          'deficit_calorico': {
            title: 'Déficit Calórico',
            description: 'Consumir menos calorias do que se gasta para perda de peso',
            applications: ['Perda de peso', 'Definição muscular'],
            examples: ['Reduzir 300-500 kcal/dia', 'Aumentar cardio', 'Controlar porções']
          }
        }
      },
      protocols: {
        'hipertrofia': {
          name: 'Protocol de Hipertrofia',
          description: 'Programa focado no aumento da massa muscular',
          steps: ['6-12 repetições', '3-4 séries', 'Descanso 60-90s', 'Progressive overload'],
          indications: ['Ganho de massa muscular', 'Melhora estética'],
          contraindications: ['Lesões ativas', 'Falta de base técnica']
        }
      }
    };
  }
}