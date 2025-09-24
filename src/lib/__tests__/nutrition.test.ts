import {
  calculateBMR,
  calculateTDEE,
  calculateMacros,
  calculateCaloriesFromMacros,
  ActivityLevel,
  MacroDistribution
} from '../nutrition';

describe('Nutrition Calculations', () => {
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

    it('should handle edge cases', () => {
      expect(() => calculateBMR(0, 180, 30, 'MALE')).toThrow();
      expect(() => calculateBMR(80, 0, 30, 'MALE')).toThrow();
      expect(() => calculateBMR(80, 180, 0, 'MALE')).toThrow();
    });
  });

  describe('calculateTDEE', () => {
    const baseBMR = 1800;

    it('should calculate TDEE for sedentary activity level', () => {
      const result = calculateTDEE(baseBMR, ActivityLevel.SEDENTARY);
      expect(result).toBe(Math.round(baseBMR * 1.2)); // 2160
    });

    it('should calculate TDEE for light activity level', () => {
      const result = calculateTDEE(baseBMR, ActivityLevel.LIGHT);
      expect(result).toBe(Math.round(baseBMR * 1.375)); // 2475
    });

    it('should calculate TDEE for moderate activity level', () => {
      const result = calculateTDEE(baseBMR, ActivityLevel.MODERATE);
      expect(result).toBe(Math.round(baseBMR * 1.55)); // 2790
    });

    it('should calculate TDEE for active activity level', () => {
      const result = calculateTDEE(baseBMR, ActivityLevel.ACTIVE);
      expect(result).toBe(Math.round(baseBMR * 1.725)); // 3105
    });

    it('should calculate TDEE for very active activity level', () => {
      const result = calculateTDEE(baseBMR, ActivityLevel.VERY_ACTIVE);
      expect(result).toBe(Math.round(baseBMR * 1.9)); // 3420
    });

    it('should handle invalid BMR', () => {
      expect(() => calculateTDEE(0, ActivityLevel.SEDENTARY)).toThrow();
      expect(() => calculateTDEE(-100, ActivityLevel.MODERATE)).toThrow();
    });
  });

  describe('calculateMacros', () => {
    const totalCalories = 2000;

    it('should calculate balanced macro distribution', () => {
      const result = calculateMacros(totalCalories, MacroDistribution.BALANCED);

      expect(result.carbs).toBe(Math.round((totalCalories * 0.45) / 4)); // 225g
      expect(result.protein).toBe(Math.round((totalCalories * 0.25) / 4)); // 125g
      expect(result.fat).toBe(Math.round((totalCalories * 0.30) / 9)); // 67g

      // Verify total calories match (within rounding tolerance)
      const calculatedCalories = calculateCaloriesFromMacros(result);
      expect(Math.abs(calculatedCalories - totalCalories)).toBeLessThanOrEqual(10);
    });

    it('should calculate low carb macro distribution', () => {
      const result = calculateMacros(totalCalories, MacroDistribution.LOW_CARB);

      expect(result.carbs).toBe(Math.round((totalCalories * 0.20) / 4)); // 100g
      expect(result.protein).toBe(Math.round((totalCalories * 0.30) / 4)); // 150g
      expect(result.fat).toBe(Math.round((totalCalories * 0.50) / 9)); // 111g

      const calculatedCalories = calculateCaloriesFromMacros(result);
      expect(Math.abs(calculatedCalories - totalCalories)).toBeLessThanOrEqual(10);
    });

    it('should calculate high protein macro distribution', () => {
      const result = calculateMacros(totalCalories, MacroDistribution.HIGH_PROTEIN);

      expect(result.carbs).toBe(Math.round((totalCalories * 0.35) / 4)); // 175g
      expect(result.protein).toBe(Math.round((totalCalories * 0.40) / 4)); // 200g
      expect(result.fat).toBe(Math.round((totalCalories * 0.25) / 9)); // 56g

      const calculatedCalories = calculateCaloriesFromMacros(result);
      expect(Math.abs(calculatedCalories - totalCalories)).toBeLessThanOrEqual(10);
    });

    it('should handle invalid calories', () => {
      expect(() => calculateMacros(0, MacroDistribution.BALANCED)).toThrow();
      expect(() => calculateMacros(-500, MacroDistribution.BALANCED)).toThrow();
    });
  });

  describe('calculateCaloriesFromMacros', () => {
    it('should calculate total calories from macros correctly', () => {
      const macros = {
        carbs: 200,    // 200 * 4 = 800 calories
        protein: 150,  // 150 * 4 = 600 calories
        fat: 67        // 67 * 9 = 603 calories
      };

      const result = calculateCaloriesFromMacros(macros);
      expect(result).toBe(800 + 600 + 603); // 2003 calories
    });

    it('should handle zero macros', () => {
      const macros = { carbs: 0, protein: 0, fat: 0 };
      const result = calculateCaloriesFromMacros(macros);
      expect(result).toBe(0);
    });

    it('should handle partial macros', () => {
      const macros = { carbs: 100, protein: 0, fat: 50 };
      const result = calculateCaloriesFromMacros(macros);
      expect(result).toBe(100 * 4 + 0 * 4 + 50 * 9); // 850
    });
  });

  describe('Integration Tests', () => {
    it('should calculate complete nutrition profile for a male athlete', () => {
      const weight = 85; // kg
      const height = 185; // cm
      const age = 25;
      const gender = 'MALE';
      const activityLevel = ActivityLevel.ACTIVE;
      const macroDistribution = MacroDistribution.HIGH_PROTEIN;

      // Calculate BMR
      const bmr = calculateBMR(weight, height, age, gender);
      expect(bmr).toBeGreaterThan(1700);
      expect(bmr).toBeLessThan(2000);

      // Calculate TDEE
      const tdee = calculateTDEE(bmr, activityLevel);
      expect(tdee).toBeGreaterThan(2500);
      expect(tdee).toBeLessThan(3500);

      // Calculate macros
      const macros = calculateMacros(tdee, macroDistribution);
      expect(macros.protein).toBeGreaterThan(200); // High protein for athlete
      expect(macros.carbs).toBeGreaterThan(150);   // Sufficient carbs for energy
      expect(macros.fat).toBeGreaterThan(50);      // Essential fats

      // Verify calorie consistency
      const calculatedCalories = calculateCaloriesFromMacros(macros);
      expect(Math.abs(calculatedCalories - tdee)).toBeLessThanOrEqual(20);
    });

    it('should calculate complete nutrition profile for a sedentary female', () => {
      const weight = 60; // kg
      const height = 160; // cm
      const age = 35;
      const gender = 'FEMALE';
      const activityLevel = ActivityLevel.SEDENTARY;
      const macroDistribution = MacroDistribution.LOW_CARB;

      const bmr = calculateBMR(weight, height, age, gender);
      const tdee = calculateTDEE(bmr, activityLevel);
      const macros = calculateMacros(tdee, macroDistribution);

      // Should have lower overall calories due to sedentary lifestyle
      expect(tdee).toBeLessThan(2000);

      // Should have low carbs due to distribution choice
      expect(macros.carbs).toBeLessThan(macros.protein);
      expect(macros.fat).toBeGreaterThan(macros.carbs);

      const calculatedCalories = calculateCaloriesFromMacros(macros);
      expect(Math.abs(calculatedCalories - tdee)).toBeLessThanOrEqual(20);
    });
  });
});