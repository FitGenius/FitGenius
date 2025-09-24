"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dumbbell, Calendar, Clock, CheckCircle, Play, MoreHorizontal } from 'lucide-react';

export default function ClientWorkoutsPage() {
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);

  // Mock data for demo
  const workouts = [
    {
      id: '1',
      name: 'Treino A - Peito e Tríceps',
      type: 'Hipertrofia',
      duration: '45 min',
      exercises: 8,
      completed: true,
      scheduledFor: '2024-09-23',
      status: 'completed' as const,
      progress: 100
    },
    {
      id: '2',
      name: 'Treino B - Costas e Bíceps',
      type: 'Hipertrofia',
      duration: '50 min',
      exercises: 9,
      completed: false,
      scheduledFor: '2024-09-24',
      status: 'scheduled' as const,
      progress: 0
    },
    {
      id: '3',
      name: 'Treino C - Pernas',
      type: 'Força',
      duration: '60 min',
      exercises: 10,
      completed: false,
      scheduledFor: '2024-09-25',
      status: 'scheduled' as const,
      progress: 0
    }
  ];

  const exercises = [
    { name: 'Supino Reto', sets: '4x8-10', rest: '90s', weight: '80kg' },
    { name: 'Supino Inclinado', sets: '3x10-12', rest: '90s', weight: '70kg' },
    { name: 'Crucifixo', sets: '3x12-15', rest: '60s', weight: '25kg' },
    { name: 'Tríceps Testa', sets: '3x10-12', rest: '60s', weight: '40kg' },
    { name: 'Tríceps Corda', sets: '3x12-15', rest: '60s', weight: '35kg' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'scheduled':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'in_progress':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'scheduled':
        return 'Agendado';
      case 'in_progress':
        return 'Em andamento';
      default:
        return 'Pendente';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meus Treinos</h1>
          <p className="text-foreground-secondary mt-1">
            Acompanhe seu progresso e realize seus treinos
          </p>
        </div>
        <Button className="bg-gold text-black hover:bg-gold-dark">
          <Dumbbell size={16} className="mr-2" />
          Iniciar Treino
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-border bg-surface">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">
                  Treinos esta semana
                </p>
                <p className="text-2xl font-bold text-gold">3</p>
              </div>
              <Dumbbell className="h-8 w-8 text-gold" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-surface">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">
                  Concluídos
                </p>
                <p className="text-2xl font-bold text-green-400">1</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-surface">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">
                  Tempo total
                </p>
                <p className="text-2xl font-bold text-blue-400">2h 35m</p>
              </div>
              <Clock className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-surface">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">
                  Próximo treino
                </p>
                <p className="text-2xl font-bold text-orange-400">Hoje</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workouts List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Treinos Programados</h2>

          {workouts.map((workout) => (
            <Card
              key={workout.id}
              className={`border-border cursor-pointer transition-all hover:border-gold/30 ${
                selectedWorkout === workout.id ? 'border-gold bg-gold/5' : 'bg-surface'
              }`}
              onClick={() => setSelectedWorkout(workout.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">{workout.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-foreground-secondary">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {workout.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Dumbbell size={14} />
                        {workout.exercises} exercícios
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(workout.scheduledFor).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <Badge className={getStatusColor(workout.status)}>
                    {getStatusText(workout.status)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {workout.type}
                    </Badge>
                  </div>

                  {workout.status === 'scheduled' ? (
                    <Button size="sm" className="bg-gold text-black hover:bg-gold-dark">
                      <Play size={14} className="mr-1" />
                      Iniciar
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost">
                      <MoreHorizontal size={14} />
                    </Button>
                  )}
                </div>

                {/* Progress Bar */}
                {workout.progress > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-foreground-secondary mb-1">
                      <span>Progresso</span>
                      <span>{workout.progress}%</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-2">
                      <div
                        className="bg-gold h-2 rounded-full transition-all duration-300"
                        style={{ width: `${workout.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Workout Details */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Detalhes do Treino</h2>

          {selectedWorkout ? (
            <Card className="border-border bg-surface">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="text-gold" size={20} />
                  Treino A - Peito e Tríceps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-foreground-secondary">Tipo</p>
                    <p className="font-medium">Hipertrofia</p>
                  </div>
                  <div>
                    <p className="text-foreground-secondary">Duração estimada</p>
                    <p className="font-medium">45 minutos</p>
                  </div>
                  <div>
                    <p className="text-foreground-secondary">Exercícios</p>
                    <p className="font-medium">8 exercícios</p>
                  </div>
                  <div>
                    <p className="text-foreground-secondary">Descanso entre séries</p>
                    <p className="font-medium">60-90s</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Exercícios:</h4>
                  {exercises.map((exercise, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                      <div>
                        <p className="font-medium">{exercise.name}</p>
                        <p className="text-sm text-foreground-secondary">
                          {exercise.sets} • Descanso: {exercise.rest}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gold">{exercise.weight}</p>
                        <p className="text-xs text-foreground-secondary">Última carga</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button className="w-full bg-gold text-black hover:bg-gold-dark">
                  <Play size={16} className="mr-2" />
                  Iniciar Treino
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border bg-surface">
              <CardContent className="p-12 text-center">
                <Dumbbell className="mx-auto h-12 w-12 text-foreground-muted mb-4" />
                <h3 className="text-lg font-medium mb-2">Selecione um treino</h3>
                <p className="text-foreground-secondary">
                  Clique em um treino da lista para ver os detalhes e exercícios
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}