'use client';

import { useState, useEffect, useRef } from 'react';
import { offlineStorage, OfflineWorkout, OfflineExercise, OfflineSet } from '@/lib/sync/offline-storage';
import { syncEngine } from '@/lib/sync/sync-engine';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  tenantId: string;
  userId: string;
  initialWorkout?: OfflineWorkout;
  onWorkoutComplete?: (workout: OfflineWorkout) => void;
  onWorkoutSave?: (workout: OfflineWorkout) => void;
}

interface WorkoutTimer {
  isRunning: boolean;
  startTime: Date | null;
  duration: number;
  lastTick: number;
}

export default function OfflineWorkoutTracker({
  tenantId,
  userId,
  initialWorkout,
  onWorkoutComplete,
  onWorkoutSave,
}: Props) {
  const [workout, setWorkout] = useState<OfflineWorkout | null>(initialWorkout || null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [timer, setTimer] = useState<WorkoutTimer>({
    isRunning: false,
    startTime: null,
    duration: 0,
    lastTick: 0,
  });
  const [restTimer, setRestTimer] = useState({
    isActive: false,
    remaining: 0,
    total: 0,
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'offline'>('offline');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Auto-save every 30 seconds
    if (workout && workout.id) {
      autoSaveRef.current = setInterval(() => {
        saveWorkout(false);
      }, 30000);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [workout]);

  useEffect(() => {
    // Update sync status based on online status
    setSyncStatus(isOnline ? 'pending' : 'offline');
  }, [isOnline]);

  useEffect(() => {
    // Main workout timer
    if (timer.isRunning) {
      timerRef.current = setInterval(() => {
        setTimer(prev => ({
          ...prev,
          duration: prev.duration + 1,
          lastTick: Date.now(),
        }));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timer.isRunning]);

  useEffect(() => {
    // Rest timer
    if (restTimer.isActive && restTimer.remaining > 0) {
      restTimerRef.current = setInterval(() => {
        setRestTimer(prev => {
          const newRemaining = prev.remaining - 1;
          if (newRemaining <= 0) {
            // Rest period complete
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200]);
            }
            new Notification('Descanso finalizado!', {
              body: 'Hora de continuar o treino',
              icon: '/icons/fitness-icon.png',
            });
            return { isActive: false, remaining: 0, total: 0 };
          }
          return { ...prev, remaining: newRemaining };
        });
      }, 1000);
    } else {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    }

    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, [restTimer.isActive, restTimer.remaining]);

  const createNewWorkout = async (name: string, exercises: any[]) => {
    const newWorkout: OfflineWorkout = {
      id: uuidv4(),
      tenantId,
      name,
      description: '',
      exercises: exercises.map((exercise, index) => ({
        id: uuidv4(),
        tenantId,
        workoutId: '',
        exerciseId: exercise.id,
        name: exercise.name,
        sets: exercise.sets.map((set: any, setIndex: number) => ({
          id: uuidv4(),
          tenantId,
          workoutExerciseId: '',
          reps: set.targetReps,
          weight: set.targetWeight || 0,
          duration: set.targetDuration || 0,
          distance: set.targetDistance || 0,
          completed: false,
          order: setIndex,
          lastModified: new Date(),
          version: 1,
          syncStatus: 'pending' as const,
        })),
        restTime: exercise.restTime || 60,
        notes: '',
        order: index,
        lastModified: new Date(),
        version: 1,
        syncStatus: 'pending' as const,
      })),
      duration: 0,
      completed: false,
      startedAt: null,
      completedAt: null,
      type: 'strength',
      notes: '',
      lastModified: new Date(),
      version: 1,
      syncStatus: 'pending' as const,
    };

    // Update exercise references
    newWorkout.exercises.forEach(exercise => {
      exercise.workoutId = newWorkout.id;
      exercise.sets.forEach(set => {
        set.workoutExerciseId = exercise.id;
      });
    });

    setWorkout(newWorkout);
    await saveWorkout(false);
  };

  const startWorkout = async () => {
    if (!workout) return;

    const now = new Date();
    const updatedWorkout = {
      ...workout,
      startedAt: now,
      lastModified: now,
    };

    setWorkout(updatedWorkout);
    setTimer({
      isRunning: true,
      startTime: now,
      duration: 0,
      lastTick: Date.now(),
    });

    await saveWorkout(false);
  };

  const pauseWorkout = async () => {
    setTimer(prev => ({ ...prev, isRunning: false }));
    await saveWorkout(false);
  };

  const resumeWorkout = async () => {
    setTimer(prev => ({ ...prev, isRunning: true }));
  };

  const completeSet = async (exerciseIndex: number, setIndex: number, setData: Partial<OfflineSet>) => {
    if (!workout) return;

    const updatedWorkout = { ...workout };
    const set = updatedWorkout.exercises[exerciseIndex].sets[setIndex];

    Object.assign(set, {
      ...setData,
      completed: true,
      lastModified: new Date(),
    });

    setWorkout(updatedWorkout);

    // Start rest timer if configured
    const exercise = updatedWorkout.exercises[exerciseIndex];
    if (exercise.restTime && setIndex < exercise.sets.length - 1) {
      setRestTimer({
        isActive: true,
        remaining: exercise.restTime,
        total: exercise.restTime,
      });
    }

    // Auto-advance to next set or exercise
    if (setIndex < exercise.sets.length - 1) {
      setCurrentSetIndex(setIndex + 1);
    } else if (exerciseIndex < updatedWorkout.exercises.length - 1) {
      setCurrentExerciseIndex(exerciseIndex + 1);
      setCurrentSetIndex(0);
    }

    await saveWorkout(false);
  };

  const skipSet = async (exerciseIndex: number, setIndex: number) => {
    if (!workout) return;

    // Auto-advance without marking as completed
    const exercise = workout.exercises[exerciseIndex];
    if (setIndex < exercise.sets.length - 1) {
      setCurrentSetIndex(setIndex + 1);
    } else if (exerciseIndex < workout.exercises.length - 1) {
      setCurrentExerciseIndex(exerciseIndex + 1);
      setCurrentSetIndex(0);
    }
  };

  const addSet = async (exerciseIndex: number) => {
    if (!workout) return;

    const exercise = workout.exercises[exerciseIndex];
    const lastSet = exercise.sets[exercise.sets.length - 1];

    const newSet: OfflineSet = {
      id: uuidv4(),
      tenantId,
      workoutExerciseId: exercise.id,
      reps: lastSet.reps,
      weight: lastSet.weight,
      duration: lastSet.duration,
      distance: lastSet.distance,
      completed: false,
      order: exercise.sets.length,
      lastModified: new Date(),
      version: 1,
      syncStatus: 'pending' as const,
    };

    const updatedWorkout = { ...workout };
    updatedWorkout.exercises[exerciseIndex].sets.push(newSet);
    updatedWorkout.exercises[exerciseIndex].lastModified = new Date();

    setWorkout(updatedWorkout);
    await saveWorkout(false);
  };

  const addNotes = async (notes: string) => {
    if (!workout) return;

    const updatedWorkout = {
      ...workout,
      notes,
      lastModified: new Date(),
    };

    setWorkout(updatedWorkout);
    await saveWorkout(false);
  };

  const completeWorkout = async () => {
    if (!workout) return;

    const now = new Date();
    const updatedWorkout = {
      ...workout,
      completed: true,
      completedAt: now,
      duration: timer.duration,
      lastModified: now,
    };

    setWorkout(updatedWorkout);
    setTimer(prev => ({ ...prev, isRunning: false }));

    await saveWorkout(true);
    onWorkoutComplete?.(updatedWorkout);

    // Show completion notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Treino Concluído!', {
        body: `Parabéns! Você completou "${workout.name}" em ${formatDuration(timer.duration)}`,
        icon: '/icons/success-icon.png',
      });
    }
  };

  const saveWorkout = async (markCompleted: boolean = false) => {
    if (!workout) return;

    try {
      const workoutToSave = {
        ...workout,
        duration: timer.duration,
        lastModified: new Date(),
      };

      if (markCompleted) {
        workoutToSave.completed = true;
        workoutToSave.completedAt = new Date();
      }

      await offlineStorage.saveWorkout(workoutToSave);

      // Save exercises and sets
      for (const exercise of workoutToSave.exercises) {
        await offlineStorage.saveExercise(exercise);
        for (const set of exercise.sets) {
          await offlineStorage.saveSet(set);
        }
      }

      // Queue for sync
      await syncEngine.queueWorkoutChange('update', workout.id, workoutToSave);

      setSyncStatus(isOnline ? 'pending' : 'offline');
      onWorkoutSave?.(workoutToSave);

    } catch (error) {
      console.error('Failed to save workout:', error);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatRestTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!workout) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-600">Selecione um treino para começar</p>
      </div>
    );
  }

  const currentExercise = workout.exercises[currentExerciseIndex];
  const currentSet = currentExercise?.sets[currentSetIndex];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header with status */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{workout.name}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>⏱️ {formatDuration(timer.duration)}</span>
              <span className={`px-2 py-1 rounded text-xs ${
                syncStatus === 'synced' ? 'bg-green-100 text-green-800' :
                syncStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {syncStatus === 'synced' ? '✅ Sincronizado' :
                 syncStatus === 'pending' ? '⏳ Pendente' : '📱 Offline'}
              </span>
            </div>
          </div>

          <div className="flex space-x-2">
            {!workout.startedAt ? (
              <button
                onClick={startWorkout}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Iniciar Treino
              </button>
            ) : (
              <>
                {timer.isRunning ? (
                  <button
                    onClick={pauseWorkout}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  >
                    Pausar
                  </button>
                ) : (
                  <button
                    onClick={resumeWorkout}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Retomar
                  </button>
                )}

                <button
                  onClick={completeWorkout}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Finalizar
                </button>
              </>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentExerciseIndex + 1) / workout.exercises.length) * 100}%`
            }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Exercício {currentExerciseIndex + 1} de {workout.exercises.length}
        </p>
      </div>

      {/* Rest Timer */}
      {restTimer.isActive && (
        <div className="bg-orange-100 border-l-4 border-orange-500 p-4 rounded">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-orange-800">Tempo de Descanso</h3>
              <p className="text-orange-700">Descanse antes da próxima série</p>
            </div>
            <div className="text-3xl font-bold text-orange-800">
              {formatRestTime(restTimer.remaining)}
            </div>
          </div>
          <div className="mt-2 w-full bg-orange-200 rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
              style={{
                width: `${((restTimer.total - restTimer.remaining) / restTimer.total) * 100}%`
              }}
            />
          </div>
        </div>
      )}

      {/* Current Exercise */}
      {currentExercise && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{currentExercise.name}</h2>
              {currentExercise.restTime && (
                <p className="text-gray-600">Descanso: {formatRestTime(currentExercise.restTime)}</p>
              )}
            </div>
            <button
              onClick={() => addSet(currentExerciseIndex)}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              + Série
            </button>
          </div>

          {/* Sets */}
          <div className="space-y-3">
            {currentExercise.sets.map((set, index) => (
              <SetTracker
                key={set.id}
                set={set}
                isActive={index === currentSetIndex}
                isCompleted={set.completed}
                onComplete={(setData) => completeSet(currentExerciseIndex, index, setData)}
                onSkip={() => skipSet(currentExerciseIndex, index)}
              />
            ))}
          </div>

          {/* Exercise Navigation */}
          <div className="flex justify-between mt-6 pt-4 border-t">
            <button
              onClick={() => {
                if (currentExerciseIndex > 0) {
                  setCurrentExerciseIndex(currentExerciseIndex - 1);
                  setCurrentSetIndex(0);
                }
              }}
              disabled={currentExerciseIndex === 0}
              className="px-4 py-2 text-gray-600 disabled:opacity-50"
            >
              ← Exercício Anterior
            </button>

            <button
              onClick={() => {
                if (currentExerciseIndex < workout.exercises.length - 1) {
                  setCurrentExerciseIndex(currentExerciseIndex + 1);
                  setCurrentSetIndex(0);
                }
              }}
              disabled={currentExerciseIndex === workout.exercises.length - 1}
              className="px-4 py-2 text-gray-600 disabled:opacity-50"
            >
              Próximo Exercício →
            </button>
          </div>
        </div>
      )}

      {/* Workout Notes */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-2">Notas do Treino</h3>
        <textarea
          value={workout.notes || ''}
          onChange={(e) => addNotes(e.target.value)}
          placeholder="Adicione suas observações sobre o treino..."
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>
    </div>
  );
}

