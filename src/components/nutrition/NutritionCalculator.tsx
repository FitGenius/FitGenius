'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, User, Activity, Target, TrendingUp, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CalculatorResults {
  bmr: number;
  tdee: number;
  calorieNeeds: number;
  macros: {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
  };
  waterNeeds: number;
  bmi: {
    bmi: number;
    classification: string;
    healthStatus: string;
  };
  estimatedTimeWeeks?: number;
  recommendations: string[];
}

export function NutritionCalculator() {
  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    age: '',
    gender: '',
    activityLevel: '',
    goal: '',
    macroPreset: 'balanced'
  });
  const [results, setResults] = useState<CalculatorResults | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateNeeds = async () => {
    if (!formData.weight || !formData.height || !formData.age || 
        !formData.gender || !formData.activityLevel || !formData.goal) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/nutrition/calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight: parseFloat(formData.weight),
          height: parseFloat(formData.height),
          age: parseInt(formData.age),
          gender: formData.gender,
          activityLevel: formData.activityLevel,
          goal: formData.goal,
          macroPreset: formData.macroPreset
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        alert('Erro ao calcular necessidades nutricionais.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Erro ao calcular necessidades nutricionais.');
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'underweight': return 'text-blue-500';
      case 'normal': return 'text-green-500';
      case 'overweight': return 'text-yellow-500';
      case 'obese': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-gold" />
            Calculadora Nutricional
          </CardTitle>
          <CardDescription>
            Calcule suas necessidades calóricas e de macronutrientes personalizadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dados Pessoais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Peso (kg) *
              </label>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
                placeholder="70"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Altura (cm) *
              </label>
              <input
                type="number"
                value={formData.height}
                onChange={(e) => handleInputChange('height', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
                placeholder="170"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Idade (anos) *
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
                placeholder="30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Sexo *
              </label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o sexo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Masculino</SelectItem>
                  <SelectItem value="FEMALE">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nível de Atividade *
              </label>
              <Select value={formData.activityLevel} onValueChange={(value) => handleInputChange('activityLevel', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEDENTARY">Sedentário (pouco ou nenhum exercício)</SelectItem>
                  <SelectItem value="LIGHT">Leve (1-3 dias/semana)</SelectItem>
                  <SelectItem value="MODERATE">Moderado (3-5 dias/semana)</SelectItem>
                  <SelectItem value="ACTIVE">Ativo (6-7 dias/semana)</SelectItem>
                  <SelectItem value="VERY_ACTIVE">Muito ativo (2x por dia)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Objetivo *
              </label>
              <Select value={formData.goal} onValueChange={(value) => handleInputChange('goal', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o objetivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEIGHT_LOSS">Perda de peso</SelectItem>
                  <SelectItem value="WEIGHT_GAIN">Ganho de peso</SelectItem>
                  <SelectItem value="MAINTENANCE">Manutenção</SelectItem>
                  <SelectItem value="MUSCLE_GAIN">Ganho de massa muscular</SelectItem>
                  <SelectItem value="FAT_LOSS">Perda de gordura</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Distribuição de Macros
              </label>
              <Select value={formData.macroPreset} onValueChange={(value) => handleInputChange('macroPreset', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a distribuição" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="balanced">Balanceada (50/25/25)</SelectItem>
                  <SelectItem value="lowCarb">Low Carb (30/35/35)</SelectItem>
                  <SelectItem value="highProtein">Alta Proteína (40/40/20)</SelectItem>
                  <SelectItem value="keto">Keto (10/25/65)</SelectItem>
                  <SelectItem value="endurance">Endurance (60/20/20)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={calculateNeeds}
            disabled={loading}
            className="w-full bg-gold hover:bg-gold/90 text-background"
          >
            {loading ? 'Calculando...' : 'Calcular Necessidades Nutricionais'}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Metabolic Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-gold" />
                Dados Metabólicos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {results.bmr}
                  </div>
                  <div className="text-sm text-muted-foreground">BMR (kcal/dia)</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Taxa Metabólica Basal
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">
                    {results.tdee}
                  </div>
                  <div className="text-sm text-muted-foreground">TDEE (kcal/dia)</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Gasto Total Diário
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gold">
                    {results.calorieNeeds}
                  </div>
                  <div className="text-sm text-muted-foreground">Meta (kcal/dia)</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Para seu objetivo
                  </div>
                </div>
                <div className="text-center">
                  <div className={cn('text-2xl font-bold', getHealthStatusColor(results.bmi.healthStatus))}>
                    {results.bmi.bmi}
                  </div>
                  <div className="text-sm text-muted-foreground">IMC</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {results.bmi.classification}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Macros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-gold" />
                Distribuição de Macronutrientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gold">
                    {results.macros.calories}
                  </div>
                  <div className="text-sm text-muted-foreground">Calorias/dia</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">
                    {results.macros.carbs}g
                  </div>
                  <div className="text-sm text-muted-foreground">Carboidratos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">
                    {results.macros.protein}g
                  </div>
                  <div className="text-sm text-muted-foreground">Proteínas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {results.macros.fat}g
                  </div>
                  <div className="text-sm text-muted-foreground">Gorduras</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Water & Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-blue-500" />
                  Hidratação
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold text-blue-500 mb-2">
                  {(results.waterNeeds / 1000).toFixed(1)}L
                </div>
                <div className="text-sm text-muted-foreground">
                  Água recomendada por dia
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Aproximadamente {Math.round(results.waterNeeds / 200)} copos de 200ml
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-gold" />
                  Recomendações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {results.recommendations.slice(0, 4).map((rec, index) => (
                    <div key={index} className="text-sm text-muted-foreground">
                      {rec}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {results.estimatedTimeWeeks && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-2">
                    Tempo estimado para atingir o objetivo:
                  </div>
                  <div className="text-2xl font-bold text-gold">
                    {results.estimatedTimeWeeks} semanas
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    *Estimativa baseada em progressão saudável
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}