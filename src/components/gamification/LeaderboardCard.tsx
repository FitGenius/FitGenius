'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Award, Crown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar?: string | null;
  level: number;
  points: number;
  workouts: number;
  isCurrentUser?: boolean;
}

interface LeaderboardCardProps {
  entries: LeaderboardEntry[];
  title?: string;
  showWorkouts?: boolean;
}

export function LeaderboardCard({ 
  entries, 
  title = 'Ranking', 
  showWorkouts = true 
}: LeaderboardCardProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-gold" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-gold/20 to-gold/10 border-gold/30';
      case 2:
        return 'bg-gradient-to-r from-gray-500/20 to-gray-500/10 border-gray-500/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-600/10 border-amber-600/30';
      default:
        return 'bg-card/50 border-border/50';
    }
  };

  return (
    <div className="space-y-2">
      {title && (
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-gold" />
          {title}
        </h3>
      )}

      <div className="space-y-2">
        {entries.map((entry, index) => (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              'relative flex items-center gap-4 p-3 rounded-xl border transition-all',
              getRankStyle(entry.rank),
              entry.isCurrentUser && 'ring-2 ring-gold/50'
            )}
          >
            {/* Rank */}
            <div className="flex items-center justify-center min-w-[40px]">
              {getRankIcon(entry.rank) || (
                <span className="text-xl font-bold text-muted-foreground">
                  {entry.rank}
                </span>
              )}
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="h-10 w-10 border-2 border-background">
                <AvatarImage src={entry.avatar || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-gold/20 to-gold/10">
                  {entry.name?.slice(0, 2).toUpperCase() || '??'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'font-semibold',
                    entry.isCurrentUser ? 'text-gold' : 'text-foreground'
                  )}>
                    {entry.name}
                    {entry.isCurrentUser && ' (Você)'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Nível {entry.level}
                  </span>
                </div>

                {showWorkouts && (
                  <div className="text-xs text-muted-foreground">
                    {entry.workouts} treinos completados
                  </div>
                )}
              </div>
            </div>

            {/* Points */}
            <div className="text-right">
              <div className="font-bold text-gold">
                {entry.points.toLocaleString('pt-BR')}
              </div>
              <div className="text-xs text-muted-foreground">pontos</div>
            </div>

            {/* Trend Indicator */}
            {entry.rank <= 3 && (
              <div className="absolute -top-1 -right-1">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gold to-gold/60 flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 text-background" />
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}