import {
  calculateBMR,
  calculateTDEE,
  calculateMacros,
  calculateCalorieNeeds,
  classifyBMI,
  MACRO_PRESETS,
  MacroRatios
} from '../nutrition';

describe('Nutrition Calculations - Simple Tests', () => {
  describe('calculateBMR', () => {
    it('should calculate BMR for male correctly', () => {
      // Using Mifflin-St Jeor equation: BMR = 10 × weight + 6.25 × height - 5 × age + 5
      const result = calculateBMR(80, 180, 30, 'MALE');
      const expected = 10 * 80 + 6.25 * 180 - 5 * 30 + 5;
      expect(result).toBe(expected); // 1780
    });

    it('should calculate BMR for female correctly', () => {
      // Using Mifflin-St Jeor equation: BMR = 10 × weight + 6.25 × height - 5 × age - 161
      const result = calculateBMR(65, 165, 28, 'FEMALE');
      const expected = 10 * 65 + 6.25 * 165 - 5 * 28 - 161;
      expect(result).toBe(expected); // 1444.25
    });
  });

  describe('calculateTDEE', () => {
    const baseBMR = 1800;

    it('should calculate TDEE for sedentary activity level', () => {
      const result = calculateTDEE(baseBMR, 'SEDENTARY');
      expect(result).toBe(baseBMR * 1.2); // 2160
    });

    it('should calculate TDEE for light activity level', () => {
      const result = calculateTDEE(baseBMR, 'LIGHT');
      expect(result).toBe(baseBMR * 1.375); // 2475
    });

    it('should calculate TDEE for moderate activity level', () => {
      const result = calculateTDEE(baseBMR, 'MODERATE');
      expect(result).toBe(baseBMR * 1.55); // 2790
    });

    it('should calculate TDEE for active activity level', () => {
      const result = calculateTDEE(baseBMR, 'ACTIVE');
      expect(result).toBe(baseBMR * 1.725); // 3105
    });

    it('should calculate TDEE for very active activity level', () => {
      const result = calculateTDEE(baseBMR, 'VERY_ACTIVE');
      expect(result).toBe(baseBMR * 1.9); // 3420
    });
  });

  describe('calculateMacros', () => {
    const totalCalories = 2000;

    it('should calculate balanced macro distribution', () => {
      const ratios: MacroRatios = MACRO_PRESETS.balanced;
      const result = calculateMacros(totalCalories, ratios);

      expect(result.calories).toBe(totalCalories);
      expect(result.carbs).toBe((totalCalories * 0.50) / 4); // 250g
      expect(result.protein).toBe((totalCalories * 0.25) / 4); // 125g
      expect(result.fat).toBe((totalCalories * 0.25) / 9); // ~55.6g
    });

    it('should calculate low carb macro distribution', () => {
      const ratios: MacroRatios = MACRO_PRESETS.lowCarb;
      const result = calculateMacros(totalCalories, ratios);

      expect(result.calories).toBe(totalCalories);
      expect(result.carbs).toBe((totalCalories * 0.30) / 4); // 150g
      expect(result.protein).toBe((totalCalories * 0.35) / 4); // 175g
      expect(result.fat).toBe((totalCalories * 0.35) / 9); // ~77.8g
    });

    it('should calculate high protein macro distribution', () => {
      const ratios: MacroRatios = MACRO_PRESETS.highProtein;
      const result = calculateMacros(totalCalories, ratios);

      expect(result.calories).toBe(totalCalories);
      expect(result.carbs).toBe((totalCalories * 0.40) / 4); // 200g
      expect(result.protein).toBe((totalCalories * 0.40) / 4); // 200g
      expect(result.fat).toBe((totalCalories * 0.20) / 9); // ~44.4g
    });
  });

  describe('calculateCalorieNeeds', () => {
    const baseTDEE = 2500;

    it('should calculate calories for weight loss', () => {
      const result = calculateCalorieNeeds(baseTDEE, 'WEIGHT_LOSS');
      expect(result).toBe(baseTDEE * 0.8); // 2000
    });

    it('should calculate calories for fat loss', () => {
      const result = calculateCalorieNeeds(baseTDEE, 'FAT_LOSS');
      expect(result).toBe(baseTDEE * 0.8); // 2000
    });

    it('should calculate calories for weight gain', () => {
      const result = calculateCalorieNeeds(baseTDEE, 'WEIGHT_GAIN');
      expect(result).toBe(baseTDEE * 1.15); // 2875
    });

    it('should calculate calories for muscle gain', () => {
      const result = calculateCalorieNeeds(baseTDEE, 'MUSCLE_GAIN');
      expect(result).toBe(baseTDEE * 1.15); // 2875
    });

    it('should calculate calories for maintenance', () => {
      const result = calculateCalorieNeeds(baseTDEE, 'MAINTENANCE');
      expect(result).toBe(baseTDEE); // 2500
    });
  });

  describe('classifyBMI', () => {
    it('should classify underweight BMI', () => {
      const result = classifyBMI(50, 170); // BMI ~17.3
      expect(result.bmi).toBeLessThan(18.5);
      expect(result.classification).toBe('Abaixo do peso');
      expect(result.healthStatus).toBe('underweight');
    });

    it('should classify normal weight BMI', () => {
      const result = classifyBMI(70, 170); // BMI ~24.2
      expect(result.bmi).toBeGreaterThanOrEqual(18.5);
      expect(result.bmi).toBeLessThan(25);
      expect(result.classification).toBe('Peso normal');
      expect(result.healthStatus).toBe('normal');
    });

    it('should classify overweight BMI', () => {
      const result = classifyBMI(80, 170); // BMI ~27.7
      expect(result.bmi).toBeGreaterThanOrEqual(25);
      expect(result.bmi).toBeLessThan(30);
      expect(result.classification).toBe('Sobrepeso');
      expect(result.healthStatus).toBe('overweight');
    });

    it('should classify obese BMI', () => {
      const result = classifyBMI(95, 170); // BMI ~32.9
      expect(result.bmi).toBeGreaterThanOrEqual(30);
      expect(result.classification).toBe('Obesidade');
      expect(result.healthStatus).toBe('obese');
    });
  });

  describe('MACRO_PRESETS', () => {
    it('should have valid balanced macro ratios', () => {
      const ratios = MACRO_PRESETS.balanced;
      expect(ratios.carbRatio + ratios.proteinRatio + ratios.fatRatio).toBe(100);
    });

    it('should have valid low carb macro ratios', () => {
      const ratios = MACRO_PRESETS.lowCarb;
      expect(ratios.carbRatio + ratios.proteinRatio + ratios.fatRatio).toBe(100);
    });

    it('should have valid high protein macro ratios', () => {
      const ratios = MACRO_PRESETS.highProtein;
      expect(ratios.carbRatio + ratios.proteinRatio + ratios.fatRatio).toBe(100);
    });

    it('should have valid keto macro ratios', () => {
      const ratios = MACRO_PRESETS.keto;
      expect(ratios.carbRatio + ratios.proteinRatio + ratios.fatRatio).toBe(100);
      expect(ratios.carbRatio).toBeLessThanOrEqual(10); // Very low carb
    });

    it('should have valid endurance macro ratios', () => {
      const ratios = MACRO_PRESETS.endurance;
      expect(ratios.carbRatio + ratios.proteinRatio + ratios.fatRatio).toBe(100);
      expect(ratios.carbRatio).toBeGreaterThanOrEqual(60); // High carb
    });
  });

  describe('Integration Tests', () => {
    it('should calculate complete nutrition profile for a male athlete', () => {
      const weight = 85; // kg
      const height = 185; // cm
      const age = 25;
      const gender = 'MALE';
      const activityLevel = 'ACTIVE';
      const goal = 'MUSCLE_GAIN';
      const macroPreset = MACRO_PRESETS.highProtein;

      // Calculate BMR
      const bmr = calculateBMR(weight, height, age, gender);
      expect(bmr).toBeGreaterThan(1700);
      expect(bmr).toBeLessThan(2100);

      // Calculate TDEE
      const tdee = calculateTDEE(bmr, activityLevel);
      expect(tdee).toBeGreaterThan(2500);
      expect(tdee).toBeLessThan(3500);

      // Calculate calorie needs
      const calorieNeeds = calculateCalorieNeeds(tdee, goal);
      expect(calorieNeeds).toBeGreaterThan(tdee); // Should be higher for muscle gain

      // Calculate macros
      const macros = calculateMacros(calorieNeeds, macroPreset);
      expect(macros.protein).toBeGreaterThan(200); // High protein for athlete
      expect(macros.carbs).toBeGreaterThan(150);   // Sufficient carbs for energy
      expect(macros.fat).toBeGreaterThan(50);      // Essential fats

      // Verify calorie consistency
      const calculatedCalories = macros.carbs * 4 + macros.protein * 4 + macros.fat * 9;
      expect(Math.abs(calculatedCalories - calorieNeeds)).toBeLessThanOrEqual(1); // Allow for small rounding differences
    });

    it('should calculate complete nutrition profile for a sedentary female', () => {
      const weight = 60; // kg
      const height = 160; // cm
      const age = 35;
      const gender = 'FEMALE';
      const activityLevel = 'SEDENTARY';
      const goal = 'FAT_LOSS';
      const macroPreset = MACRO_PRESETS.lowCarb;

      const bmr = calculateBMR(weight, height, age, gender);
      const tdee = calculateTDEE(bmr, activityLevel);
      const calorieNeeds = calculateCalorieNeeds(tdee, goal);
      const macros = calculateMacros(calorieNeeds, macroPreset);

      // Should have lower overall calories due to sedentary lifestyle and fat loss goal
      expect(calorieNeeds).toBeLessThan(tdee);
      expect(tdee).toBeLessThan(2000);

      // Should have low carbs due to distribution choice
      expect(macros.carbs).toBeLessThan(macros.protein);

      const calculatedCalories = macros.carbs * 4 + macros.protein * 4 + macros.fat * 9;
      expect(Math.abs(calculatedCalories - calorieNeeds)).toBeLessThanOrEqual(1);
    });
  });
});