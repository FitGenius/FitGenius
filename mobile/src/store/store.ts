import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from './authSlice';
import { workoutSlice } from './workoutSlice';
import { nutritionSlice } from './nutritionSlice';
import { healthSlice } from './healthSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    workout: workoutSlice.reducer,
    nutrition: nutritionSlice.reducer,
    health: healthSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;