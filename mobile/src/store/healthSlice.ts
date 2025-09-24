import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface HealthMetrics {
  steps: number;
  caloriesBurned: number;
  activeMinutes: number;
  heartRate?: number;
  weight?: number;
  bodyFat?: number;
  muscleMass?: number;
  sleepHours?: number;
  timestamp: Date;
}

interface HealthGoals {
  dailySteps: number;
  weeklyActiveMinutes: number;
  targetWeight?: number;
  targetBodyFat?: number;
}

interface HealthState {
  todayMetrics: HealthMetrics;
  goals: HealthGoals;
  weeklyData: HealthMetrics[];
  isHealthKitAvailable: boolean;
  isGoogleFitAvailable: boolean;
  syncEnabled: boolean;
}

const initialState: HealthState = {
  todayMetrics: {
    steps: 0,
    caloriesBurned: 0,
    activeMinutes: 0,
    timestamp: new Date(),
  },
  goals: {
    dailySteps: 10000,
    weeklyActiveMinutes: 150,
  },
  weeklyData: [],
  isHealthKitAvailable: false,
  isGoogleFitAvailable: false,
  syncEnabled: false,
};

export const healthSlice = createSlice({
  name: 'health',
  initialState,
  reducers: {
    updateTodayMetrics: (state, action: PayloadAction<Partial<HealthMetrics>>) => {
      state.todayMetrics = {
        ...state.todayMetrics,
        ...action.payload,
        timestamp: new Date(),
      };
    },
    setHealthGoals: (state, action: PayloadAction<HealthGoals>) => {
      state.goals = action.payload;
    },
    addWeeklyData: (state, action: PayloadAction<HealthMetrics>) => {
      state.weeklyData.push(action.payload);
      // Keep only last 7 days
      if (state.weeklyData.length > 7) {
        state.weeklyData = state.weeklyData.slice(-7);
      }
    },
    setHealthKitAvailability: (state, action: PayloadAction<boolean>) => {
      state.isHealthKitAvailable = action.payload;
    },
    setGoogleFitAvailability: (state, action: PayloadAction<boolean>) => {
      state.isGoogleFitAvailable = action.payload;
    },
    setSyncEnabled: (state, action: PayloadAction<boolean>) => {
      state.syncEnabled = action.payload;
    },
    resetDailyMetrics: (state) => {
      // Add today's data to weekly before resetting
      state.weeklyData.push(state.todayMetrics);
      state.todayMetrics = {
        steps: 0,
        caloriesBurned: 0,
        activeMinutes: 0,
        timestamp: new Date(),
      };
    },
  },
});