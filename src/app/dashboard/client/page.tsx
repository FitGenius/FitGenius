import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Dumbbell, Target, TrendingUp, Calendar, Award, Activity } from 'lucide-react';

export default function ClientDashboard() {
  const stats = [
    {
      title: 'Treinos Concluídos',
      value: '28',
      description: 'Este mês',
      icon: Dumbbell,
      trend: 'up'
    },
    {
      title: 'Calorias Queimadas',
      value: '12.5k',
      description: 'Esta semana',
      icon: Activity,
      trend: 'up'
    },
    {
      title: 'Peso Atual',
      value: '72.3kg',
      description: '-2.1kg este mês',
      icon: TrendingUp,
      trend: 'down'
    },
    {
      title: 'Conquistas',
      value: '15',
      description: '+3 novas',
      icon: Award,
      trend: 'up'
    }
  ];

  const todaysWorkout = {
    name: 'Treino A - Peito e Tríceps',
    exercises: [
      { name: 'Supino Reto', sets: '4x12', completed: false },
      { name: 'Supino Inclinado', sets: '3x10', completed: false },
      { name: 'Crucifixo', sets: '3x15', completed: false },
      { name: 'Tríceps Pulley', sets: '4x12', completed: false },
      { name: 'Tríceps Francês', sets: '3x10', completed: false },
    ]
  };

  const nutritionPlan = {
    totalCalories: 2200,
    consumedCalories: 1450,
    protein: { target: 165, consumed: 98 },
    carbs: { target: 275, consumed: 180 },
    fats: { target: 73, consumed: 45 }
  };

  const recentAchievements = [
    {
      id: 1,
      title: 'Constância',
      description: '7 dias seguidos de treino',
      icon: '🔥',
      earnedAt: 'Ontem'
    },
    {
      id: 2,
      title: 'Meta de Peso',
      description: 'Perdeu 2kg este mês',
      icon: '⚖️',
      earnedAt: '3 dias atrás'
    },
    {
      id: 3,
      title: 'Disciplina Nutricional',
      description: '5 dias seguindo a dieta',
      icon: '🥗',
      earnedAt: '1 semana atrás'
    }
  ];

  return (
    <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Olá, Maria! 👋</h1>
          <p className="text-foreground-secondary">Pronta para mais um dia de conquistas?</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground-secondary">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className={`text-xs ${stat.trend === 'up' ? 'text-accent-success' : 'text-accent-warning'}`}>
                    {stat.description}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                  <stat.icon size={24} className="text-gold" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Workout */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell size={20} className="text-gold" />
                Treino de Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">{todaysWorkout.name}</h3>
                <div className="space-y-3">
                  {todaysWorkout.exercises.map((exercise, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-surface-hover">
                      <div>
                        <p className="font-medium text-foreground">{exercise.name}</p>
                        <p className="text-sm text-foreground-secondary">{exercise.sets}</p>
                      </div>
                      <div className="w-6 h-6 rounded-full border-2 border-gold"></div>
                    </div>
                  ))}
                </div>
                <button className="w-full bg-gold text-black font-medium py-3 rounded-lg hover:bg-gold-dark transition-colors">
                  Iniciar Treino
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Nutrition Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target size={20} className="text-gold" />
                Progresso Nutricional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Calories */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Calorias</span>
                    <span className="text-sm text-foreground-secondary">
                      {nutritionPlan.consumedCalories} / {nutritionPlan.totalCalories} kcal
                    </span>
                  </div>
                  <div className="w-full bg-surface rounded-full h-2">
                    <div
                      className="bg-gold h-2 rounded-full"
                      style={{ width: `${(nutritionPlan.consumedCalories / nutritionPlan.totalCalories) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Macros */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-medium text-foreground-secondary mb-1">Proteína</p>
                    <p className="text-sm font-medium">{nutritionPlan.protein.consumed}g / {nutritionPlan.protein.target}g</p>
                    <div className="w-full bg-surface rounded-full h-1 mt-1">
                      <div
                        className="bg-nutrition-protein h-1 rounded-full"
                        style={{ width: `${(nutritionPlan.protein.consumed / nutritionPlan.protein.target) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground-secondary mb-1">Carboidratos</p>
                    <p className="text-sm font-medium">{nutritionPlan.carbs.consumed}g / {nutritionPlan.carbs.target}g</p>
                    <div className="w-full bg-surface rounded-full h-1 mt-1">
                      <div
                        className="bg-nutrition-carbs h-1 rounded-full"
                        style={{ width: `${(nutritionPlan.carbs.consumed / nutritionPlan.carbs.target) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground-secondary mb-1">Gorduras</p>
                    <p className="text-sm font-medium">{nutritionPlan.fats.consumed}g / {nutritionPlan.fats.target}g</p>
                    <div className="w-full bg-surface rounded-full h-1 mt-1">
                      <div
                        className="bg-nutrition-fats h-1 rounded-full"
                        style={{ width: `${(nutritionPlan.fats.consumed / nutritionPlan.fats.target) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award size={20} className="text-gold" />
              Conquistas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentAchievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center gap-3 p-4 rounded-lg bg-surface-hover">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div>
                    <p className="font-medium text-foreground">{achievement.title}</p>
                    <p className="text-sm text-foreground-secondary">{achievement.description}</p>
                    <p className="text-xs text-foreground-muted">{achievement.earnedAt}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
    </div>
  );
}