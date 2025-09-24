'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Ruler } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface MeasurementsData {
  date: string;
  waist?: number;
  chest?: number;
  arm?: number;
  thigh?: number;
  hip?: number;
}

interface MeasurementStats {
  waist?: { current: number; initial: number; change: number };
  chest?: { current: number; initial: number; change: number };
  arm?: { current: number; initial: number; change: number };
  thigh?: { current: number; initial: number; change: number };
  hip?: { current: number; initial: number; change: number };
}

interface MeasurementsChartProps {
  period?: string;
  className?: string;
}

const measurementColors = {
  waist: '#ef4444',
  chest: '#3b82f6',
  arm: '#10b981',
  thigh: '#f59e0b',
  hip: '#8b5cf6'
};

const measurementLabels = {
  waist: 'Cintura',
  chest: 'Peito',
  arm: 'Braço',
  thigh: 'Coxa',
  hip: 'Quadril'
};

export function MeasurementsChart({ period = '6m', className }: MeasurementsChartProps) {
  const [data, setData] = useState<MeasurementsData[]>([]);
  const [stats, setStats] = useState<MeasurementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMeasurements, setSelectedMeasurements] = useState<string[]>(['waist', 'chest', 'arm']);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/evolution?type=measurements&period=${period}`);
      const result = await response.json();
      
      if (response.ok) {
        const formattedData = result.data.map((item: any) => ({
          date: new Date(item.date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
          }),
          waist: item.waist ? parseFloat(item.waist.toFixed(1)) : undefined,
          chest: item.chest ? parseFloat(item.chest.toFixed(1)) : undefined,
          arm: item.arm ? parseFloat(item.arm.toFixed(1)) : undefined,
          thigh: item.thigh ? parseFloat(item.thigh.toFixed(1)) : undefined,
          hip: item.hip ? parseFloat(item.hip.toFixed(1)) : undefined
        }));
        
        setData(formattedData);
        setStats(result.stats);
        
        // Atualizar medidas selecionadas baseado nos dados disponíveis
        const availableMeasurements = Object.keys(measurementLabels).filter(key => 
          formattedData.some((d: any) => d[key] !== undefined)
        );
        setSelectedMeasurements(availableMeasurements.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching measurements data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMeasurement = (measurement: string) => {
    setSelectedMeasurements(prev => {
      if (prev.includes(measurement)) {
        return prev.filter(m => m !== measurement);
      } else {
        return [...prev, measurement];
      }
    });
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
          <Ruler className="w-5 h-5 text-gold" />
          <h3 className="text-lg font-semibold text-foreground">Medidas Corporais</h3>
        </div>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <Ruler className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma medida corporal encontrada</p>
            <p className="text-sm">Adicione avaliações com medidas de circunferência</p>
          </div>
        </div>
      </div>
    );
  }

  const availableMeasurements = Object.keys(measurementLabels).filter(key => 
    data.some((d: any) => d[key] !== undefined)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('bg-card rounded-xl border border-border/50 p-6', className)}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Ruler className="w-5 h-5 text-gold" />
        <h3 className="text-lg font-semibold text-foreground">Medidas Corporais</h3>
      </div>

      {/* Measurement Toggles */}
      <div className="flex flex-wrap gap-2 mb-6">
        {availableMeasurements.map(measurement => {
          const isSelected = selectedMeasurements.includes(measurement);
          const color = measurementColors[measurement as keyof typeof measurementColors];
          
          return (
            <button
              key={measurement}
              onClick={() => toggleMeasurement(measurement)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-all',
                isSelected 
                  ? 'text-white shadow-sm' 
                  : 'text-muted-foreground bg-muted/50 hover:bg-muted'
              )}
              style={isSelected ? { backgroundColor: color } : {}}
            >
              {measurementLabels[measurement as keyof typeof measurementLabels]}
            </button>
          );
        })}
      </div>

      {/* Stats Cards */}
      {stats && selectedMeasurements.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {selectedMeasurements.slice(0, 3).map(measurement => {
            const stat = stats[measurement as keyof MeasurementStats];
            if (!stat) return null;
            
            const color = measurementColors[measurement as keyof typeof measurementColors];
            const isPositiveChange = stat.change > 0;
            
            return (
              <div key={measurement} className="bg-background/50 rounded-lg p-3 border border-border/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">
                    {measurementLabels[measurement as keyof typeof measurementLabels]}
                  </span>
                  <span 
                    className="text-xs font-medium"
                    style={{ color }}
                  >
                    {isPositiveChange ? '+' : ''}{stat.change.toFixed(1)}cm
                  </span>
                </div>
                <div className="text-xl font-bold" style={{ color }}>
                  {stat.current.toFixed(1)}cm
                </div>
                <div className="text-xs text-muted-foreground">
                  Inicial: {stat.initial.toFixed(1)}cm
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                `${value}cm`,
                measurementLabels[name as keyof typeof measurementLabels] || name
              ]}
            />
            
            {selectedMeasurements.map(measurement => {
              if (!data.some((d: any) => d[measurement] !== undefined)) return null;
              
              const color = measurementColors[measurement as keyof typeof measurementColors];
              
              return (
                <Line 
                  key={measurement}
                  type="monotone" 
                  dataKey={measurement} 
                  stroke={color}
                  strokeWidth={2}
                  dot={{ fill: color, strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, fill: color, strokeWidth: 2 }}
                  connectNulls={false}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="text-xs text-muted-foreground text-center">
          {data.length} avaliações registradas • {availableMeasurements.length} medidas disponíveis
        </div>
      </div>
    </motion.div>
  );
}