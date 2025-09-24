import { AchievementCategory, AchievementType, AchievementTier } from '@prisma/client';

export interface AchievementDefinition {
  key: string;
  name: string;
  description: string;
  category: AchievementCategory;
  type: AchievementType;
  icon: string;
  points: number;
  requirement: number;
  tier: AchievementTier;
}

// Definições de todas as conquistas disponíveis
export const ACHIEVEMENTS: AchievementDefinition[] = [
  // WORKOUT ACHIEVEMENTS
  {
    key: 'first_workout',
    name: 'Primeira Vitória',
    description: 'Complete seu primeiro treino',
    category: 'WORKOUT',
    type: 'MILESTONE',
    icon: '🎯',
    points: 10,
    requirement: 1,
    tier: 'BRONZE'
  },
  {
    key: 'workout_5',
    name: 'Iniciante',
    description: 'Complete 5 treinos',
    category: 'WORKOUT',
    type: 'COUNTER',
    icon: '💪',
    points: 25,
    requirement: 5,
    tier: 'BRONZE'
  },
  {
    key: 'workout_10',
    name: 'Em Evolução',
    description: 'Complete 10 treinos',
    category: 'WORKOUT',
    type: 'COUNTER',
    icon: '🏃',
    points: 50,
    requirement: 10,
    tier: 'SILVER'
  },
  {
    key: 'workout_25',
    name: 'Dedicado',
    description: 'Complete 25 treinos',
    category: 'WORKOUT',
    type: 'COUNTER',
    icon: '🔥',
    points: 100,
    requirement: 25,
    tier: 'SILVER'
  },
  {
    key: 'workout_50',
    name: 'Guerreiro',
    description: 'Complete 50 treinos',
    category: 'WORKOUT',
    type: 'COUNTER',
    icon: '⚡',
    points: 200,
    requirement: 50,
    tier: 'GOLD'
  },
  {
    key: 'workout_100',
    name: 'Centurião',
    description: 'Complete 100 treinos',
    category: 'WORKOUT',
    type: 'COUNTER',
    icon: '🏆',
    points: 500,
    requirement: 100,
    tier: 'PLATINUM'
  },
  {
    key: 'workout_365',
    name: 'Lenda',
    description: 'Complete 365 treinos',
    category: 'WORKOUT',
    type: 'COUNTER',
    icon: '👑',
    points: 1000,
    requirement: 365,
    tier: 'DIAMOND'
  },

  // CONSISTENCY ACHIEVEMENTS (Streaks)
  {
    key: 'streak_3',
    name: 'Começando Forte',
    description: '3 dias consecutivos de treino',
    category: 'CONSISTENCY',
    type: 'STREAK',
    icon: '📅',
    points: 15,
    requirement: 3,
    tier: 'BRONZE'
  },
  {
    key: 'streak_7',
    name: 'Semana Perfeita',
    description: '7 dias consecutivos de treino',
    category: 'CONSISTENCY',
    type: 'STREAK',
    icon: '🎯',
    points: 50,
    requirement: 7,
    tier: 'SILVER'
  },
  {
    key: 'streak_14',
    name: 'Duas Semanas',
    description: '14 dias consecutivos de treino',
    category: 'CONSISTENCY',
    type: 'STREAK',
    icon: '💫',
    points: 100,
    requirement: 14,
    tier: 'SILVER'
  },
  {
    key: 'streak_30',
    name: 'Mês Completo',
    description: '30 dias consecutivos de treino',
    category: 'CONSISTENCY',
    type: 'STREAK',
    icon: '🌟',
    points: 250,
    requirement: 30,
    tier: 'GOLD'
  },
  {
    key: 'streak_60',
    name: 'Inabalável',
    description: '60 dias consecutivos de treino',
    category: 'CONSISTENCY',
    type: 'STREAK',
    icon: '💎',
    points: 500,
    requirement: 60,
    tier: 'PLATINUM'
  },
  {
    key: 'streak_100',
    name: 'Centurião da Consistência',
    description: '100 dias consecutivos de treino',
    category: 'CONSISTENCY',
    type: 'STREAK',
    icon: '🏅',
    points: 1000,
    requirement: 100,
    tier: 'DIAMOND'
  },

  // MILESTONE ACHIEVEMENTS
  {
    key: 'first_assessment',
    name: 'Ponto de Partida',
    description: 'Complete sua primeira avaliação física',
    category: 'MILESTONE',
    type: 'MILESTONE',
    icon: '📊',
    points: 20,
    requirement: 1,
    tier: 'BRONZE'
  },
  {
    key: 'weight_loss_5kg',
    name: 'Primeiros Resultados',
    description: 'Perca 5kg desde a primeira avaliação',
    category: 'MILESTONE',
    type: 'MILESTONE',
    icon: '⚖️',
    points: 100,
    requirement: 5,
    tier: 'SILVER'
  },
  {
    key: 'weight_loss_10kg',
    name: 'Transformação',
    description: 'Perca 10kg desde a primeira avaliação',
    category: 'MILESTONE',
    type: 'MILESTONE',
    icon: '🎉',
    points: 250,
    requirement: 10,
    tier: 'GOLD'
  },
  {
    key: 'muscle_gain_5kg',
    name: 'Ganhos Sólidos',
    description: 'Ganhe 5kg de massa muscular',
    category: 'MILESTONE',
    type: 'MILESTONE',
    icon: '💪',
    points: 200,
    requirement: 5,
    tier: 'GOLD'
  },
  {
    key: 'perfect_week',
    name: 'Semana Perfeita',
    description: 'Complete todos os treinos programados em uma semana',
    category: 'MILESTONE',
    type: 'MILESTONE',
    icon: '✅',
    points: 30,
    requirement: 1,
    tier: 'BRONZE'
  },
  {
    key: 'perfect_month',
    name: 'Mês Perfeito',
    description: 'Complete todos os treinos programados em um mês',
    category: 'MILESTONE',
    type: 'MILESTONE',
    icon: '🌟',
    points: 150,
    requirement: 1,
    tier: 'GOLD'
  },

  // NUTRITION ACHIEVEMENTS
  {
    key: 'nutrition_log_7',
    name: 'Diário Alimentar',
    description: 'Registre suas refeições por 7 dias',
    category: 'NUTRITION',
    type: 'COUNTER',
    icon: '🍎',
    points: 20,
    requirement: 7,
    tier: 'BRONZE'
  },
  {
    key: 'nutrition_log_30',
    name: 'Nutrição Consciente',
    description: 'Registre suas refeições por 30 dias',
    category: 'NUTRITION',
    type: 'COUNTER',
    icon: '🥗',
    points: 75,
    requirement: 30,
    tier: 'SILVER'
  },
  {
    key: 'water_goal_7',
    name: 'Hidratação',
    description: 'Atinja sua meta de água por 7 dias',
    category: 'NUTRITION',
    type: 'COUNTER',
    icon: '💧',
    points: 15,
    requirement: 7,
    tier: 'BRONZE'
  },

  // SOCIAL ACHIEVEMENTS
  {
    key: 'first_challenge',
    name: 'Aceite o Desafio',
    description: 'Participe do seu primeiro desafio',
    category: 'SOCIAL',
    type: 'MILESTONE',
    icon: '🎯',
    points: 25,
    requirement: 1,
    tier: 'BRONZE'
  },
  {
    key: 'challenge_winner',
    name: 'Campeão',
    description: 'Vença um desafio',
    category: 'SOCIAL',
    type: 'MILESTONE',
    icon: '🥇',
    points: 100,
    requirement: 1,
    tier: 'GOLD'
  },
  {
    key: 'top_3_leaderboard',
    name: 'Pódio',
    description: 'Fique entre os top 3 do ranking mensal',
    category: 'SOCIAL',
    type: 'MILESTONE',
    icon: '🏆',
    points: 150,
    requirement: 1,
    tier: 'GOLD'
  },
  {
    key: 'motivator',
    name: 'Motivador',
    description: 'Envie 10 mensagens de apoio para outros',
    category: 'SOCIAL',
    type: 'COUNTER',
    icon: '💬',
    points: 30,
    requirement: 10,
    tier: 'SILVER'
  },

  // SPECIAL ACHIEVEMENTS
  {
    key: 'early_bird',
    name: 'Madrugador',
    description: 'Complete 10 treinos antes das 7h',
    category: 'SPECIAL',
    type: 'COUNTER',
    icon: '🌅',
    points: 50,
    requirement: 10,
    tier: 'SILVER'
  },
  {
    key: 'night_owl',
    name: 'Notívago',
    description: 'Complete 10 treinos após as 20h',
    category: 'SPECIAL',
    type: 'COUNTER',
    icon: '🌙',
    points: 50,
    requirement: 10,
    tier: 'SILVER'
  },
  {
    key: 'weekend_warrior',
    name: 'Guerreiro de Fim de Semana',
    description: 'Treine todos os fins de semana por um mês',
    category: 'SPECIAL',
    type: 'COUNTER',
    icon: '🎉',
    points: 75,
    requirement: 8,
    tier: 'SILVER'
  },
  {
    key: 'new_year_resolution',
    name: 'Resolução de Ano Novo',
    description: 'Mantenha sua streak por todo janeiro',
    category: 'SPECIAL',
    type: 'STREAK',
    icon: '🎊',
    points: 200,
    requirement: 31,
    tier: 'GOLD'
  },
  {
    key: 'comeback_kid',
    name: 'De Volta ao Jogo',
    description: 'Retorne após 7 dias sem treinar',
    category: 'SPECIAL',
    type: 'MILESTONE',
    icon: '💪',
    points: 25,
    requirement: 1,
    tier: 'BRONZE'
  }
];

