import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Users, Dumbbell, Target, TrendingUp, Calendar, MessageCircle } from 'lucide-react';
import { PlanLimitsCard } from '@/components/PlanLimitsCard';

export default function ProfessionalDashboard() {
  const stats = [
    {
      title: 'Clientes Ativos',
      value: '24',
      description: '+2 este mês',
      icon: Users,
      trend: 'up'
    },
    {
      title: 'Treinos Prescritos',
      value: '147',
      description: '+12 esta semana',
      icon: Dumbbell,
      trend: 'up'
    },
    {
      title: 'Planos Nutricionais',
      value: '18',
      description: '+3 este mês',
      icon: Target,
      trend: 'up'
    },
    {
      title: 'Taxa de Aderência',
      value: '87%',
      description: '+5% vs mês anterior',
      icon: TrendingUp,
      trend: 'up'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'workout',
      message: 'Maria Silva completou treino de peito e tríceps',
      time: '2 horas atrás',
      client: 'Maria Silva'
    },
    {
      id: 2,
      type: 'nutrition',
      message: 'João Santos registrou refeição do almoço',
      time: '4 horas atrás',
      client: 'João Santos'
    },
    {
      id: 3,
      type: 'message',
      message: 'Ana Costa enviou uma mensagem',
      time: '6 horas atrás',
      client: 'Ana Costa'
    },
    {
      id: 4,
      type: 'assessment',
      message: 'Carlos Lima agendou avaliação física',
      time: '1 dia atrás',
      client: 'Carlos Lima'
    }
  ];

  const upcomingAppointments = [
    {
      id: 1,
      client: 'Maria Silva',
      type: 'Avaliação Física',
      time: '09:00',
      date: 'Hoje'
    },
    {
      id: 2,
      client: 'João Santos',
      type: 'Consulta Nutricional',
      time: '14:30',
      date: 'Hoje'
    },
    {
      id: 3,
      client: 'Ana Costa',
      type: 'Reavaliação',
      time: '10:00',
      date: 'Amanhã'
    }
  ];

  return (
    <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-foreground-secondary">Bem-vindo de volta! Aqui está o resumo da sua prática.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground-secondary">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-accent-success">{stat.description}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                  <stat.icon size={24} className="text-gold" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp size={20} className="text-gold" />
                Atividades Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-surface-hover">
                    <div className="w-2 h-2 rounded-full bg-gold mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{activity.message}</p>
                      <p className="text-xs text-foreground-muted">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar size={20} className="text-gold" />
                Próximos Agendamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-hover">
                    <div>
                      <p className="font-medium text-foreground">{appointment.client}</p>
                      <p className="text-sm text-foreground-secondary">{appointment.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gold">{appointment.time}</p>
                      <p className="text-xs text-foreground-muted">{appointment.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Plan Limits */}
          <PlanLimitsCard />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-surface-hover transition-colors">
                <Users size={20} className="text-gold" />
                <div className="text-left">
                  <p className="font-medium">Adicionar Cliente</p>
                  <p className="text-sm text-foreground-secondary">Cadastrar novo cliente</p>
                </div>
              </button>
              <button className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-surface-hover transition-colors">
                <Dumbbell size={20} className="text-gold" />
                <div className="text-left">
                  <p className="font-medium">Criar Treino</p>
                  <p className="text-sm text-foreground-secondary">Prescrever novo treino</p>
                </div>
              </button>
              <button className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-surface-hover transition-colors">
                <Target size={20} className="text-gold" />
                <div className="text-left">
                  <p className="font-medium">Plano Nutricional</p>
                  <p className="text-sm text-foreground-secondary">Criar dieta personalizada</p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}