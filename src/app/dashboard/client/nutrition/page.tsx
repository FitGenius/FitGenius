"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Apple,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  ChefHat,
  Plus,
  CheckCircle2
} from 'lucide-react';

export default function ClientNutritionPage() {
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);

  // Mock data for demo
  const dailyTargets = {
    calories: { current: 1850, target: 2200 },
    protein: { current: 125, target: 150 },
    carbs: { current: 180, target: 220 },
    fat: { current: 65, target: 80 }
  };

  const meals = [
    {
      id: '1',
      name: 'Café da Manhã',
      time: '08:00',
      completed: true,
      calories: 450,
      foods: [
        { name: 'Aveia com banana', quantity: '1 porção', calories: 280 },
        { name: 'Whey protein', quantity: '30g', calories: 120 },
        { name: 'Castanha do Pará', quantity: '3 unidades', calories: 50 }
      ]
    },
    {
      id: '2',
      name: 'Lanche da Manhã',
      time: '10:30',
      completed: true,
      calories: 200,
      foods: [
        { name: 'Maçã', quantity: '1 unidade média', calories: 80 },
        { name: 'Amendoim', quantity: '15g', calories: 120 }
      ]
    },
    {
      id: '3',
      name: 'Almoço',
      time: '12:30',
      completed: false,
      calories: 650,
      foods: [
        { name: 'Arroz integral', quantity: '150g', calories: 180 },
        { name: 'Peito de frango grelhado', quantity: '150g', calories: 250 },
        { name: 'Feijão preto', quantity: '100g', calories: 130 },
        { name: 'Salada verde', quantity: '1 porção', calories: 50 },
        { name: 'Azeite extra virgem', quantity: '1 colher sopa', calories: 40 }
      ]
    },
    {
      id: '4',
      name: 'Lanche da Tarde',
      time: '15:30',
      completed: false,
      calories: 300,
      foods: [
        { name: 'Iogurte grego natural', quantity: '200g', calories: 150 },
        { name: 'Granola caseira', quantity: '30g', calories: 150 }
      ]
    },
    {
      id: '5',
      name: 'Jantar',
      time: '19:00',
      completed: false,
      calories: 550,
      foods: [
        { name: 'Salmão grelhado', quantity: '120g', calories: 250 },
        { name: 'Batata doce assada', quantity: '150g', calories: 130 },
        { name: 'Brócolis refogado', quantity: '100g', calories: 35 },
        { name: 'Quinoa', quantity: '80g', calories: 135 }
      ]
    },
    {
      id: '6',
      name: 'Ceia',
      time: '21:30',
      completed: false,
      calories: 250,
      foods: [
        { name: 'Cottage cheese', quantity: '100g', calories: 130 },
        { name: 'Nozes', quantity: '20g', calories: 120 }
      ]
    }
  ];

  const getProgressColor = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 90) return 'text-green-400';
    if (percentage >= 70) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getProgressValue = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Nutrição</h1>
          <p className="text-foreground-secondary mt-1">
            Acompanhe sua alimentação e atinja suas metas nutricionais
          </p>
        </div>
        <Button className="bg-gold text-black hover:bg-gold-dark">
          <Plus size={16} className="mr-2" />
          Adicionar Refeição
        </Button>
      </div>

      {/* Daily Targets Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-border bg-surface">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">Calorias</p>
                <p className={`text-2xl font-bold ${getProgressColor(dailyTargets.calories.current, dailyTargets.calories.target)}`}>
                  {dailyTargets.calories.current}
                </p>
                <p className="text-xs text-foreground-secondary">
                  de {dailyTargets.calories.target} kcal
                </p>
              </div>
              <Target className="h-8 w-8 text-gold" />
            </div>
            <Progress
              value={getProgressValue(dailyTargets.calories.current, dailyTargets.calories.target)}
              className="h-2"
            />
          </CardContent>
        </Card>

        <Card className="border-border bg-surface">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">Proteínas</p>
                <p className={`text-2xl font-bold ${getProgressColor(dailyTargets.protein.current, dailyTargets.protein.target)}`}>
                  {dailyTargets.protein.current}g
                </p>
                <p className="text-xs text-foreground-secondary">
                  de {dailyTargets.protein.target}g
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-400" />
            </div>
            <Progress
              value={getProgressValue(dailyTargets.protein.current, dailyTargets.protein.target)}
              className="h-2"
            />
          </CardContent>
        </Card>

        <Card className="border-border bg-surface">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">Carboidratos</p>
                <p className={`text-2xl font-bold ${getProgressColor(dailyTargets.carbs.current, dailyTargets.carbs.target)}`}>
                  {dailyTargets.carbs.current}g
                </p>
                <p className="text-xs text-foreground-secondary">
                  de {dailyTargets.carbs.target}g
                </p>
              </div>
              <Apple className="h-8 w-8 text-green-400" />
            </div>
            <Progress
              value={getProgressValue(dailyTargets.carbs.current, dailyTargets.carbs.target)}
              className="h-2"
            />
          </CardContent>
        </Card>

        <Card className="border-border bg-surface">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">Gorduras</p>
                <p className={`text-2xl font-bold ${getProgressColor(dailyTargets.fat.current, dailyTargets.fat.target)}`}>
                  {dailyTargets.fat.current}g
                </p>
                <p className="text-xs text-foreground-secondary">
                  de {dailyTargets.fat.target}g
                </p>
              </div>
              <ChefHat className="h-8 w-8 text-orange-400" />
            </div>
            <Progress
              value={getProgressValue(dailyTargets.fat.current, dailyTargets.fat.target)}
              className="h-2"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meals Timeline */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Refeições de Hoje</h2>

          {meals.map((meal) => (
            <Card
              key={meal.id}
              className={`border-border cursor-pointer transition-all hover:border-gold/30 ${
                selectedMeal === meal.id ? 'border-gold bg-gold/5' : 'bg-surface'
              }`}
              onClick={() => setSelectedMeal(meal.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${meal.completed ? 'bg-green-400' : 'bg-border'}`} />
                    <div>
                      <h3 className="font-semibold">{meal.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-foreground-secondary">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {meal.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target size={14} />
                          {meal.calories} kcal
                        </span>
                      </div>
                    </div>
                  </div>

                  {meal.completed ? (
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                      <CheckCircle2 size={12} className="mr-1" />
                      Concluída
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      Pendente
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-foreground-secondary">
                    {meal.foods.length} itens
                  </div>

                  {!meal.completed && (
                    <Button size="sm" className="bg-gold text-black hover:bg-gold-dark">
                      <CheckCircle2 size={14} className="mr-1" />
                      Marcar como feita
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Meal Details */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Detalhes da Refeição</h2>

          {selectedMeal ? (
            <Card className="border-border bg-surface">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="text-gold" size={20} />
                  {meals.find(m => m.id === selectedMeal)?.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-foreground-secondary">Horário</p>
                    <p className="font-medium">{meals.find(m => m.id === selectedMeal)?.time}</p>
                  </div>
                  <div>
                    <p className="text-foreground-secondary">Total de calorias</p>
                    <p className="font-medium text-gold">{meals.find(m => m.id === selectedMeal)?.calories} kcal</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Alimentos:</h4>
                  {meals.find(m => m.id === selectedMeal)?.foods.map((food, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                      <div>
                        <p className="font-medium">{food.name}</p>
                        <p className="text-sm text-foreground-secondary">{food.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gold">{food.calories} kcal</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1 bg-gold text-black hover:bg-gold-dark">
                    <CheckCircle2 size={16} className="mr-2" />
                    Marcar como Consumida
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Plus size={16} className="mr-2" />
                    Editar Refeição
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border bg-surface">
              <CardContent className="p-12 text-center">
                <ChefHat className="mx-auto h-12 w-12 text-foreground-muted mb-4" />
                <h3 className="text-lg font-medium mb-2">Selecione uma refeição</h3>
                <p className="text-foreground-secondary">
                  Clique em uma refeição da lista para ver os detalhes e alimentos
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="border-border bg-surface">
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Plus size={20} />
              <span className="text-sm">Adicionar Alimento</span>
            </Button>

            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Calendar size={20} />
              <span className="text-sm">Planejar Semana</span>
            </Button>

            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <TrendingUp size={20} />
              <span className="text-sm">Ver Relatório</span>
            </Button>

            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Target size={20} />
              <span className="text-sm">Ajustar Metas</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}