'use client';

import { useEffect, useState } from 'react';
import { Trophy, Flame, TrendingUp, Star } from 'lucide-react';
import { calculateLevel, getLevelTitle } from '@/lib/achievements';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface UserStats {
  totalPoints: number;
  level: number;
  totalAchievements: number;
  totalWorkouts: number;
}

interface Streak {
  type: string;
  currentDays: number;
}

export function ProfileStatsWidget() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [newAchievements, setNewAchievements] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/gamification/achievements');
      const data = await response.json();
      
      if (response.ok && data.stats) {
        setStats({
          totalPoints: data.stats.points,
          level: data.stats.level,
          totalAchievements: data.stats.unlocked,
          totalWorkouts: 0
        });
        
        const workoutStreak = data.streaks?.find((s: Streak) => s.type === 'WORKOUT');
        if (workoutStreak) {
          setStreak(workoutStreak.currentDays);
        }
        
        const unseenAchievements = data.unlocked?.filter((a: any) => !a.seen).length || 0;
        setNewAchievements(unseenAchievements);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="bg-card rounded-xl border border-border/50 p-6 animate-pulse">
        <div className="h-32" />
      </div>
    );
  }

  const levelInfo = calculateLevel(stats.totalPoints);

  return (
    <Link href="/client/gamification">
      <div className="bg-card rounded-xl border border-border/50 p-6 hover:border-gold/30 transition-all cursor-pointer group">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-gold" />
            <h3 className="font-semibold text-foreground">Seu Progresso</h3>
          </div>
          {newAchievements > 0 && (
            <div className="px-2 py-1 bg-gold/20 text-gold rounded-full text-xs font-semibold animate-pulse">
              +{newAchievements} nova{newAchievements > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Level Display */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium text-foreground">
                Nível {levelInfo.level} - {getLevelTitle(levelInfo.level)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {Math.round(levelInfo.progress)}%
            </span>
          </div>
          <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-gold/60 to-gold transition-all"
              style={{ width: `${levelInfo.progress}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {stats.totalPoints.toLocaleString('pt-BR')} / {levelInfo.nextLevelPoints.toLocaleString('pt-BR')} pts
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">
              {stats.totalAchievements}
            </div>
            <div className="text-xs text-muted-foreground">Conquistas</div>
          </div>

          <div className="text-center">
            <div className={cn(
              'text-lg font-bold',
              streak > 0 ? 'text-orange-500' : 'text-muted-foreground'
            )}>
              <div className="flex items-center justify-center gap-1">
                {streak}
                {streak > 0 && <Flame className="w-3 h-3" />}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">Streak</div>
          </div>

          <div className="text-center">
            <div className="text-lg font-bold text-gold">
              {stats.totalPoints.toLocaleString('pt-BR')}
            </div>
            <div className="text-xs text-muted-foreground">Pontos</div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground group-hover:text-gold transition-colors">
              Ver todas as conquistas
            </span>
            <TrendingUp className="w-3 h-3 text-muted-foreground group-hover:text-gold transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  );
}