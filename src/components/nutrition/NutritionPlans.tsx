'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Utensils, Clock, User, Target, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Food {
  id: string;
  name: string;
  brand?: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

interface PlanFood {
  id: string;
  foodId: string;
  quantity: number;
  notes?: string;
  food: Food;
}

interface PlanMeal {
  id: string;
  name: string;
  time?: string;
  description?: string;
  foods: PlanFood[];
}

interface NutritionPlan {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  dailyCalories: number;
  dailyCarbs: number;
  dailyProtein: number;
  dailyFat: number;
  dailyFiber?: number;
  dailyWater?: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  createdBy: {
    user: {
      name: string;
    };
  };
  meals: PlanMeal[];
}

export function NutritionPlans() {
  const [plans, setPlans] = useState<NutritionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<NutritionPlan | null>(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/nutrition/plans');

      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
      } else {
        console.error('Error fetching nutrition plans');
        setPlans([]);
      }
    } catch (error) {
      console.error('Error fetching nutrition plans:', error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const calculateMealNutrition = (foods: PlanFood[]) => {
    let totalCalories = 0;
    let totalCarbs = 0;
    let totalProtein = 0;
    let totalFat = 0;

    foods.forEach(planFood => {
      const ratio = planFood.quantity / 100;
      totalCalories += planFood.food.calories * ratio;
      totalCarbs += planFood.food.carbs * ratio;
      totalProtein += planFood.food.protein * ratio;
      totalFat += planFood.food.fat * ratio;
    });

    return {
      calories: Math.round(totalCalories),
      carbs: Math.round(totalCarbs * 10) / 10,
      protein: Math.round(totalProtein * 10) / 10,
      fat: Math.round(totalFat * 10) / 10
    };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-muted-foreground">Carregando planos nutricionais...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Utensils className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Nenhum Plano Ativo
            </h3>
            <p className="text-muted-foreground mb-6">
              Você ainda não possui nenhum plano alimentar personalizado.
              <br />Entre em contato com seu profissional para receber um plano.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <Card className="border-gold/20">
                <CardContent className="pt-6 text-center">
                  <Target className="w-8 h-8 text-gold mx-auto mb-2" />
                  <div className="font-medium text-foreground mb-1">Objetivos Claros</div>
                  <div className="text-xs text-muted-foreground">
                    Planos baseados em seus objetivos pessoais
                  </div>
                </CardContent>
              </Card>
              <Card className="border-blue-500/20">
                <CardContent className="pt-6 text-center">
                  <User className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <div className="font-medium text-foreground mb-1">Acompanhamento</div>
                  <div className="text-xs text-muted-foreground">
                    Orientação profissional personalizada
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedPlan) {
    return (
      <div className="space-y-6">
        {/* Header do plano */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-gold" />
                  {selectedPlan.title}
                  {selectedPlan.isActive && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      Ativo
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Criado por {selectedPlan.createdBy.user.name} em{' '}
                  {new Date(selectedPlan.createdAt).toLocaleDateString('pt-BR')}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedPlan(null)}
              >
                Voltar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {selectedPlan.description && (
              <p className="text-muted-foreground mb-4">{selectedPlan.description}</p>
            )}

            {/* Metas nutricionais */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-gold/10 rounded-lg">
                <div className="text-lg font-bold text-gold">{selectedPlan.dailyCalories}</div>
                <div className="text-xs text-muted-foreground">Calorias/dia</div>
              </div>
              <div className="text-center p-3 bg-orange-500/10 rounded-lg">
                <div className="text-lg font-bold text-orange-500">{selectedPlan.dailyCarbs}g</div>
                <div className="text-xs text-muted-foreground">Carboidratos</div>
              </div>
              <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                <div className="text-lg font-bold text-blue-500">{selectedPlan.dailyProtein}g</div>
                <div className="text-xs text-muted-foreground">Proteínas</div>
              </div>
              <div className="text-center p-3 bg-green-500/10 rounded-lg">
                <div className="text-lg font-bold text-green-500">{selectedPlan.dailyFat}g</div>
                <div className="text-xs text-muted-foreground">Gorduras</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Refeições do plano */}
        <div className="space-y-4">
          {selectedPlan.meals.map((meal, index) => {
            const mealNutrition = calculateMealNutrition(meal.foods);
            return (
              <motion.div
                key={meal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {meal.time && <Clock className="w-4 h-4 text-gold" />}
                        <span>{meal.name}</span>
                        {meal.time && (
                          <Badge variant="outline" className="text-xs">
                            {meal.time}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm font-normal text-muted-foreground">
                        {mealNutrition.calories} kcal
                      </div>
                    </CardTitle>
                    {meal.description && (
                      <CardDescription>{meal.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {meal.foods.map((planFood) => (
                        <div
                          key={planFood.id}
                          className="flex items-center justify-between p-3 border border-border rounded-lg"
                        >
                          <div>
                            <div className="font-medium text-foreground">{planFood.food.name}</div>
                            {planFood.food.brand && (
                              <div className="text-sm text-muted-foreground">{planFood.food.brand}</div>
                            )}
                            {planFood.notes && (
                              <div className="text-sm text-blue-600 mt-1">
                                📝 {planFood.notes}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-foreground">{planFood.quantity}g</div>
                            <div className="text-xs text-muted-foreground">
                              {Math.round(planFood.food.calories * (planFood.quantity / 100))} kcal
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Totais da refeição */}
                    <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                      <div className="grid grid-cols-4 gap-4 text-center text-xs">
                        <div>
                          <div className="font-medium text-foreground">{mealNutrition.calories}</div>
                          <div className="text-muted-foreground">kcal</div>
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{mealNutrition.carbs}g</div>
                          <div className="text-muted-foreground">carb</div>
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{mealNutrition.protein}g</div>
                          <div className="text-muted-foreground">prot</div>
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{mealNutrition.fat}g</div>
                          <div className="text-muted-foreground">gord</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Notas do plano */}
        {selectedPlan.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-500" />
                Observações do Profissional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-line">{selectedPlan.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lista de planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`cursor-pointer transition-all hover:shadow-md ${
              plan.isActive ? 'border-green-500/50 bg-green-50/50' : ''
            }`} onClick={() => setSelectedPlan(plan)}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-gold" />
                    {plan.title}
                  </span>
                  {plan.isActive && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                </CardTitle>
                <CardDescription>
                  Por {plan.createdBy.user.name} • {new Date(plan.createdAt).toLocaleDateString('pt-BR')}
                  {plan.duration && ` • ${plan.duration} dias`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {plan.description && (
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {plan.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-gold/10 rounded">
                    <div className="font-bold text-gold text-lg">{plan.dailyCalories}</div>
                    <div className="text-xs text-muted-foreground">kcal/dia</div>
                  </div>
                  <div className="text-center p-2 bg-blue-500/10 rounded">
                    <div className="font-bold text-blue-500 text-lg">{plan.meals.length}</div>
                    <div className="text-xs text-muted-foreground">refeições</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}