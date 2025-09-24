'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getTierColor } from '@/lib/achievements';
import { Lock, Trophy, CheckCircle } from 'lucide-react';

interface AchievementCardProps {
  achievement: {
    id?: string;
    key: string;
    name: string;
    description: string;
    icon: string;
    points: number;
    tier: string;
    progress?: number;
    requirement?: number;
    unlockedAt?: Date | string;
    locked?: boolean;
  };
  onClick?: () => void;
}

export function AchievementCard({ achievement, onClick }: AchievementCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isLocked = achievement.locked || !achievement.unlockedAt;
  const tierColor = getTierColor(achievement.tier as any);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-xl border bg-card cursor-pointer transition-all duration-300',
        isLocked ? 'border-muted opacity-75' : 'border-gold/20 hover:border-gold/40',
        'backdrop-blur-sm'
      )}
    >
      {/* Tier Glow Effect */}
      {!isLocked && (
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `radial-gradient(circle at center, ${tierColor}, transparent)`,
          }}
        />
      )}

      <div className="relative p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div
              className={cn(
                'w-12 h-12 rounded-lg flex items-center justify-center text-2xl',
                isLocked
                  ? 'bg-muted/20'
                  : 'bg-gradient-to-br from-gold/20 to-gold/10'
              )}
            >
              {isLocked ? (
                <Lock className="w-6 h-6 text-muted-foreground" />
              ) : (
                <span>{achievement.icon}</span>
              )}
            </div>

            <div className="flex-1">
              <h3 className={cn(
                'font-semibold',
                isLocked ? 'text-muted-foreground' : 'text-foreground'
              )}>
                {achievement.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {achievement.description}
              </p>
            </div>
          </div>

          {/* Points Badge */}
          <div
            className={cn(
              'px-2 py-1 rounded-lg text-xs font-semibold',
              isLocked
                ? 'bg-muted/20 text-muted-foreground'
                : 'bg-gold/20 text-gold'
            )}
          >
            +{achievement.points} pts
          </div>
        </div>

        {/* Progress Bar */}
        {achievement.progress !== undefined && achievement.requirement && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progresso</span>
              <span>
                {Math.min(achievement.progress, achievement.requirement)}/
                {achievement.requirement}
              </span>
            </div>
            <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-gold/60 to-gold"
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(
                    (achievement.progress / achievement.requirement) * 100,
                    100
                  )}%`,
                }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* Tier Badge */}
        <div className="absolute top-2 right-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: tierColor }}
          />
        </div>

        {/* Unlocked Date */}
        {achievement.unlockedAt && !isLocked && (
          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span>
              Desbloqueado em{' '}
              {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}