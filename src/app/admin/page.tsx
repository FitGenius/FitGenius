'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Activity,
  TrendingUp,
  Calendar,
  Settings,
  BarChart3,
  UserPlus,
  Bell,
  Shield,
  CreditCard,
  Building,
  Zap
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface TenantStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  totalWorkouts: number;
  averageWorkoutsPerUser: number;
  retentionRate: number;
  subscriptionPlan: string;
  subscriptionStatus: string;
  nextBilling: string;
  features: string[];
}

interface UserActivity {
  date: string;
  activeUsers: number;
  newRegistrations: number;
  workoutsCompleted: number;
}

const MOCK_TENANT_STATS: TenantStats = {
  totalUsers: 342,
  activeUsers: 287,
  newUsersThisMonth: 45,
  totalWorkouts: 2847,
  averageWorkoutsPerUser: 8.3,
  retentionRate: 84.2,
  subscriptionPlan: 'Enterprise',
  subscriptionStatus: 'active',
  nextBilling: '2024-02-15',
  features: ['AI Assistant', 'Advanced Analytics', 'White Label', 'API Access', 'Priority Support'],
};

const MOCK_ACTIVITY_DATA: UserActivity[] = [
  { date: '2024-01-01', activeUsers: 245, newRegistrations: 12, workoutsCompleted: 180 },
  { date: '2024-01-02', activeUsers: 267, newRegistrations: 8, workoutsCompleted: 195 },
  { date: '2024-01-03', activeUsers: 289, newRegistrations: 15, workoutsCompleted: 210 },
  { date: '2024-01-04', activeUsers: 254, newRegistrations: 6, workoutsCompleted: 165 },
  { date: '2024-01-05', activeUsers: 298, newRegistrations: 18, workoutsCompleted: 225 },
  { date: '2024-01-06', activeUsers: 312, newRegistrations: 22, workoutsCompleted: 240 },
  { date: '2024-01-07', activeUsers: 287, newRegistrations: 14, workoutsCompleted: 200 },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<TenantStats>(MOCK_TENANT_STATS);
  const [activityData, setActivityData] = useState<UserActivity[]>(MOCK_ACTIVITY_DATA);
  const [timeRange, setTimeRange] = useState('7d');

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const userActivityChart = {
    labels: activityData.map(d => new Date(d.date).toLocaleDateString('pt-BR')),
    datasets: [
      {
        label: 'Usuários Ativos',
        data: activityData.map(d => d.activeUsers),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.1,
      },
      {
        label: 'Novos Registros',
        data: activityData.map(d => d.newRegistrations),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.1,
      },
    ],
  };

  const workoutChart = {
    labels: activityData.map(d => new Date(d.date).toLocaleDateString('pt-BR')),
    datasets: [
      {
        label: 'Treinos Realizados',
        data: activityData.map(d => d.workoutsCompleted),
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  const subscriptionChart = {
    labels: ['Plano Básico', 'Plano Pro', 'Plano Enterprise'],
    datasets: [
      {
        data: [120, 180, 42],
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
        ],
        borderColor: [
          'rgba(99, 102, 241, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(34, 197, 94, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">SmartFit Academia - Centro</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={stats.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
              {stats.subscriptionPlan}
            </Badge>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
            <Button size="sm">
              <UserPlus className="w-4 h-4 mr-2" />
              Convidar Usuário
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="billing">Cobrança</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="support">Suporte</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+{stats.newUsersThisMonth}</span> este mês
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% do total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Treinos</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalWorkouts}</div>
                <p className="text-xs text-muted-foreground">
                  Média {stats.averageWorkoutsPerUser}/usuário
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Retenção</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.retentionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+2.1%</span> vs. mês anterior
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Atividade dos Usuários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Line data={userActivityChart} options={chartOptions} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Treinos por Dia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Bar data={workoutChart} options={chartOptions} />
              </CardContent>
            </Card>
          </div>

          {/* Features & Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Recursos Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {stats.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Status da Conta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Plano:</span>
                  <Badge variant="default">{stats.subscriptionPlan}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge variant={stats.subscriptionStatus === 'active' ? 'default' : 'destructive'}>
                    {stats.subscriptionStatus === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Próxima Cobrança:</span>
                  <span className="text-sm font-medium">{stats.nextBilling}</span>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Gerenciar Cobrança
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Usuários</CardTitle>
              <p className="text-gray-600">Gerencie usuários, convites e permissões</p>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <Button size="sm">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Convidar Usuário
                  </Button>
                  <Button variant="outline" size="sm">
                    Importar CSV
                  </Button>
                </div>
                <div className="text-sm text-gray-600">
                  {stats.activeUsers} / {stats.totalUsers} usuários ativos
                </div>
              </div>

              {/* User Management Table would go here */}
              <div className="border rounded-lg p-8 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">Tabela de Usuários</h3>
                <p className="text-sm">Lista completa de usuários com filtros e ações seria exibida aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Planos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full max-w-md mx-auto">
                  <Pie data={subscriptionChart} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas Avançadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tempo Médio de Sessão:</span>
                  <span className="text-sm font-medium">24min 32s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Frequência de Uso:</span>
                  <span className="text-sm font-medium">4.2x/semana</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Feature Mais Usada:</span>
                  <span className="text-sm font-medium">AI Assistant (89%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Satisfação (NPS):</span>
                  <span className="text-sm font-medium text-green-600">+73</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Informações de Cobrança
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Plano Atual</h3>
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{stats.subscriptionPlan}</h4>
                        <p className="text-sm text-gray-600">Até {stats.totalUsers} usuários</p>
                      </div>
                      <Badge variant="default">Ativo</Badge>
                    </div>
                    <div className="text-2xl font-bold mb-1">$299/mês</div>
                    <p className="text-sm text-gray-600">Próxima cobrança em {stats.nextBilling}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Histórico de Pagamentos</h3>
                  <div className="space-y-2">
                    {[
                      { date: '01/01/2024', amount: '$299', status: 'Pago' },
                      { date: '01/12/2023', amount: '$299', status: 'Pago' },
                      { date: '01/11/2023', amount: '$299', status: 'Pago' },
                    ].map((payment, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <div className="font-medium">{payment.amount}</div>
                          <div className="text-sm text-gray-600">{payment.date}</div>
                        </div>
                        <Badge variant="outline">{payment.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Configurações da Academia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome da Academia</label>
                  <input
                    type="text"
                    defaultValue="SmartFit Academia - Centro"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Logo da Academia</label>
                  <div className="mt-1 flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                    <Button variant="outline" size="sm">Alterar Logo</Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Cor Primária</label>
                    <input
                      type="color"
                      defaultValue="#6366F1"
                      className="mt-1 w-full h-10 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Cor Secundária</label>
                    <input
                      type="color"
                      defaultValue="#8B5CF6"
                      className="mt-1 w-full h-10 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Suporte e Ajuda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Contato Direto</h3>
                  <div className="space-y-2">
                    <Button className="w-full justify-start">
                      <Bell className="w-4 h-4 mr-2" />
                      Abrir Ticket de Suporte
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Chat ao Vivo
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Agendar Chamada
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Recursos</h3>
                  <div className="space-y-2">
                    <a href="#" className="block text-blue-600 hover:underline">
                      📚 Base de Conhecimento
                    </a>
                    <a href="#" className="block text-blue-600 hover:underline">
                      🎥 Tutoriais em Vídeo
                    </a>
                    <a href="#" className="block text-blue-600 hover:underline">
                      📊 Relatórios de API
                    </a>
                    <a href="#" className="block text-blue-600 hover:underline">
                      🚀 Guia de Onboarding
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}