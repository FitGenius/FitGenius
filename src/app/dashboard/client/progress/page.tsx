'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Activity,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Scale,
  Clock,
  Award,
  Zap
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar
} from 'recharts';

interface AnalyticsData {
  stats: {
    totalWorkouts: number;
    totalAssessments: number;
    thisMonthWorkouts: number;
    thisMonthAssessments: number;
    hasLatestAssessment: boolean;
    daysSinceLastAssessment: number | null;
  };
  recentActivity: Array<{
    type: string;
    id: string;
    date: string;
    professional: string;
    description: string;
  }>;
  latestAssessment: any;
}

export default function ClientProgressPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics/overview');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'assessment':
        return <Scale size={16} className="text-purple-500" />;
      case 'workout':
        return <Activity size={16} className="text-green-500" />;
      default:
        return <Target size={16} className="text-gold" />;
    }
  };

  // Dados fictícios para progresso
  const progressData = [
    { month: 'Jan', workouts: 8, assessments: 1 },
    { month: 'Fev', workouts: 12, assessments: 1 },
    { month: 'Mar', workouts: 15, assessments: 2 },
    { month: 'Abr', workouts: 18, assessments: 1 },
    { month: 'Mai', workouts: 22, assessments: 1 },
    { month: 'Jun', workouts: analytics?.stats.thisMonthWorkouts || 25, assessments: analytics?.stats.thisMonthAssessments || 2 }
  ];

  // Dados para gráfico radial de metas
  const goalData = [
    { name: 'Treinos', value: Math.min((analytics?.stats.thisMonthWorkouts || 0) / 20 * 100, 100), fill: '#10b981' },
    { name: 'Avaliações', value: Math.min((analytics?.stats.thisMonthAssessments || 0) / 2 * 100, 100), fill: '#8b5cf6' }
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full mx-auto"></div>
          <p className="text-foreground-secondary mt-4">Carregando progresso...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <BarChart3 size={48} className="text-foreground-muted mx-auto mb-4" />
          <p className="text-foreground-secondary">Erro ao carregar dados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Meu Progresso</h1>
        <p className="text-foreground-secondary">
          Acompanhe sua evolução e conquistas ao longo do tempo
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">Treinos Total</p>
                <p className="text-2xl font-bold text-foreground">{analytics.stats.totalWorkouts}</p>
                <p className="text-xs text-foreground-muted">
                  {analytics.stats.thisMonthWorkouts} este mês
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Activity size={24} className="text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">Avaliações</p>
                <p className="text-2xl font-bold text-foreground">{analytics.stats.totalAssessments}</p>
                <p className="text-xs text-foreground-muted">
                  {analytics.stats.thisMonthAssessments} este mês
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Scale size={24} className="text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">Última Avaliação</p>
                <p className="text-2xl font-bold text-foreground">
                  {analytics.stats.daysSinceLastAssessment !== null
                    ? `${analytics.stats.daysSinceLastAssessment}d`
                    : 'N/A'
                  }
                </p>
                <p className="text-xs text-foreground-muted">
                  {analytics.stats.hasLatestAssessment ? 'dias atrás' : 'Nenhuma avaliação'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Calendar size={24} className="text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">Conquistas</p>
                <p className="text-2xl font-bold text-foreground">3</p>
                <p className="text-xs text-foreground-muted">
                  badges desbloqueadas
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                <Award size={24} className="text-gold" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={20} className="text-gold" />
              Progresso Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={progressData}>
                  <defs>
                    <linearGradient id="workoutGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="assessmentGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="month" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="workouts"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#workoutGradient)"
                    name="Treinos"
                  />
                  <Area
                    type="monotone"
                    dataKey="assessments"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fill="url(#assessmentGradient)"
                    name="Avaliações"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Goals Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target size={20} className="text-gold" />
              Metas do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="80%" data={goalData}>
                  <RadialBar
                    minAngle={15}
                    label={{ position: 'insideStart', fill: '#fff' }}
                    background
                    clockWise
                    dataKey="value"
                    cornerRadius={10}
                    fill="#8884d8"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '8px'
                    }}
                    formatter={(value: any) => [`${value.toFixed(0)}%`, 'Progresso']}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground-secondary">Meta de Treinos (20/mês)</span>
                <Badge variant="outline" className="text-green-500 border-green-500">
                  {Math.min((analytics.stats.thisMonthWorkouts / 20 * 100), 100).toFixed(0)}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground-secondary">Meta de Avaliações (2/mês)</span>
                <Badge variant="outline" className="text-purple-500 border-purple-500">
                  {Math.min((analytics.stats.thisMonthAssessments / 2 * 100), 100).toFixed(0)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award size={20} className="text-gold" />
              Conquistas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-hover">
                <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                  <Zap size={20} className="text-gold" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Primeira Semana</p>
                  <p className="text-sm text-foreground-secondary">Completou 5 treinos em uma semana</p>
                </div>
                <Badge className="bg-gold text-black">Novo!</Badge>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-hover">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Activity size={20} className="text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Consistência</p>
                  <p className="text-sm text-foreground-secondary">10 treinos consecutivos</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-hover">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Scale size={20} className="text-purple-500" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Avaliação Completa</p>
                  <p className="text-sm text-foreground-secondary">Primeira avaliação registrada</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock size={20} className="text-gold" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.recentActivity.length === 0 ? (
              <div className="text-center py-12">
                <Activity size={48} className="text-foreground-muted mx-auto mb-4" />
                <p className="text-foreground-secondary">Nenhuma atividade recente</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {analytics.recentActivity.map((activity) => (
                  <div key={`${activity.type}-${activity.id}`} className="flex items-start gap-3 p-3 rounded-lg bg-surface-hover">
                    <div className="mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{activity.description}</p>
                          <p className="text-xs text-foreground-secondary">
                            Por: {activity.professional}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-foreground-muted">
                            {formatDate(activity.date)}
                          </p>
                          <Badge variant="outline" size="sm">
                            {activity.type === 'assessment' ? 'Avaliação' : 'Treino'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}