// Set Tracker Component
interface SetTrackerProps {
  set: OfflineSet;
  isActive: boolean;
  isCompleted: boolean;
  onComplete: (setData: Partial<OfflineSet>) => void;
  onSkip: () => void;
}

function SetTracker({ set, isActive, isCompleted, onComplete, onSkip }: SetTrackerProps) {
  const [reps, setReps] = useState(set.reps || 0);
  const [weight, setWeight] = useState(set.weight || 0);
  const [duration, setDuration] = useState(set.duration || 0);

  useEffect(() => {
    setReps(set.reps || 0);
    setWeight(set.weight || 0);
    setDuration(set.duration || 0);
  }, [set]);

  const handleComplete = () => {
    onComplete({ reps, weight, duration });
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${
      isActive ? 'border-blue-500 bg-blue-50' :
      isCompleted ? 'border-green-500 bg-green-50' :
      'border-gray-200 bg-gray-50'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            isCompleted ? 'bg-green-500 text-white' :
            isActive ? 'bg-blue-500 text-white' :
            'bg-gray-300 text-gray-600'
          }`}>
            {set.order + 1}
          </span>

          <div className="flex space-x-4">
            <div>
              <label className="text-xs text-gray-500">Repetições</label>
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(parseInt(e.target.value) || 0)}
                disabled={isCompleted}
                className="w-16 p-1 text-center border rounded disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">Peso (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                disabled={isCompleted}
                className="w-20 p-1 text-center border rounded disabled:bg-gray-100"
                step="0.5"
              />
            </div>

            {duration > 0 && (
              <div>
                <label className="text-xs text-gray-500">Duração (s)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                  disabled={isCompleted}
                  className="w-16 p-1 text-center border rounded disabled:bg-gray-100"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex space-x-2">
          {isActive && !isCompleted && (
            <>
              <button
                onClick={handleComplete}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                ✓ Completar
              </button>
              <button
                onClick={onSkip}
                className="px-3 py-1 text-sm bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Pular
              </button>
            </>
          )}
          {isCompleted && (
            <span className="text-green-600 text-sm font-medium">✓ Concluído</span>
          )}
        </div>
      </div>
    </div>
  );
}