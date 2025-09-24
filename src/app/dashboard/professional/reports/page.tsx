'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Scale,
  Clock,
  Download,
  Filter
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AnalyticsData {
  stats: {
    totalClients: number;
    activeClients: number;
    totalWorkouts: number;
    totalAssessments: number;
    thisMonthAssessments: number;
    thisMonthWorkouts: number;
    assessmentGrowth: number;
    workoutGrowth: number;
  };
  recentActivity: Array<{
    type: string;
    id: string;
    date: string;
    client: string;
    description: string;
  }>;
}

export default function ProfessionalReportsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

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
        return <Scale size={16} className="text-blue-500" />;
      case 'workout':
        return <Activity size={16} className="text-green-500" />;
      default:
        return <Target size={16} className="text-gold" />;
    }
  };

  const getGrowthColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-foreground-secondary';
  };

  const getGrowthIcon = (value: number) => {
    if (value > 0) return <TrendingUp size={16} className="text-green-600" />;
    if (value < 0) return <TrendingDown size={16} className="text-red-600" />;
    return null;
  };

  // Dados fictícios para gráficos
  const monthlyData = [
    { name: 'Jan', assessments: 12, workouts: 28 },
    { name: 'Fev', assessments: 15, workouts: 32 },
    { name: 'Mar', assessments: 18, workouts: 45 },
    { name: 'Abr', assessments: 22, workouts: 52 },
    { name: 'Mai', assessments: 25, workouts: 58 },
    { name: 'Jun', assessments: analytics?.stats.thisMonthAssessments || 30, workouts: analytics?.stats.thisMonthWorkouts || 65 }
  ];

  const clientActivityData = [
    { name: 'Muito Ativo', value: Math.round((analytics?.stats.activeClients || 0) * 0.4), color: '#22c55e' },
    { name: 'Moderado', value: Math.round((analytics?.stats.activeClients || 0) * 0.4), color: '#ffd700' },
    { name: 'Pouco Ativo', value: Math.round((analytics?.stats.activeClients || 0) * 0.2), color: '#f59e0b' },
    { name: 'Inativo', value: (analytics?.stats.totalClients || 0) - (analytics?.stats.activeClients || 0), color: '#ef4444' }
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full mx-auto"></div>
          <p className="text-foreground-secondary mt-4">Carregando relatórios...</p>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios & Analytics</h1>
          <p className="text-foreground-secondary">
            Acompanhe o desempenho do seu negócio e o progresso dos seus clientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter size={16} className="mr-2" />
            Filtros
          </Button>
          <Button variant="outline" size="sm">
            <Download size={16} className="mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">Total de Clientes</p>
                <p className="text-2xl font-bold text-foreground">{analytics.stats.totalClients}</p>
                <p className="text-xs text-foreground-muted">
                  {analytics.stats.activeClientes} ativos
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users size={24} className="text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">Avaliações</p>
                <p className="text-2xl font-bold text-foreground">{analytics.stats.thisMonthAssessments}</p>
                <div className="flex items-center gap-1">
                  {getGrowthIcon(analytics.stats.assessmentGrowth)}
                  <span className={`text-xs ${getGrowthColor(analytics.stats.assessmentGrowth)}`}>
                    {analytics.stats.assessmentGrowth > 0 ? '+' : ''}{analytics.stats.assessmentGrowth}%
                  </span>
                </div>
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
                <p className="text-sm font-medium text-foreground-secondary">Treinos Criados</p>
                <p className="text-2xl font-bold text-foreground">{analytics.stats.thisMonthWorkouts}</p>
                <div className="flex items-center gap-1">
                  {getGrowthIcon(analytics.stats.workoutGrowth)}
                  <span className={`text-xs ${getGrowthColor(analytics.stats.workoutGrowth)}`}>
                    {analytics.stats.workoutGrowth > 0 ? '+' : ''}{analytics.stats.workoutGrowth}%
                  </span>
                </div>
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
                <p className="text-sm font-medium text-foreground-secondary">Total Geral</p>
                <p className="text-2xl font-bold text-foreground">{analytics.stats.totalAssessments + analytics.stats.totalWorkouts}</p>
                <p className="text-xs text-foreground-muted">
                  Assessments + Workouts
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                <BarChart3 size={24} className="text-gold" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={20} className="text-gold" />
              Evolução Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '8px'
                    }}
                  />
                  <Line type="monotone" dataKey="assessments" stroke="#8b5cf6" strokeWidth={2} name="Avaliações" />
                  <Line type="monotone" dataKey="workouts" stroke="#10b981" strokeWidth={2} name="Treinos" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Client Activity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={20} className="text-gold" />
              Atividade dos Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={clientActivityData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {clientActivityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

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
            <div className="space-y-4">
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
                          Cliente: {activity.client}
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
  );
}