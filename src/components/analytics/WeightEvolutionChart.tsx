'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface WeightData {
  date: string;
  weight: number;
  bmi?: number;
}

interface WeightStats {
  current: number;
  initial: number;
  change: number;
  min: number;
  max: number;
}

interface WeightEvolutionChartProps {
  period?: string;
  className?: string;
}

export function WeightEvolutionChart({ period = '6m', className }: WeightEvolutionChartProps) {
  const [data, setData] = useState<WeightData[]>([]);
  const [stats, setStats] = useState<WeightStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/evolution?type=weight&period=${period}`);
      const result = await response.json();
      
      if (response.ok) {
        // Formatar dados para o gráfico
        const formattedData = result.data.map((item: any) => ({
          date: new Date(item.date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
          }),
          weight: parseFloat(item.weight?.toFixed(1) || '0'),
          bmi: parseFloat(item.bmi?.toFixed(1) || '0')
        }));
        
        setData(formattedData);
        setStats(result.stats?.weight);
      }
    } catch (error) {
      console.error('Error fetching weight data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = () => {
    if (!stats) return <Minus className="w-4 h-4 text-muted-foreground" />;
    if (stats.change > 0) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (stats.change < 0) return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getTrendColor = () => {
    if (!stats) return 'text-muted-foreground';
    if (stats.change > 0) return 'text-red-500';
    if (stats.change < 0) return 'text-green-500';
    return 'text-muted-foreground';
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
          <Scale className="w-5 h-5 text-gold" />
          <h3 className="text-lg font-semibold text-foreground">Evolução do Peso</h3>
        </div>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <Scale className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum dado de peso encontrado</p>
            <p className="text-sm">Adicione avaliações físicas para ver sua evolução</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('bg-card rounded-xl border border-border/50 p-6', className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-gold" />
          <h3 className="text-lg font-semibold text-foreground">Evolução do Peso</h3>
        </div>
        {stats && (
          <div className="flex items-center gap-2 text-sm">
            {getTrendIcon()}
            <span className={cn('font-semibold', getTrendColor())}>
              {stats.change > 0 ? '+' : ''}{stats.change.toFixed(1)}kg
            </span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gold">
              {stats.current.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">Atual (kg)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {stats.initial.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">Inicial (kg)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">
              {stats.min.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">Mínimo (kg)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">
              {stats.max.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">Máximo (kg)</div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffd700" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ffd700" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              className="opacity-30"
              stroke="currentColor"
            />
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
              domain={['dataMin - 2', 'dataMax + 2']}
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
                name === 'weight' ? 'Peso' : 'IMC'
              ]}
            />
            <Area 
              type="monotone" 
              dataKey="weight" 
              stroke="#ffd700" 
              strokeWidth={3}
              fill="url(#weightGradient)"
              dot={{ fill: '#ffd700', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#ffd700', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Progress Indicator */}
      {stats && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="text-xs text-muted-foreground text-center">
            {data.length} avaliações registradas
            {stats.change !== 0 && (
              <span className={cn('ml-2', getTrendColor())}>
                • {stats.change > 0 ? 'Ganho' : 'Perda'} de {Math.abs(stats.change).toFixed(1)}kg no período
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}