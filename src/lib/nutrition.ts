// Biblioteca de cálculos nutricionais

export interface NutritionData {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface MacroRatios {
  carbRatio: number; // %
  proteinRatio: number; // %
  fatRatio: number; // %
}

// Cálculo de BMR (Taxa Metabólica Basal) - Fórmula Mifflin-St Jeor
export function calculateBMR(
  weight: number, // kg
  height: number, // cm
  age: number, // anos
  gender: 'MALE' | 'FEMALE'
): number {
  const baseCalc = 10 * weight + 6.25 * height - 5 * age;
  return gender === 'MALE' ? baseCalc + 5 : baseCalc - 161;
}

// Cálculo de TDEE (Gasto Energético Total Diário)
export function calculateTDEE(
  bmr: number,
  activityLevel: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE'
): number {
  const multipliers = {
    SEDENTARY: 1.2,
    LIGHT: 1.375,
    MODERATE: 1.55,
    ACTIVE: 1.725,
    VERY_ACTIVE: 1.9
  };
  
  return bmr * multipliers[activityLevel];
}

// Cálculo de necessidades calóricas baseado no objetivo
export function calculateCalorieNeeds(
  tdee: number,
  goal: 'WEIGHT_LOSS' | 'WEIGHT_GAIN' | 'MAINTENANCE' | 'MUSCLE_GAIN' | 'FAT_LOSS'
): number {
  switch (goal) {
    case 'WEIGHT_LOSS':
    case 'FAT_LOSS':
      return tdee * 0.8; // Déficit de 20%
    case 'WEIGHT_GAIN':
    case 'MUSCLE_GAIN':
      return tdee * 1.15; // Superávit de 15%
    case 'MAINTENANCE':
    default:
      return tdee;
  }
}

// Distribuição de macronutrientes
export function calculateMacros(
  totalCalories: number,
  ratios: MacroRatios
): {
  calories: number;
  carbs: number; // gramas
  protein: number; // gramas
  fat: number; // gramas
} {
  const carbCalories = totalCalories * (ratios.carbRatio / 100);
  const proteinCalories = totalCalories * (ratios.proteinRatio / 100);
  const fatCalories = totalCalories * (ratios.fatRatio / 100);
  
  return {
    calories: totalCalories,
    carbs: carbCalories / 4, // 1g carb = 4 calorias
    protein: proteinCalories / 4, // 1g proteína = 4 calorias
    fat: fatCalories / 9 // 1g gordura = 9 calorias
  };
}

// Calcular valores nutricionais por quantidade
export function calculateNutritionByQuantity(
  nutrition100g: NutritionData,
  quantity: number // gramas
): NutritionData {
  const multiplier = quantity / 100;
  
  return {
    calories: nutrition100g.calories * multiplier,
    carbs: nutrition100g.carbs * multiplier,
    protein: nutrition100g.protein * multiplier,
    fat: nutrition100g.fat * multiplier,
    fiber: nutrition100g.fiber ? nutrition100g.fiber * multiplier : undefined,
    sugar: nutrition100g.sugar ? nutrition100g.sugar * multiplier : undefined,
    sodium: nutrition100g.sodium ? nutrition100g.sodium * multiplier : undefined
  };
}

// Somar valores nutricionais
export function sumNutrition(nutritions: NutritionData[]): NutritionData {
  return nutritions.reduce(
    (total, current) => ({
      calories: total.calories + current.calories,
      carbs: total.carbs + current.carbs,
      protein: total.protein + current.protein,
      fat: total.fat + current.fat,
      fiber: (total.fiber || 0) + (current.fiber || 0),
      sugar: (total.sugar || 0) + (current.sugar || 0),
      sodium: (total.sodium || 0) + (current.sodium || 0)
    }),
    {
      calories: 0,
      carbs: 0,
      protein: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    }
  );
}

// Calcular água necessária (ml por dia)
export function calculateWaterNeeds(
  weight: number, // kg
  activityLevel: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE'
): number {
  // Base: 35ml por kg de peso corporal
  let baseWater = weight * 35;
  
  // Adicionar baseado na atividade física
  const activityMultipliers = {
    SEDENTARY: 1,
    LIGHT: 1.1,
    MODERATE: 1.2,
    ACTIVE: 1.3,
    VERY_ACTIVE: 1.4
  };
  
  return baseWater * activityMultipliers[activityLevel];
}

// Ratios de macronutrientes pré-definidos
export const MACRO_PRESETS: Record<string, MacroRatios> = {
  balanced: { carbRatio: 50, proteinRatio: 25, fatRatio: 25 },
  lowCarb: { carbRatio: 30, proteinRatio: 35, fatRatio: 35 },
  highProtein: { carbRatio: 40, proteinRatio: 40, fatRatio: 20 },
  keto: { carbRatio: 10, proteinRatio: 25, fatRatio: 65 },
  endurance: { carbRatio: 60, proteinRatio: 20, fatRatio: 20 }
};

// Classificação de IMC
export function classifyBMI(weight: number, height: number): {
  bmi: number;
  classification: string;
  healthStatus: 'underweight' | 'normal' | 'overweight' | 'obese';
} {
  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);
  
  let classification: string;
  let healthStatus: 'underweight' | 'normal' | 'overweight' | 'obese';
  
  if (bmi < 18.5) {
    classification = 'Abaixo do peso';
    healthStatus = 'underweight';
  } else if (bmi < 25) {
    classification = 'Peso normal';
    healthStatus = 'normal';
  } else if (bmi < 30) {
    classification = 'Sobrepeso';
    healthStatus = 'overweight';
  } else {
    classification = 'Obesidade';
    healthStatus = 'obese';
  }
  
  return {
    bmi: Math.round(bmi * 10) / 10,
    classification,
    healthStatus
  };
}

// Formatação de unidades
export function formatNutrition(nutrition: NutritionData): {
  calories: string;
  carbs: string;
  protein: string;
  fat: string;
  fiber?: string;
  sugar?: string;
  sodium?: string;
} {
  return {
    calories: `${Math.round(nutrition.calories)} kcal`,
    carbs: `${Math.round(nutrition.carbs)}g`,
    protein: `${Math.round(nutrition.protein)}g`,
    fat: `${Math.round(nutrition.fat)}g`,
    fiber: nutrition.fiber ? `${Math.round(nutrition.fiber)}g` : undefined,
    sugar: nutrition.sugar ? `${Math.round(nutrition.sugar)}g` : undefined,
    sodium: nutrition.sodium ? `${Math.round(nutrition.sodium)}mg` : undefined
  };
}