'use client';

import { Flame, TrendingUp, Calendar, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface StreakData {
  type: string;
  currentDays: number;
  longestDays: number;
  lastActivity: Date | string;
  isActive: boolean;
}

interface StreakCardProps {
  streak?: StreakData;
  className?: string;
}

export function StreakCard({ streak, className }: StreakCardProps) {
  const currentDays = streak?.currentDays || 0;
  const longestDays = streak?.longestDays || 0;
  const isActive = streak?.isActive ?? false;

  const getStreakColor = () => {
    if (currentDays === 0) return 'text-muted-foreground';
    if (currentDays < 7) return 'text-orange-400';
    if (currentDays < 30) return 'text-orange-500';
    if (currentDays < 60) return 'text-red-500';
    return 'text-red-600';
  };

  const getStreakMessage = () => {
    if (currentDays === 0) return 'Começe sua sequência hoje!';
    if (currentDays < 3) return 'Bom começo! Continue assim!';
    if (currentDays < 7) return 'Quase uma semana! Não pare!';
    if (currentDays < 14) return 'Incrível! Você está pegando o ritmo!';
    if (currentDays < 30) return 'Duas semanas! Você é dedicado!';
    if (currentDays < 60) return 'Um mês completo! Fenomenal!';
    return 'Você é uma lenda! Continue!';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'relative overflow-hidden rounded-xl border border-border/50 bg-card p-6',
        'bg-gradient-to-br from-background to-card',
        className
      )}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(255, 215, 0, 0.1) 10px,
              rgba(255, 215, 0, 0.1) 20px
            )`,
          }}
        />
      </div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              'bg-gradient-to-br from-orange-500/20 to-red-500/20'
            )}>
              <Flame className={cn('w-6 h-6', getStreakColor())} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Sequência de Treinos</h3>
              <p className="text-sm text-muted-foreground">{getStreakMessage()}</p>
            </div>
          </div>
        </div>

        {/* Main Streak Display */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <div className={cn(
              'text-4xl font-bold mb-1',
              currentDays > 0 ? getStreakColor() : 'text-muted-foreground'
            )}>
              {currentDays}
            </div>
            <div className="text-xs text-muted-foreground">Dias Consecutivos</div>
          </motion.div>

          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="text-4xl font-bold text-gold mb-1">
              {longestDays}
            </div>
            <div className="text-xs text-muted-foreground">Recorde Pessoal</div>
          </motion.div>
        </div>

        {/* Progress to Next Milestone */}
        {currentDays > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Próxima Conquista</span>
              <span>
                {getNextMilestone(currentDays) - currentDays} dias restantes
              </span>
            </div>
            <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                initial={{ width: 0 }}
                animate={{
                  width: `${(currentDays / getNextMilestone(currentDays)) * 100}%`,
                }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* Streak Calendar Preview */}
        <div className="mt-6 flex gap-1">
          {Array.from({ length: 7 }).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            const isToday = i === 6;
            const hasActivity = i < 6 ? currentDays > (6 - i) : isActive;

            return (
              <div
                key={i}
                className={cn(
                  'flex-1 h-8 rounded flex items-center justify-center text-xs font-medium',
                  hasActivity
                    ? 'bg-gradient-to-br from-orange-500/20 to-red-500/20 text-orange-500'
                    : 'bg-muted/20 text-muted-foreground',
                  isToday && 'ring-2 ring-gold/50'
                )}
              >
                {date.toLocaleDateString('pt-BR', { weekday: 'short' })[0].toUpperCase()}
              </div>
            );
          })}
        </div>

        {/* Last Activity */}
        {streak?.lastActivity && (
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>
              Última atividade:{' '}
              {new Date(streak.lastActivity).toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function getNextMilestone(currentDays: number): number {
  const milestones = [3, 7, 14, 30, 60, 100, 365];
  return milestones.find(m => m > currentDays) || 365;
}