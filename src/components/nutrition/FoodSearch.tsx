'use client';

import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

interface FoodSearchProps {
  onFoodSelect: (food: Food, quantity: number, meal: string) => void;
  meal?: string;
}

export function FoodSearch({ onFoodSelect, meal = 'BREAKFAST' }: FoodSearchProps) {
  const [query, setQuery] = useState('');
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [selectedMeal, setSelectedMeal] = useState(meal);

  const searchFoods = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setFoods([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/nutrition/foods?q=${encodeURIComponent(searchQuery)}&limit=10`);

      if (response.ok) {
        const data = await response.json();
        setFoods(data.foods || []);
      } else {
        console.error('Error searching foods');
        setFoods([]);
      }
    } catch (error) {
      console.error('Error searching foods:', error);
      setFoods([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setQuery(value);
    const timeoutId = setTimeout(() => {
      searchFoods(value);
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  const calculateNutrition = (food: Food, qty: number) => {
    const ratio = qty / 100;
    return {
      calories: Math.round(food.calories * ratio),
      carbs: Math.round(food.carbs * ratio * 10) / 10,
      protein: Math.round(food.protein * ratio * 10) / 10,
      fat: Math.round(food.fat * ratio * 10) / 10,
      fiber: food.fiber ? Math.round(food.fiber * ratio * 10) / 10 : 0
    };
  };

  const handleAddFood = () => {
    if (selectedFood && quantity) {
      onFoodSelect(selectedFood, parseFloat(quantity), selectedMeal);
      setSelectedFood(null);
      setQuantity('100');
      setQuery('');
      setFoods([]);
    }
  };

  const nutrition = selectedFood && quantity ? calculateNutrition(selectedFood, parseFloat(quantity)) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5 text-gold" />
          Adicionar Alimento
        </CardTitle>
        <CardDescription>
          Busque alimentos para adicionar ao seu diário
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar alimentos..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Resultados da busca */}
        {loading && (
          <div className="text-center py-4 text-muted-foreground">
            Buscando alimentos...
          </div>
        )}

        {foods.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {foods.map((food) => (
              <div
                key={food.id}
                onClick={() => setSelectedFood(food)}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedFood?.id === food.id
                    ? 'border-gold bg-gold/10'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <div className="font-medium text-foreground">{food.name}</div>
                {food.brand && (
                  <div className="text-sm text-muted-foreground">{food.brand}</div>
                )}
                <div className="text-xs text-muted-foreground">
                  {food.calories} kcal • {food.protein}g prot • {food.carbs}g carb • {food.fat}g gord
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Alimento selecionado */}
        {selectedFood && (
          <div className="border border-gold rounded-lg p-4 bg-gold/5">
            <h4 className="font-medium text-foreground mb-2">{selectedFood.name}</h4>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Quantidade (g)
                </label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="100"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Refeição
                </label>
                <Select value={selectedMeal} onValueChange={setSelectedMeal}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BREAKFAST">Café da manhã</SelectItem>
                    <SelectItem value="MORNING_SNACK">Lanche da manhã</SelectItem>
                    <SelectItem value="LUNCH">Almoço</SelectItem>
                    <SelectItem value="AFTERNOON_SNACK">Lanche da tarde</SelectItem>
                    <SelectItem value="DINNER">Jantar</SelectItem>
                    <SelectItem value="EVENING_SNACK">Ceia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Informações nutricionais calculadas */}
            {nutrition && (
              <div className="bg-background rounded-lg p-3 mb-4">
                <div className="text-sm font-medium text-foreground mb-2">
                  Informação Nutricional ({quantity}g)
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Calorias: <span className="font-medium">{nutrition.calories} kcal</span></div>
                  <div>Carboidratos: <span className="font-medium">{nutrition.carbs}g</span></div>
                  <div>Proteínas: <span className="font-medium">{nutrition.protein}g</span></div>
                  <div>Gorduras: <span className="font-medium">{nutrition.fat}g</span></div>
                  {nutrition.fiber > 0 && (
                    <div>Fibras: <span className="font-medium">{nutrition.fiber}g</span></div>
                  )}
                </div>
              </div>
            )}

            <Button
              onClick={handleAddFood}
              className="w-full bg-gold hover:bg-gold/90 text-background"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar ao Diário
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}