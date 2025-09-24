'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface BodyCompositionData {
  date: string;
  bodyFat?: number;
  muscleMass?: number;
  weight?: number;
}

interface BodyCompositionStats {
  bodyFat?: {
    current: number;
    initial: number;
    change: number;
  };
  muscleMass?: {
    current: number;
    initial: number;
    change: number;
  };
}

interface BodyCompositionChartProps {
  period?: string;
  className?: string;
}

export function BodyCompositionChart({ period = '6m', className }: BodyCompositionChartProps) {
  const [data, setData] = useState<BodyCompositionData[]>([]);
  const [stats, setStats] = useState<BodyCompositionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/evolution?type=body_composition&period=${period}`);
      const result = await response.json();
      
      if (response.ok) {
        const formattedData = result.data.map((item: any) => ({
          date: new Date(item.date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
          }),
          bodyFat: item.bodyFat ? parseFloat(item.bodyFat.toFixed(1)) : undefined,
          muscleMass: item.muscleMass ? parseFloat(item.muscleMass.toFixed(1)) : undefined,
          weight: item.weight ? parseFloat(item.weight.toFixed(1)) : undefined
        }));
        
        setData(formattedData);
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Error fetching body composition data:', error);
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
          <Activity className="w-5 h-5 text-gold" />
          <h3 className="text-lg font-semibold text-foreground">Composição Corporal</h3>
        </div>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum dado de composição corporal encontrado</p>
            <p className="text-sm">Adicione avaliações com % de gordura e massa muscular</p>
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
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-gold" />
        <h3 className="text-lg font-semibold text-foreground">Composição Corporal</h3>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {stats?.bodyFat && (
          <div className="bg-background/50 rounded-lg p-4 border border-border/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">% Gordura</span>
              <div className="flex items-center gap-1">
                {stats.bodyFat.change < 0 ? (
                  <TrendingDown className="w-3 h-3 text-green-500" />
                ) : stats.bodyFat.change > 0 ? (
                  <TrendingUp className="w-3 h-3 text-red-500" />
                ) : null}
                <span className={cn(
                  'text-xs font-medium',
                  stats.bodyFat.change < 0 ? 'text-green-500' :
                  stats.bodyFat.change > 0 ? 'text-red-500' : 'text-muted-foreground'
                )}>
                  {stats.bodyFat.change > 0 ? '+' : ''}{stats.bodyFat.change.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="text-2xl font-bold text-orange-500">
              {stats.bodyFat.current.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">
              Inicial: {stats.bodyFat.initial.toFixed(1)}%
            </div>
          </div>
        )}

        {stats?.muscleMass && (
          <div className="bg-background/50 rounded-lg p-4 border border-border/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Massa Muscular</span>
              <div className="flex items-center gap-1">
                {stats.muscleMass.change > 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : stats.muscleMass.change < 0 ? (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                ) : null}
                <span className={cn(
                  'text-xs font-medium',
                  stats.muscleMass.change > 0 ? 'text-green-500' :
                  stats.muscleMass.change < 0 ? 'text-red-500' : 'text-muted-foreground'
                )}>
                  {stats.muscleMass.change > 0 ? '+' : ''}{stats.muscleMass.change.toFixed(1)}kg
                </span>
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-500">
              {stats.muscleMass.current.toFixed(1)}kg
            </div>
            <div className="text-xs text-muted-foreground">
              Inicial: {stats.muscleMass.initial.toFixed(1)}kg
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              formatter={(value: number, name: string) => {
                if (name === 'bodyFat') return [`${value}%`, '% Gordura'];
                if (name === 'muscleMass') return [`${value}kg`, 'Massa Muscular'];
                return [value, name];
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => {
                if (value === 'bodyFat') return '% Gordura';
                if (value === 'muscleMass') return 'Massa Muscular';
                return value;
              }}
            />
            {data.some(d => d.bodyFat) && (
              <Line 
                type="monotone" 
                dataKey="bodyFat" 
                stroke="#f97316" 
                strokeWidth={2}
                dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#f97316', strokeWidth: 2 }}
                connectNulls={false}
              />
            )}
            {data.some(d => d.muscleMass) && (
              <Line 
                type="monotone" 
                dataKey="muscleMass" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 2 }}
                connectNulls={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="text-xs text-muted-foreground text-center">
          {data.length} avaliações registradas
        </div>
      </div>
    </motion.div>
  );
}