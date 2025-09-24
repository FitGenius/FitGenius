import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Plus, Search, Filter, MoreVertical, Apple, Calculator, ChefHat } from 'lucide-react';

export default function NutritionPage() {
  const nutritionPlans = [
    {
      id: 1,
      name: 'Dieta de Emagrecimento',
      client: 'Maria Silva',
      calories: 1800,
      protein: 120,
      carbs: 180,
      fats: 60,
      meals: 5,
      status: 'Ativo',
      adherence: 85,
      createdAt: '15/03/2024'
    },
    {
      id: 2,
      name: 'Bulking Clean',
      client: 'João Santos',
      calories: 3200,
      protein: 180,
      carbs: 400,
      fats: 100,
      meals: 6,
      status: 'Ativo',
      adherence: 92,
      createdAt: '10/03/2024'
    },
    {
      id: 3,
      name: 'Dieta Balanceada',
      client: 'Ana Costa',
      calories: 2200,
      protein: 130,
      carbs: 250,
      fats: 80,
      meals: 4,
      status: 'Revisão',
      adherence: 78,
      createdAt: '20/03/2024'
    }
  ];

  const foodLibrary = [
    {
      id: 1,
      name: 'Frango Grelhado',
      category: 'Proteína',
      calories: 165,
      protein: 31,
      carbs: 0,
      fats: 3.6,
      portion: '100g'
    },
    {
      id: 2,
      name: 'Arroz Integral',
      category: 'Carboidrato',
      calories: 123,
      protein: 2.6,
      carbs: 25,
      fats: 0.9,
      portion: '100g'
    },
    {
      id: 3,
      name: 'Abacate',
      category: 'Gordura',
      calories: 160,
      protein: 2,
      carbs: 9,
      fats: 15,
      portion: '100g'
    },
    {
      id: 4,
      name: 'Batata Doce',
      category: 'Carboidrato',
      calories: 86,
      protein: 1.6,
      carbs: 20,
      fats: 0.1,
      portion: '100g'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo':
        return 'text-accent-success bg-accent-success/10';
      case 'Revisão':
        return 'text-accent-warning bg-accent-warning/10';
      case 'Pausado':
        return 'text-accent-error bg-accent-error/10';
      default:
        return 'text-foreground-secondary bg-surface';
    }
  };

  const getAdherenceColor = (adherence: number) => {
    if (adherence >= 80) return 'text-accent-success';
    if (adherence >= 60) return 'text-accent-warning';
    return 'text-accent-error';
  };

  return (
    <DashboardLayout userType="professional">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Planos Nutricionais</h1>
            <p className="text-foreground-secondary">Crie e gerencie dietas personalizadas para seus clientes</p>
          </div>
          <Button className="gap-2">
            <Plus size={16} />
            Novo Plano
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-muted" />
                <input
                  type="text"
                  placeholder="Buscar planos nutricionais..."
                  className="pl-10 pr-4 py-2 w-full rounded-lg border border-border bg-surface"
                />
              </div>

              <Select>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="review">Revisão</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  <SelectItem value="maria">Maria Silva</SelectItem>
                  <SelectItem value="joao">João Santos</SelectItem>
                  <SelectItem value="ana">Ana Costa</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon">
                <Filter size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Nutrition Plans List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold">Planos Ativos</h2>

            {nutritionPlans.map((plan) => (
              <Card key={plan.id} className="hover:border-gold/20 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                      <p className="text-sm text-foreground-secondary">{plan.client}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                        {plan.status}
                      </span>
                      <Button variant="ghost" size="icon">
                        <MoreVertical size={16} />
                      </Button>
                    </div>
                  </div>

                  {/* Macros Overview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 rounded-lg bg-surface-hover">
                      <p className="text-sm text-foreground-muted">Calorias</p>
                      <p className="text-lg font-bold text-foreground">{plan.calories}</p>
                      <p className="text-xs text-foreground-secondary">kcal</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-surface-hover">
                      <p className="text-sm text-foreground-muted">Proteína</p>
                      <p className="text-lg font-bold text-nutrition-protein">{plan.protein}g</p>
                      <p className="text-xs text-foreground-secondary">{Math.round((plan.protein * 4 / plan.calories) * 100)}%</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-surface-hover">
                      <p className="text-sm text-foreground-muted">Carboidratos</p>
                      <p className="text-lg font-bold text-nutrition-carbs">{plan.carbs}g</p>
                      <p className="text-xs text-foreground-secondary">{Math.round((plan.carbs * 4 / plan.calories) * 100)}%</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-surface-hover">
                      <p className="text-sm text-foreground-muted">Gorduras</p>
                      <p className="text-lg font-bold text-nutrition-fats">{plan.fats}g</p>
                      <p className="text-xs text-foreground-secondary">{Math.round((plan.fats * 9 / plan.calories) * 100)}%</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm mb-4">
                    <div>
                      <span className="text-foreground-muted">Refeições: </span>
                      <span className="font-medium">{plan.meals}/dia</span>
                    </div>
                    <div>
                      <span className="text-foreground-muted">Aderência: </span>
                      <span className={`font-bold ${getAdherenceColor(plan.adherence)}`}>
                        {plan.adherence}%
                      </span>
                    </div>
                    <div>
                      <span className="text-foreground-muted">Criado em: </span>
                      <span className="font-medium">{plan.createdAt}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Editar
                    </Button>
                    <Button variant="outline" size="sm">
                      Duplicar
                    </Button>
                    <Button variant="outline" size="sm">
                      Relatório
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tools and Library */}
          <div className="space-y-6">
            {/* Macro Calculator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator size={20} className="text-gold" />
                  Calculadora de Macros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Peso (kg)</label>
                    <input
                      type="number"
                      placeholder="70"
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-surface"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Objetivo</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weight-loss">Perda de peso</SelectItem>
                        <SelectItem value="maintenance">Manutenção</SelectItem>
                        <SelectItem value="muscle-gain">Ganho de massa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full">
                    Calcular Macros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Food Library */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Apple size={20} className="text-gold" />
                  Biblioteca de Alimentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {foodLibrary.map((food) => (
                    <div
                      key={food.id}
                      className="p-3 rounded-lg border border-border hover:border-gold/20 transition-colors cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-foreground">{food.name}</h4>
                        <span className="text-xs px-2 py-1 rounded-full bg-surface text-foreground-secondary">
                          {food.category}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-foreground-secondary">
                        <span>{food.calories} kcal</span>
                        <span>P: {food.protein}g</span>
                        <span>C: {food.carbs}g</span>
                        <span>G: {food.fats}g</span>
                      </div>
                      <p className="text-xs text-foreground-muted mt-1">Por {food.portion}</p>
                    </div>
                  ))}

                  <Button variant="outline" className="w-full mt-4">
                    Ver Todos os Alimentos
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat size={20} className="text-gold" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Target size={16} className="mr-2" />
                    Modelo de Emagrecimento
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Target size={16} className="mr-2" />
                    Modelo de Bulking
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Target size={16} className="mr-2" />
                    Modelo Vegetariano
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Target size={16} className="mr-2" />
                    Dieta Low Carb
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}