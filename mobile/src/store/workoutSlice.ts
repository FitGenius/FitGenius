import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  duration?: number;
  completed: boolean;
}

interface Workout {
  id: string;
  name: string;
  exercises: Exercise[];
  startTime?: Date;
  endTime?: Date;
  totalDuration?: number;
}

interface WorkoutState {
  currentWorkout: Workout | null;
  workoutHistory: Workout[];
  isWorkoutActive: boolean;
  currentExerciseIndex: number;
}

const initialState: WorkoutState = {
  currentWorkout: null,
  workoutHistory: [],
  isWorkoutActive: false,
  currentExerciseIndex: 0,
};

export const workoutSlice = createSlice({
  name: 'workout',
  initialState,
  reducers: {
    startWorkout: (state, action: PayloadAction<Workout>) => {
      state.currentWorkout = {
        ...action.payload,
        startTime: new Date(),
      };
      state.isWorkoutActive = true;
      state.currentExerciseIndex = 0;
    },
    endWorkout: (state) => {
      if (state.currentWorkout) {
        const completedWorkout = {
          ...state.currentWorkout,
          endTime: new Date(),
          totalDuration: state.currentWorkout.startTime
            ? Date.now() - state.currentWorkout.startTime.getTime()
            : 0,
        };
        state.workoutHistory.push(completedWorkout);
      }
      state.currentWorkout = null;
      state.isWorkoutActive = false;
      state.currentExerciseIndex = 0;
    },
    updateExercise: (state, action: PayloadAction<{ index: number; exercise: Exercise }>) => {
      if (state.currentWorkout) {
        state.currentWorkout.exercises[action.payload.index] = action.payload.exercise;
      }
    },
    nextExercise: (state) => {
      if (state.currentWorkout && state.currentExerciseIndex < state.currentWorkout.exercises.length - 1) {
        state.currentExerciseIndex += 1;
      }
    },
    previousExercise: (state) => {
      if (state.currentExerciseIndex > 0) {
        state.currentExerciseIndex -= 1;
      }
    },
  },
});