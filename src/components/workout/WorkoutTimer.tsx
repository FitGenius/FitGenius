'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, SkipForward, Volume2, VolumeX, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface WorkoutTimerProps {
  exercises?: Array<{
    name: string;
    sets: number;
    reps?: number;
    duration?: number; // segundos
    rest?: number; // segundos entre séries
  }>;
  onComplete?: () => void;
  onExerciseComplete?: (exerciseName: string) => void;
}

export function WorkoutTimer({ exercises = [], onComplete, onExerciseComplete }: WorkoutTimerProps) {
  // Estados principais
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restTime, setRestTime] = useState(0);

  // Configurações
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [defaultRestTime, setDefaultRestTime] = useState(60); // segundos
  const [countdown, setCountdown] = useState(3); // contagem regressiva inicial

  // Referências
  const intervalRef = useRef<NodeJS.Timeout>();
  const audioRef = useRef<HTMLAudioElement>();

  // Timer simples (sem exercícios)
  const [simpleTimerMode, setSimpleTimerMode] = useState(exercises.length === 0);
  const [simpleTimerDuration, setSimpleTimerDuration] = useState(0);

  // Cronômetro
  const [stopwatchMode, setStopwatchMode] = useState(false);
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);

  // Efeitos sonoros
  const playSound = useCallback((type: 'start' | 'end' | 'rest' | 'countdown') => {
    if (!soundEnabled) return;

    // Usar Web Audio API para gerar sons
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (type) {
      case 'start':
        oscillator.frequency.value = 523.25; // C5
        gainNode.gain.value = 0.3;
        break;
      case 'end':
        oscillator.frequency.value = 784; // G5
        gainNode.gain.value = 0.3;
        break;
      case 'rest':
        oscillator.frequency.value = 440; // A4
        gainNode.gain.value = 0.2;
        break;
      case 'countdown':
        oscillator.frequency.value = 659.25; // E5
        gainNode.gain.value = 0.4;
        break;
    }

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  }, [soundEnabled]);

  // Iniciar treino com exercícios
  const startWorkout = useCallback(() => {
    if (countdown > 0) {
      let count = countdown;
      const countInterval = setInterval(() => {
        count--;
        setCountdown(count);
        playSound('countdown');

        if (count === 0) {
          clearInterval(countInterval);
          setIsRunning(true);
          setIsPaused(false);
          setCountdown(3);
          playSound('start');
        }
      }, 1000);
    } else {
      setIsRunning(true);
      setIsPaused(false);
      playSound('start');
    }
  }, [countdown, playSound]);

  // Pausar/Retomar
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // Resetar timer
  const resetTimer = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentTime(0);
    setTotalTime(0);
    setCurrentExerciseIndex(0);
    setCurrentSet(1);
    setIsResting(false);
    setRestTime(0);
    setStopwatchTime(0);
    setLaps([]);
  };

  // Pular exercício
  const skipExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSet(1);
      setIsResting(false);
      setCurrentTime(0);
    } else {
      completeWorkout();
    }
  };

  // Completar treino
  const completeWorkout = () => {
    setIsRunning(false);
    playSound('end');
    if (onComplete) onComplete();
    resetTimer();
  };

  // Timer do exercício atual
  useEffect(() => {
    if (isRunning && !isPaused && exercises.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => prev + 1);
        setTotalTime(prev => prev + 1);

        const currentExercise = exercises[currentExerciseIndex];

        if (isResting) {
          setRestTime(prev => {
            if (prev <= 1) {
              setIsResting(false);
              playSound('start');
              return 0;
            }
            return prev - 1;
          });
        } else if (currentExercise.duration) {
          if (currentTime >= currentExercise.duration) {
            if (currentSet < currentExercise.sets) {
              setCurrentSet(prev => prev + 1);
              setIsResting(true);
              setRestTime(currentExercise.rest || defaultRestTime);
              setCurrentTime(0);
              playSound('rest');
            } else {
              if (onExerciseComplete) onExerciseComplete(currentExercise.name);
              skipExercise();
            }
          }
        }
      }, 1000);
    } else if (stopwatchMode && isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setStopwatchTime(prev => prev + 10); // Atualizar a cada 10ms para precisão
      }, 10);
    } else if (simpleTimerMode && isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setSimpleTimerDuration(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            playSound('end');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isPaused, currentTime, currentExerciseIndex, currentSet, isResting, exercises, defaultRestTime, stopwatchMode, simpleTimerMode, playSound, onExerciseComplete]);

  // Formatar tempo
  const formatTime = (seconds: number, showMillis = false) => {
    if (showMillis) {
      const mins = Math.floor(seconds / 60000);
      const secs = Math.floor((seconds % 60000) / 1000);
      const millis = Math.floor((seconds % 1000) / 10);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
    }
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Adicionar volta (cronômetro)
  const addLap = () => {
    setLaps(prev => [...prev, stopwatchTime]);
  };

  // Componente de display principal
  const TimerDisplay = () => {
    if (stopwatchMode) {
      return (
        <div className="text-6xl font-mono font-bold text-gold tabular-nums">
          {formatTime(stopwatchTime, true)}
        </div>
      );
    }

    if (simpleTimerMode) {
      return (
        <div className="text-6xl font-mono font-bold text-gold tabular-nums">
          {formatTime(simpleTimerDuration)}
        </div>
      );
    }

    if (isResting) {
      return (
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-2">Descanse</div>
          <div className="text-6xl font-mono font-bold text-blue-500 tabular-nums">
            {formatTime(restTime)}
          </div>
        </div>
      );
    }

    const currentExercise = exercises[currentExerciseIndex];
    return (
      <div className="text-center">
        <div className="text-sm text-muted-foreground mb-2">
          {currentExercise?.name || 'Exercício'}
        </div>
        <div className="text-6xl font-mono font-bold text-gold tabular-nums">
          {formatTime(currentExercise?.duration ? currentExercise.duration - currentTime : currentTime)}
        </div>
        <div className="text-lg text-muted-foreground mt-2">
          Série {currentSet} de {currentExercise?.sets || 1}
        </div>
      </div>
    );
  };

  // Modo de seleção
  if (!isRunning && exercises.length === 0 && !simpleTimerMode && !stopwatchMode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-gold" />
            Timer de Treino
          </CardTitle>
          <CardDescription>
            Escolha o modo de timer para seu treino
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => setStopwatchMode(true)}
              variant="outline"
              className="h-24 flex flex-col gap-2"
            >
              <Timer className="w-8 h-8" />
              <span>Cronômetro</span>
            </Button>
            <Button
              onClick={() => {
                setSimpleTimerMode(true);
                setSimpleTimerDuration(60);
              }}
              variant="outline"
              className="h-24 flex flex-col gap-2"
            >
              <RotateCcw className="w-8 h-8" />
              <span>Timer Simples</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-gold" />
            {stopwatchMode ? 'Cronômetro' : simpleTimerMode ? 'Timer' : 'Timer de Treino'}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-muted-foreground"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Display principal */}
        <div className="text-center py-8">
          <AnimatePresence mode="wait">
            {countdown > 0 && countdown < 4 && !isRunning && (
              <motion.div
                key="countdown"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="text-8xl font-bold text-gold"
              >
                {countdown}
              </motion.div>
            )}
          </AnimatePresence>

          {(countdown === 3 || isRunning) && <TimerDisplay />}
        </div>

        {/* Configuração de timer simples */}
        {simpleTimerMode && !isRunning && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Duração (minutos)</label>
              <Slider
                value={[simpleTimerDuration / 60]}
                onValueChange={(value) => setSimpleTimerDuration(value[0] * 60)}
                max={60}
                min={1}
                step={1}
                className="mt-2"
              />
              <div className="text-center mt-2 text-muted-foreground">
                {Math.floor(simpleTimerDuration / 60)} minutos
              </div>
            </div>
          </div>
        )}

        {/* Lista de voltas (cronômetro) */}
        {stopwatchMode && laps.length > 0 && (
          <div className="max-h-32 overflow-y-auto space-y-1">
            {laps.map((lap, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-muted-foreground">Volta {index + 1}</span>
                <span className="font-mono">{formatTime(lap, true)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Progresso dos exercícios */}
        {exercises.length > 0 && !stopwatchMode && !simpleTimerMode && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Exercício {currentExerciseIndex + 1} de {exercises.length}
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-gold h-2 rounded-full transition-all"
                style={{
                  width: `${((currentExerciseIndex + 1) / exercises.length) * 100}%`
                }}
              />
            </div>
            <div className="text-xs text-muted-foreground text-right">
              Tempo total: {formatTime(totalTime)}
            </div>
          </div>
        )}

        {/* Controles */}
        <div className="flex justify-center gap-4">
          {!isRunning ? (
            <Button
              onClick={() => {
                if (stopwatchMode) {
                  setIsRunning(true);
                  setIsPaused(false);
                } else if (simpleTimerMode) {
                  startWorkout();
                } else {
                  startWorkout();
                }
              }}
              size="lg"
              className="bg-gold hover:bg-gold/90 text-background"
            >
              <Play className="w-5 h-5 mr-2" />
              Iniciar
            </Button>
          ) : (
            <>
              <Button
                onClick={togglePause}
                size="lg"
                variant="outline"
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </Button>

              {stopwatchMode && (
                <Button
                  onClick={addLap}
                  size="lg"
                  variant="outline"
                  disabled={isPaused}
                >
                  Volta
                </Button>
              )}

              {exercises.length > 0 && !stopwatchMode && !simpleTimerMode && (
                <Button
                  onClick={skipExercise}
                  size="lg"
                  variant="outline"
                >
                  <SkipForward className="w-5 h-5" />
                </Button>
              )}

              <Button
                onClick={resetTimer}
                size="lg"
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-50"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>

        {/* Voltar para seleção de modo */}
        {(stopwatchMode || simpleTimerMode) && !isRunning && (
          <Button
            onClick={() => {
              setStopwatchMode(false);
              setSimpleTimerMode(false);
              resetTimer();
            }}
            variant="ghost"
            className="w-full"
          >
            Voltar
          </Button>
        )}
      </CardContent>
    </Card>
  );
}