// Função para calcular o nível baseado nos pontos
export function calculateLevel(totalPoints: number): { level: number; currentLevelPoints: number; nextLevelPoints: number; progress: number } {
  const levels = [
    0,      // Level 1
    100,    // Level 2
    250,    // Level 3
    500,    // Level 4
    1000,   // Level 5
    1750,   // Level 6
    2750,   // Level 7
    4000,   // Level 8
    5500,   // Level 9
    7500,   // Level 10
    10000,  // Level 11
    13000,  // Level 12
    16500,  // Level 13
    20500,  // Level 14
    25000,  // Level 15
    30000,  // Level 16
    35500,  // Level 17
    41500,  // Level 18
    48000,  // Level 19
    55000,  // Level 20
  ];

  let level = 1;
  let currentLevelPoints = 0;
  let nextLevelPoints = levels[1];

  for (let i = 0; i < levels.length - 1; i++) {
    if (totalPoints >= levels[i]) {
      level = i + 1;
      currentLevelPoints = levels[i];
      nextLevelPoints = levels[i + 1] || levels[levels.length - 1];
    } else {
      break;
    }
  }

  const progress = ((totalPoints - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;

  return {
    level,
    currentLevelPoints,
    nextLevelPoints,
    progress: Math.min(progress, 100)
  };
}

// Função para obter o título baseado no nível
export function getLevelTitle(level: number): string {
  const titles = [
    'Iniciante',        // 1
    'Aprendiz',         // 2
    'Praticante',       // 3
    'Dedicado',         // 4
    'Experiente',       // 5
    'Veterano',         // 6
    'Elite',            // 7
    'Mestre',           // 8
    'Grão-Mestre',      // 9
    'Campeão',          // 10
    'Herói',            // 11
    'Lenda',            // 12
    'Mítico',           // 13
    'Épico',            // 14
    'Supremo',          // 15
    'Titã',             // 16
    'Imortal',          // 17
    'Divino',           // 18
    'Transcendente',    // 19
    'FitGenius',        // 20
  ];

  return titles[level - 1] || 'FitGenius';
}

// Função para obter a cor do tier
export function getTierColor(tier: AchievementTier): string {
  const colors = {
    BRONZE: '#CD7F32',
    SILVER: '#C0C0C0',
    GOLD: '#FFD700',
    PLATINUM: '#E5E4E2',
    DIAMOND: '#B9F2FF'
  };

  return colors[tier];
}

// Função para obter o próximo achievement de uma categoria
export function getNextAchievement(category: AchievementCategory, currentCount: number): AchievementDefinition | null {
  const categoryAchievements = ACHIEVEMENTS
    .filter(a => a.category === category && a.type === 'COUNTER')
    .sort((a, b) => a.requirement - b.requirement);

  return categoryAchievements.find(a => a.requirement > currentCount) || null;
}