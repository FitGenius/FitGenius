import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  unit: string;
}

interface Meal {
  id: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: Food[];
  timestamp: Date;
}

interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number; // in ml
}

interface NutritionState {
  todaysMeals: Meal[];
  goals: NutritionGoals;
  waterIntake: number; // in ml
  nutritionHistory: { date: string; meals: Meal[]; waterIntake: number }[];
}

const initialState: NutritionState = {
  todaysMeals: [],
  goals: {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 70,
    water: 2000,
  },
  waterIntake: 0,
  nutritionHistory: [],
};

export const nutritionSlice = createSlice({
  name: 'nutrition',
  initialState,
  reducers: {
    addMeal: (state, action: PayloadAction<Meal>) => {
      state.todaysMeals.push(action.payload);
    },
    updateMeal: (state, action: PayloadAction<{ id: string; meal: Meal }>) => {
      const index = state.todaysMeals.findIndex(meal => meal.id === action.payload.id);
      if (index !== -1) {
        state.todaysMeals[index] = action.payload.meal;
      }
    },
    deleteMeal: (state, action: PayloadAction<string>) => {
      state.todaysMeals = state.todaysMeals.filter(meal => meal.id !== action.payload);
    },
    addWater: (state, action: PayloadAction<number>) => {
      state.waterIntake += action.payload;
    },
    setGoals: (state, action: PayloadAction<NutritionGoals>) => {
      state.goals = action.payload;
    },
    resetDay: (state) => {
      // Save today's data to history
      const today = new Date().toISOString().split('T')[0];
      state.nutritionHistory.push({
        date: today,
        meals: state.todaysMeals,
        waterIntake: state.waterIntake,
      });
      // Reset for new day
      state.todaysMeals = [];
      state.waterIntake = 0;
    },
  },
});