'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Trash2, Plus, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FoodSearch } from './FoodSearch';
import { cn } from '@/lib/utils';

interface Food {
  id: string;
  name: string;
  brand?: string;
  category: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  fiber?: number;
}

interface FoodEntry {
  id: string;
  quantity: number;
  meal: string;
  date: string;
  food: Food;
}

interface DiaryTotals {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  fiber: number;
}

interface DiaryData {
  date: string;
  entries: Record<string, FoodEntry[]>;
  totals: DiaryTotals;
}

const MEAL_LABELS = {
  BREAKFAST: 'Café da manhã',
  MORNING_SNACK: 'Lanche da manhã',
  LUNCH: 'Almoço',
  AFTERNOON_SNACK: 'Lanche da tarde',
  DINNER: 'Jantar',
  EVENING_SNACK: 'Ceia'
};

const MEAL_ORDER = ['BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER', 'EVENING_SNACK'];

export function FoodDiary() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [diaryData, setDiaryData] = useState<DiaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState('BREAKFAST');

  const fetchDiaryData = async (date: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/nutrition/diary?date=${date}`);

      if (response.ok) {
        const data = await response.json();
        setDiaryData(data);
      } else {
        console.error('Error fetching diary data');
        setDiaryData(null);
      }
    } catch (error) {
      console.error('Error fetching diary data:', error);
      setDiaryData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiaryData(selectedDate);
  }, [selectedDate]);

  const handleFoodSelect = async (food: Food, quantity: number, meal: string) => {
    try {
      const response = await fetch('/api/nutrition/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodId: food.id,
          quantity,
          meal,
          date: selectedDate
        })
      });

      if (response.ok) {
        fetchDiaryData(selectedDate);
        setShowFoodSearch(false);
      } else {
        alert('Erro ao adicionar alimento');
      }
    } catch (error) {
      console.error('Error adding food:', error);
      alert('Erro ao adicionar alimento');
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Deseja remover este alimento do diário?')) return;

    try {
      const response = await fetch(`/api/nutrition/diary?id=${entryId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchDiaryData(selectedDate);
      } else {
        alert('Erro ao remover alimento');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Erro ao remover alimento');
    }
  };

  const calculateEntryNutrition = (entry: FoodEntry) => {
    const ratio = entry.quantity / 100;
    return {
      calories: Math.round(entry.food.calories * ratio),
      carbs: Math.round(entry.food.carbs * ratio * 10) / 10,
      protein: Math.round(entry.food.protein * ratio * 10) / 10,
      fat: Math.round(entry.food.fat * ratio * 10) / 10,
      fiber: entry.food.fiber ? Math.round(entry.food.fiber * ratio * 10) / 10 : 0
    };
  };

  const addMealClick = (meal: string) => {
    setSelectedMeal(meal);
    setShowFoodSearch(true);
  };

  return (
    <div className="space-y-6">
      {/* Header com seleção de data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gold" />
            Diário Alimentar
          </CardTitle>
          <CardDescription>
            Registre seus alimentos e acompanhe o consumo nutricional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
            />
            <Button
              onClick={() => setShowFoodSearch(true)}
              className="bg-gold hover:bg-gold/90 text-background"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Alimento
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Totais do dia */}
      {diaryData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gold" />
              Resumo Nutricional - {new Date(selectedDate).toLocaleDateString('pt-BR')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gold">{diaryData.totals.calories}</div>
                <div className="text-sm text-muted-foreground">Calorias</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">{diaryData.totals.carbs}g</div>
                <div className="text-sm text-muted-foreground">Carboidratos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{diaryData.totals.protein}g</div>
                <div className="text-sm text-muted-foreground">Proteínas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{diaryData.totals.fat}g</div>
                <div className="text-sm text-muted-foreground">Gorduras</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-500">{diaryData.totals.fiber}g</div>
                <div className="text-sm text-muted-foreground">Fibras</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refeições */}
      {loading ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-muted-foreground">Carregando diário...</div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {MEAL_ORDER.map((meal) => {
            const entries = diaryData?.entries[meal] || [];
            return (
              <motion.div
                key={meal}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: MEAL_ORDER.indexOf(meal) * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{MEAL_LABELS[meal as keyof typeof MEAL_LABELS]}</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addMealClick(meal)}
                        className="border-gold text-gold hover:bg-gold hover:text-background"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {entries.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        Nenhum alimento registrado nesta refeição
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {entries.map((entry) => {
                          const nutrition = calculateEntryNutrition(entry);
                          return (
                            <div
                              key={entry.id}
                              className="flex items-center justify-between p-3 border border-border rounded-lg"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-foreground">{entry.food.name}</div>
                                {entry.food.brand && (
                                  <div className="text-sm text-muted-foreground">{entry.food.brand}</div>
                                )}
                                <div className="text-sm text-muted-foreground">
                                  {entry.quantity}g • {nutrition.calories} kcal • {nutrition.protein}g prot • {nutrition.carbs}g carb • {nutrition.fat}g gord
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteEntry(entry.id)}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal de busca de alimentos */}
      {showFoodSearch && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-end mb-4">
              <Button
                variant="ghost"
                onClick={() => setShowFoodSearch(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </Button>
            </div>
            <FoodSearch
              onFoodSelect={handleFoodSelect}
              meal={selectedMeal}
            />
          </div>
        </div>
      )}
    </div>
  );
}