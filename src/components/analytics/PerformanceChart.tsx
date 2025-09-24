'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Dumbbell, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PerformanceData {
  date: string;
  exercise: string;
  category: string;
  maxWeight: number;
  avgWeight: number;
}

interface ExerciseStats {
  [exercise: string]: {
    records: Array<{
      date: string;
      maxWeight: number;
      avgWeight: number;
    }>;
    category: string;
    improvement?: {
      initial: number;
      current: number;
      change: number;
      best: number;
    };
  };
}

interface PerformanceChartProps {
  period?: string;
  className?: string;
}

const categoryColors = {
  CHEST: '#ef4444',
  BACK: '#3b82f6',
  SHOULDERS: '#10b981',
  ARMS: '#f59e0b',
  LEGS: '#8b5cf6',
  ABS: '#06b6d4',
  CARDIO: '#ec4899',
  FUNCTIONAL: '#84cc16'
};

const categoryLabels = {
  CHEST: 'Peito',
  BACK: 'Costas',
  SHOULDERS: 'Ombros',
  ARMS: 'Braços',
  LEGS: 'Pernas',
  ABS: 'Abdomen',
  CARDIO: 'Cardio',
  FUNCTIONAL: 'Funcional'
};

export function PerformanceChart({ period = '6m', className }: PerformanceChartProps) {
  const [data, setData] = useState<PerformanceData[]>([]);
  const [stats, setStats] = useState<{ exercises: ExerciseStats } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [viewMode, setViewMode] = useState<'overview' | 'exercise'>('overview');

  useEffect(() => {
    fetchData();
  }, [period]);

  useEffect(() => {
    if (data.length > 0 && !selectedExercise) {
      // Selecionar o exercício com mais registros por padrão
      const exerciseCounts = data.reduce((acc, item) => {
        acc[item.exercise] = (acc[item.exercise] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const mostRecordedExercise = Object.entries(exerciseCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0];
      
      if (mostRecordedExercise) {
        setSelectedExercise(mostRecordedExercise);
      }
    }
  }, [data]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/evolution?type=performance&period=${period}`);
      const result = await response.json();
      
      if (response.ok) {
        const formattedData = result.data.map((item: any) => ({
          date: new Date(item.date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit'
          }),
          exercise: item.exercise,
          category: item.category,
          maxWeight: parseFloat(item.maxWeight.toFixed(1)),
          avgWeight: parseFloat(item.avgWeight.toFixed(1))
        }));
        
        setData(formattedData);
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={cn('bg-card rounded-xl border border-border/50 p-6', className)}>
        <div className="animate-pulse">
          <div className="h-6 bg-muted/20 rounded mb-4 w-48" />
          <div className="h-64 bg-muted/20 rounded" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn('bg-card rounded-xl border border-border/50 p-6', className)}>
        <div className="flex items-center gap-2 mb-4">
          <Dumbbell className="w-5 h-5 text-gold" />
          <h3 className="text-lg font-semibold text-foreground">Evolução de Força</h3>
        </div>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <Dumbbell className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum dado de performance encontrado</p>
            <p className="text-sm">Complete treinos com pesos registrados para ver sua evolução</p>
          </div>
        </div>
      </div>
    );
  }

  // Agrupar dados por categoria para visão geral
  const categoryData = Object.entries(
    data.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = {
          category: item.category,
          totalWeight: 0,
          count: 0,
          exercises: new Set()
        };
      }
      acc[item.category].totalWeight += item.maxWeight;
      acc[item.category].count += 1;
      acc[item.category].exercises.add(item.exercise);
      return acc;
    }, {} as any)
  ).map(([category, data]) => ({
    category: categoryLabels[category as keyof typeof categoryLabels] || category,
    categoryKey: category,
    avgWeight: (data.totalWeight / data.count),
    exercises: data.exercises.size,
    records: data.count
  }));

  // Dados do exercício selecionado
  const exerciseData = selectedExercise 
    ? data.filter(d => d.exercise === selectedExercise).slice(-10) // Últimos 10 registros
    : [];

  const availableExercises = [...new Set(data.map(d => d.exercise))].sort();
  const exerciseStats = stats?.exercises?.[selectedExercise];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('bg-card rounded-xl border border-border/50 p-6', className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-gold" />
          <h3 className="text-lg font-semibold text-foreground">Evolução de Força</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(value: 'overview' | 'exercise') => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Visão Geral</SelectItem>
              <SelectItem value="exercise">Por Exercício</SelectItem>
            </SelectContent>
          </Select>
          
          {viewMode === 'exercise' && (
            <Select value={selectedExercise} onValueChange={setSelectedExercise}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecione um exercício" />
              </SelectTrigger>
              <SelectContent>
                {availableExercises.map(exercise => (
                  <SelectItem key={exercise} value={exercise}>
                    {exercise}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Exercise Stats */}
      {viewMode === 'exercise' && exerciseStats?.improvement && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gold">
              {exerciseStats.improvement.current.toFixed(1)}kg
            </div>
            <div className="text-xs text-muted-foreground">Atual</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">
              {exerciseStats.improvement.best.toFixed(1)}kg
            </div>
            <div className="text-xs text-muted-foreground">Recorde</div>
          </div>
          <div className="text-center">
            <div className={cn(
              'text-2xl font-bold',
              exerciseStats.improvement.change >= 0 ? 'text-green-500' : 'text-red-500'
            )}>
              {exerciseStats.improvement.change >= 0 ? '+' : ''}
              {exerciseStats.improvement.change.toFixed(1)}kg
            </div>
            <div className="text-xs text-muted-foreground">Evolução</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">
              {exerciseStats.records.length}
            </div>
            <div className="text-xs text-muted-foreground">Registros</div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'overview' ? (
            <BarChart data={categoryData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" stroke="currentColor" />
              <XAxis 
                dataKey="category" 
                className="text-xs"
                stroke="currentColor"
                opacity={0.7}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                className="text-xs"
                stroke="currentColor"
                opacity={0.7}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number, name: string) => {
                  if (name === 'avgWeight') return [`${value.toFixed(1)}kg`, 'Peso Médio'];
                  if (name === 'exercises') return [value, 'Exercícios'];
                  return [value, name];
                }}
              />
              <Bar 
                dataKey="avgWeight" 
                fill="#ffd700"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          ) : (
            <LineChart data={exerciseData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" stroke="currentColor" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                stroke="currentColor"
                opacity={0.7}
              />
              <YAxis 
                className="text-xs"
                stroke="currentColor"
                opacity={0.7}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number, name: string) => [
                  `${value}kg`,
                  name === 'maxWeight' ? 'Peso Máximo' : 'Peso Médio'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="maxWeight" 
                stroke="#ffd700" 
                strokeWidth={3}
                dot={{ fill: '#ffd700', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#ffd700', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="avgWeight" 
                stroke="#3b82f6" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="text-xs text-muted-foreground text-center">
          {viewMode === 'overview' 
            ? `${categoryData.length} categorias • ${data.length} registros totais`
            : `${exerciseData.length} registros do exercício selecionado`
          }
        </div>
      </div>
    </motion.div>
  );
}