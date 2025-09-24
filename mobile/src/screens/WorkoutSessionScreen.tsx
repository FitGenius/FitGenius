import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Vibration,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../contexts/ThemeContext';
import { healthService } from '../services/HealthService';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  rest: number;
  instructions?: string;
  muscleGroups: string[];
}

interface ExerciseProgress {
  exerciseId: string;
  completedSets: number;
  weights: number[];
  reps: number[];
  notes: string;
}

interface WorkoutSession {
  startTime: Date;
  currentExerciseIndex: number;
  exerciseProgress: ExerciseProgress[];
  totalRestTime: number;
  isResting: boolean;
  restStartTime?: Date;
  sessionId?: string;
}

export const WorkoutSessionScreen = ({ navigation, route }: any) => {
  const { workout } = route.params;
  const { theme } = useTheme();
  const [session, setSession] = useState<WorkoutSession>({
    startTime: new Date(),
    currentExerciseIndex: 0,
    exerciseProgress: workout.exercises.map((ex: Exercise) => ({
      exerciseId: ex.id,
      completedSets: 0,
      weights: Array(ex.sets).fill(ex.weight || 0),
      reps: Array(ex.sets).fill(ex.reps),
      notes: ''
    })),
    totalRestTime: 0,
    isResting: false,
  });

  const [restTimer, setRestTimer] = useState(0);
  const [workoutTimer, setWorkoutTimer] = useState(0);
  const [showRestModal, setShowRestModal] = useState(false);
  const restIntervalRef = useRef<NodeJS.Timeout>();
  const workoutIntervalRef = useRef<NodeJS.Timeout>();

  const currentExercise = workout.exercises[session.currentExerciseIndex];
  const currentProgress = session.exerciseProgress[session.currentExerciseIndex];

  useEffect(() => {
    // Start workout session
    initializeWorkoutSession();

    // Cleanup on unmount
    return () => {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
      if (workoutIntervalRef.current) clearInterval(workoutIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    // Start workout timer
    workoutIntervalRef.current = setInterval(() => {
      setWorkoutTimer(prev => prev + 1);
    }, 1000);

    return () => {
      if (workoutIntervalRef.current) clearInterval(workoutIntervalRef.current);
    };
  }, []);

  const initializeWorkoutSession = async () => {
    try {
      const sessionData = await healthService.startWorkout(workout.type);
      setSession(prev => ({ ...prev, sessionId: sessionData.sessionId }));
    } catch (error) {
      console.error('Error starting workout session:', error);
    }
  };

  const startRestTimer = (restTime: number) => {
    setRestTimer(restTime);
    setSession(prev => ({ ...prev, isResting: true, restStartTime: new Date() }));
    setShowRestModal(true);

    restIntervalRef.current = setInterval(() => {
      setRestTimer(prev => {
        if (prev <= 1) {
          // Rest finished
          Vibration.vibrate([0, 500, 100, 500]);
          endRest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const endRest = () => {
    if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
    }

    setSession(prev => {
      const restDuration = prev.restStartTime
        ? Math.floor((new Date().getTime() - prev.restStartTime.getTime()) / 1000)
        : 0;

      return {
        ...prev,
        isResting: false,
        totalRestTime: prev.totalRestTime + restDuration,
        restStartTime: undefined
      };
    });

    setShowRestModal(false);
    setRestTimer(0);
  };

  const completeSet = () => {
    const newCompletedSets = currentProgress.completedSets + 1;

    setSession(prev => {
      const newProgress = [...prev.exerciseProgress];
      newProgress[prev.currentExerciseIndex] = {
        ...currentProgress,
        completedSets: newCompletedSets
      };

      return {
        ...prev,
        exerciseProgress: newProgress
      };
    });

    // Check if exercise is completed
    if (newCompletedSets >= currentExercise.sets) {
      completeExercise();
    } else {
      // Start rest timer
      startRestTimer(currentExercise.rest);
    }
  };

  const completeExercise = () => {
    if (session.currentExerciseIndex < workout.exercises.length - 1) {
      // Move to next exercise
      setSession(prev => ({
        ...prev,
        currentExerciseIndex: prev.currentExerciseIndex + 1
      }));
    } else {
      // Workout completed
      completeWorkout();
    }
  };

  const completeWorkout = async () => {
    try {
      if (session.sessionId) {
        const workoutData = {
          type: workout.type,
          startTime: session.startTime,
          exercises: workout.exercises.map((ex: Exercise, index: number) => ({
            name: ex.name,
            sets: session.exerciseProgress[index].completedSets,
            reps: session.exerciseProgress[index].reps.reduce((a, b) => a + b, 0),
            weight: session.exerciseProgress[index].weights[0] // simplified
          }))
        };

        const summary = await healthService.endWorkout(session.sessionId, workoutData);

        Alert.alert(
          '🎉 Treino Concluído!',
          `Duração: ${Math.floor(workoutTimer / 60)} min\nCalorias: ${summary.estimatedCalories} kcal`,
          [
            {
              text: 'Ver Resumo',
              onPress: () => navigation.navigate('Progress', { workoutSummary: summary })
            },
            {
              text: 'Finalizar',
              onPress: () => navigation.navigate('Dashboard')
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error completing workout:', error);
      navigation.navigate('Dashboard');
    }
  };

  const skipRestTimer = () => {
    endRest();
  };

  const addRestTime = (seconds: number) => {
    setRestTimer(prev => prev + seconds);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const updateWeight = (setIndex: number, weight: number) => {
    setSession(prev => {
      const newProgress = [...prev.exerciseProgress];
      const currentExerciseProgress = { ...newProgress[prev.currentExerciseIndex] };
      currentExerciseProgress.weights[setIndex] = weight;
      newProgress[prev.currentExerciseIndex] = currentExerciseProgress;

      return {
        ...prev,
        exerciseProgress: newProgress
      };
    });
  };

  const updateReps = (setIndex: number, reps: number) => {
    setSession(prev => {
      const newProgress = [...prev.exerciseProgress];
      const currentExerciseProgress = { ...newProgress[prev.currentExerciseIndex] };
      currentExerciseProgress.reps[setIndex] = reps;
      newProgress[prev.currentExerciseIndex] = currentExerciseProgress;

      return {
        ...prev,
        exerciseProgress: newProgress
      };
    });
  };

  const ExitWorkoutAlert = () => {
    Alert.alert(
      'Sair do Treino',
      'Tem certeza que deseja sair? Seu progresso será perdido.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', onPress: () => navigation.navigate('Dashboard'), style: 'destructive' }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primary + 'DD']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.exitButton}
            onPress={ExitWorkoutAlert}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.workoutName}>{workout.name}</Text>
            <Text style={styles.workoutTimer}>{formatTime(workoutTimer)}</Text>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.exerciseCounter}>
              {session.currentExerciseIndex + 1}/{workout.exercises.length}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Current Exercise */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.exerciseCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.exerciseHeader}>
            <Text style={[styles.exerciseName, { color: theme.colors.text }]}>
              {currentExercise.name}
            </Text>
            <View style={styles.muscleGroups}>
              {currentExercise.muscleGroups.map((muscle, index) => (
                <Text key={index} style={[styles.muscleGroup, { color: theme.colors.primary }]}>
                  {muscle}
                </Text>
              ))}
            </View>
          </View>

          {currentExercise.instructions && (
            <View style={styles.instructions}>
              <Text style={[styles.instructionsTitle, { color: theme.colors.text }]}>
                Instruções:
              </Text>
              <Text style={[styles.instructionsText, { color: theme.colors.textSecondary }]}>
                {currentExercise.instructions}
              </Text>
            </View>
          )}
        </View>

        {/* Sets Progress */}
        <View style={[styles.setsContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.setsTitle, { color: theme.colors.text }]}>
            Séries ({currentProgress.completedSets}/{currentExercise.sets})
          </Text>

          {Array.from({ length: currentExercise.sets }, (_, index) => {
            const isCompleted = index < currentProgress.completedSets;
            const isCurrent = index === currentProgress.completedSets;

            return (
              <View
                key={index}
                style={[
                  styles.setRow,
                  {
                    backgroundColor: isCompleted
                      ? theme.colors.primary + '10'
                      : isCurrent
                        ? theme.colors.primary + '05'
                        : 'transparent',
                    borderColor: isCurrent ? theme.colors.primary : theme.colors.border,
                  }
                ]}
              >
                <Text style={[styles.setNumber, { color: theme.colors.text }]}>
                  {index + 1}
                </Text>

                {currentExercise.weight && (
                  <View style={styles.setInput}>
                    <Text style={[styles.setLabel, { color: theme.colors.textSecondary }]}>
                      Peso (kg)
                    </Text>
                    <Text style={[styles.setValue, { color: theme.colors.text }]}>
                      {currentProgress.weights[index]}
                    </Text>
                  </View>
                )}

                <View style={styles.setInput}>
                  <Text style={[styles.setLabel, { color: theme.colors.textSecondary }]}>
                    Reps
                  </Text>
                  <Text style={[styles.setValue, { color: theme.colors.text }]}>
                    {currentProgress.reps[index]}
                  </Text>
                </View>

                <View style={styles.setStatus}>
                  {isCompleted ? (
                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                  ) : isCurrent ? (
                    <TouchableOpacity
                      style={[styles.completeButton, { backgroundColor: theme.colors.primary }]}
                      onPress={completeSet}
                    >
                      <Ionicons name="checkmark" size={16} color="white" />
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.pendingIcon, { borderColor: theme.colors.border }]} />
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Exercise Navigation */}
        <View style={styles.navigationButtons}>
          {session.currentExerciseIndex > 0 && (
            <TouchableOpacity
              style={[styles.navButton, styles.prevButton, { backgroundColor: theme.colors.surface }]}
              onPress={() => setSession(prev => ({
                ...prev,
                currentExerciseIndex: prev.currentExerciseIndex - 1
              }))}
            >
              <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
              <Text style={[styles.navButtonText, { color: theme.colors.text }]}>
                Anterior
              </Text>
            </TouchableOpacity>
          )}

          {session.currentExerciseIndex < workout.exercises.length - 1 &&
           currentProgress.completedSets >= currentExercise.sets && (
            <TouchableOpacity
              style={[styles.navButton, styles.nextButton, { backgroundColor: theme.colors.primary }]}
              onPress={completeExercise}
            >
              <Text style={styles.nextButtonText}>Próximo</Text>
              <Ionicons name="chevron-forward" size={20} color="white" />
            </TouchableOpacity>
          )}

          {session.currentExerciseIndex === workout.exercises.length - 1 &&
           currentProgress.completedSets >= currentExercise.sets && (
            <TouchableOpacity
              style={[styles.navButton, styles.finishButton, { backgroundColor: '#4CAF50' }]}
              onPress={completeWorkout}
            >
              <Ionicons name="trophy" size={20} color="white" />
              <Text style={styles.finishButtonText}>Finalizar Treino</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Rest Timer Modal */}
      <Modal
        visible={showRestModal}
        transparent
        animationType="slide"
      >
        <View style={styles.restModalOverlay}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primary + 'DD']}
            style={styles.restModal}
          >
            <Text style={styles.restTitle}>Descanso</Text>
            <Text style={styles.restTimer}>{formatTime(restTimer)}</Text>

            <View style={styles.restButtons}>
              <TouchableOpacity
                style={styles.restActionButton}
                onPress={() => addRestTime(30)}
              >
                <Ionicons name="add" size={16} color="white" />
                <Text style={styles.restActionText}>+30s</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.restActionButton, styles.skipButton]}
                onPress={skipRestTimer}
              >
                <Ionicons name="play-skip-forward" size={16} color="white" />
                <Text style={styles.restActionText}>Pular</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  exitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  workoutName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  workoutTimer: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerRight: {
    alignItems: 'center',
  },
  exerciseCounter: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  exerciseCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  exerciseHeader: {
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  muscleGroups: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  muscleGroup: {
    fontSize: 12,
    fontWeight: '500',
  },
  instructions: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  setsContainer: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  setsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  setNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 30,
  },
  setInput: {
    flex: 1,
    marginHorizontal: 8,
  },
  setLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  setValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  setStatus: {
    width: 40,
    alignItems: 'center',
  },
  completeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  prevButton: {},
  nextButton: {},
  finishButton: {},
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  finishButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  restModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restModal: {
    width: 300,
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  restTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  restTimer: {
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  restButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  restActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    gap: 8,
  },
  skipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  restActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});