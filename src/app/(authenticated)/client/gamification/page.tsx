'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AchievementCard } from '@/components/gamification/AchievementCard';
import { LeaderboardCard } from '@/components/gamification/LeaderboardCard';
import { StreakCard } from '@/components/gamification/StreakCard';
import { Trophy, Target, Flame, Users, Sparkles, TrendingUp } from 'lucide-react';
import { calculateLevel, getLevelTitle } from '@/lib/achievements';

interface Achievement {
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
  seen?: boolean;
}

interface UserStats {
  total: number;
  unlocked: number;
  points: number;
  level: number;
}

interface Streak {
  type: string;
  currentDays: number;
  longestDays: number;
  lastActivity: Date | string;
  isActive: boolean;
}

export default function GamificationPage() {
  const [achievements, setAchievements] = useState<{
    unlocked: Achievement[];
    locked: Achievement[];
  }>({ unlocked: [], locked: [] });
  const [stats, setStats] = useState<UserStats | null>(null);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState('WEEKLY');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('achievements');

  useEffect(() => {
    fetchAchievements();
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [leaderboardPeriod]);

  const fetchAchievements = async () => {
    try {
      const response = await fetch('/api/gamification/achievements');
      const data = await response.json();
      
      if (response.ok) {
        setAchievements({
          unlocked: data.unlocked || [],
          locked: data.locked || [],
        });
        setStats(data.stats);
        setStreaks(data.streaks || []);
        
        // Mark new achievements as seen
        const newAchievements = data.unlocked.filter((a: Achievement) => !a.seen);
        if (newAchievements.length > 0) {
          await markAchievementsAsSeen(newAchievements.map((a: Achievement) => a.id));
        }
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(
        `/api/gamification/leaderboard?period=${leaderboardPeriod}&limit=10`
      );
      const data = await response.json();
      
      if (response.ok) {
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const markAchievementsAsSeen = async (achievementIds: string[]) => {
    try {
      await fetch('/api/gamification/achievements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ achievementIds }),
      });
    } catch (error) {
      console.error('Error marking achievements as seen:', error);
    }
  };

  const levelInfo = stats ? calculateLevel(stats.points) : null;
  const workoutStreak = streaks.find(s => s.type === 'WORKOUT');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gold to-gold/60 bg-clip-text text-transparent">
          Jornada FitGenius
        </h1>
        <p className="text-muted-foreground">
          Acompanhe seu progresso, desbloqueie conquistas e supere seus limites
        </p>
      </motion.div>

      {/* Stats Overview */}
      {stats && levelInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="bg-card rounded-xl border border-border/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-gold" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  Nível {levelInfo.level}
                </div>
                <div className="text-xs text-muted-foreground">
                  {getLevelTitle(levelInfo.level)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {stats.points.toLocaleString('pt-BR')}
                </div>
                <div className="text-xs text-muted-foreground">Pontos Totais</div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {stats.unlocked}/{stats.total}
                </div>
                <div className="text-xs text-muted-foreground">Conquistas</div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {workoutStreak?.currentDays || 0}
                </div>
                <div className="text-xs text-muted-foreground">Dias de Streak</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Level Progress */}
      {levelInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border/50 p-6"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Progresso do Nível
                </h3>
                <p className="text-sm text-muted-foreground">
                  {levelInfo.currentLevelPoints.toLocaleString('pt-BR')} /{' '}
                  {levelInfo.nextLevelPoints.toLocaleString('pt-BR')} pontos
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gold">
                  {Math.round(levelInfo.progress)}%
                </div>
              </div>
            </div>
            <div className="h-3 bg-muted/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-gold/60 to-gold"
                initial={{ width: 0 }}
                animate={{ width: `${levelInfo.progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Streak Card */}
      {workoutStreak && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <StreakCard streak={workoutStreak} />
        </motion.div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Conquistas
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Ranking
          </TabsTrigger>
          <TabsTrigger value="challenges" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Desafios
          </TabsTrigger>
        </TabsList>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          {achievements.unlocked.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">
                Conquistas Desbloqueadas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.unlocked.map((achievement) => (
                  <AchievementCard
                    key={achievement.key}
                    achievement={achievement}
                  />
                ))}
              </div>
            </div>
          )}

          {achievements.locked.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">
                Próximas Conquistas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.locked
                  .filter((a) => (a.progress || 0) > 0)
                  .map((achievement) => (
                    <AchievementCard
                      key={achievement.key}
                      achievement={achievement}
                    />
                  ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-foreground">Ranking</h2>
            <div className="flex gap-2">
              {['WEEKLY', 'MONTHLY', 'ALL_TIME'].map((period) => (
                <button
                  key={period}
                  onClick={() => setLeaderboardPeriod(period)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    leaderboardPeriod === period
                      ? 'bg-gold text-background'
                      : 'bg-card text-foreground hover:bg-muted'
                  }`}
                >
                  {period === 'WEEKLY' && 'Semanal'}
                  {period === 'MONTHLY' && 'Mensal'}
                  {period === 'ALL_TIME' && 'Geral'}
                </button>
              ))}
            </div>
          </div>

          {leaderboard && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <LeaderboardCard
                  entries={leaderboard.topRanking || []}
                  title="Top 10 Ranking"
                />
              </div>

              {leaderboard.userRanking && leaderboard.nearbyRanking && (
                <div>
                  <LeaderboardCard
                    entries={leaderboard.nearbyRanking}
                    title="Sua Posição"
                  />
                </div>
              )}
            </div>
          )}

          {leaderboard?.totalParticipants && (
            <div className="text-center text-sm text-muted-foreground">
              Total de participantes: {leaderboard.totalParticipants}
            </div>
          )}
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-6">
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Desafios em Breve
            </h3>
            <p className="text-muted-foreground">
              Em breve você poderá participar de desafios emocionantes
              <br />e competir com outros usuários!
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}