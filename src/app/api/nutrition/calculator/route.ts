import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { 
  calculateBMR, 
  calculateTDEE, 
  calculateCalorieNeeds, 
  calculateMacros,
  calculateWaterNeeds,
  classifyBMI,
  MACRO_PRESETS
} from '@/lib/nutrition';

// POST - Calcular necessidades nutricionais
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const {
      weight, // kg
      height, // cm
      age, // anos
      gender, // 'MALE' | 'FEMALE'
      activityLevel, // 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE'
      goal, // 'WEIGHT_LOSS' | 'WEIGHT_GAIN' | 'MAINTENANCE' | 'MUSCLE_GAIN' | 'FAT_LOSS'
      macroPreset = 'balanced', // 'balanced' | 'lowCarb' | 'highProtein' | 'keto' | 'endurance'
      customMacros // { carbRatio, proteinRatio, fatRatio }
    } = await request.json();

    if (!weight || !height || !age || !gender || !activityLevel || !goal) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calcular BMR (Taxa Metabólica Basal)
    const bmr = calculateBMR(weight, height, age, gender);
    
    // Calcular TDEE (Gasto Energético Total)
    const tdee = calculateTDEE(bmr, activityLevel);
    
    // Calcular necessidades calóricas baseado no objetivo
    const calorieNeeds = calculateCalorieNeeds(tdee, goal);
    
    // Definir ratios de macronutrientes
    const macroRatios = customMacros || MACRO_PRESETS[macroPreset] || MACRO_PRESETS.balanced;
    
    // Calcular distribuição de macros
    const macros = calculateMacros(calorieNeeds, macroRatios);
    
    // Calcular necessidade de água
    const waterNeeds = calculateWaterNeeds(weight, activityLevel);
    
    // Classificar IMC
    const bmiData = classifyBMI(weight, height);
    
    // Estimar tempo para atingir meta (simplificado)
    let estimatedTimeWeeks = null;
    if (goal === 'WEIGHT_LOSS' || goal === 'FAT_LOSS') {
      const weeklyDeficit = (tdee - calorieNeeds) * 7; // calorias por semana
      const expectedWeeklyLoss = weeklyDeficit / 7700; // aproximadamente 1kg = 7700 calorias
      estimatedTimeWeeks = expectedWeeklyLoss > 0 ? Math.ceil(5 / expectedWeeklyLoss) : null; // para perder 5kg
    } else if (goal === 'WEIGHT_GAIN' || goal === 'MUSCLE_GAIN') {
      const weeklySurplus = (calorieNeeds - tdee) * 7;
      const expectedWeeklyGain = weeklySurplus / 7700;
      estimatedTimeWeeks = expectedWeeklyGain > 0 ? Math.ceil(3 / expectedWeeklyGain) : null; // para ganhar 3kg
    }
    
    const results = {
      // Dados básicos
      input: {
        weight,
        height,
        age,
        gender,
        activityLevel,
        goal
      },
      
      // Cálculos metabólicos
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      calorieNeeds: Math.round(calorieNeeds),
      
      // Distribuição de macros
      macros: {
        calories: Math.round(macros.calories),
        carbs: Math.round(macros.carbs),
        protein: Math.round(macros.protein),
        fat: Math.round(macros.fat)
      },
      
      // Ratios utilizados
      macroRatios,
      
      // Outras necessidades
      waterNeeds: Math.round(waterNeeds),
      
      // Análise do IMC
      bmi: bmiData,
      
      // Estimativas
      estimatedTimeWeeks,
      
      // Recomendações
      recommendations: generateRecommendations(bmiData, goal, activityLevel)
    };
    
    return NextResponse.json(results);

  } catch (error) {
    console.error('Error calculating nutrition needs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateRecommendations(
  bmiData: any,
  goal: string,
  activityLevel: string
): string[] {
  const recommendations = [];
  
  // Recomendações baseadas no IMC
  if (bmiData.healthStatus === 'underweight') {
    recommendations.push('• Considere aumentar a ingestão calórica gradualmente');
    recommendations.push('• Foque em alimentos nutritivos e densos em calorias');
  } else if (bmiData.healthStatus === 'overweight' || bmiData.healthStatus === 'obese') {
    recommendations.push('• Mantenha um déficit calórico moderado e sustentável');
    recommendations.push('• Priorize alimentos ricos em fibras e proteínas');
  }
  
  // Recomendações baseadas na atividade física
  if (activityLevel === 'SEDENTARY') {
    recommendations.push('• Considere incluir atividade física regular');
  } else if (activityLevel === 'VERY_ACTIVE') {
    recommendations.push('• Certifique-se de consumir carboidratos suficientes para energia');
    recommendations.push('• Hidrate-se adequadamente antes, durante e após exercícios');
  }
  
  // Recomendações baseadas no objetivo
  if (goal === 'MUSCLE_GAIN') {
    recommendations.push('• Consuma proteína em todas as refeições');
    recommendations.push('• Não negligencie o treinamento de força');
  } else if (goal === 'WEIGHT_LOSS' || goal === 'FAT_LOSS') {
    recommendations.push('• Mantenha um déficit calórico consistente');
    recommendations.push('• Combine dieta com exercícios cardiovasculares');
  }
  
  // Recomendações gerais
  recommendations.push('• Beba pelo menos 2-3 litros de água por dia');
  recommendations.push('• Inclua frutas e vegetais variados na dieta');
  recommendations.push('• Consulte um profissional de nutrição para orientação personalizada');
  
  return recommendations;
}