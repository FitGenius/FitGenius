'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Utensils, Calculator, BookOpen, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NutritionCalculator } from '@/components/nutrition/NutritionCalculator';
import { FoodDiary } from '@/components/nutrition/FoodDiary';
import { NutritionPlans } from '@/components/nutrition/NutritionPlans';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NutritionPage() {
  const [activeTab, setActiveTab] = useState('calculator');

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gold to-gold/60 bg-clip-text text-transparent">
          Nutrição Inteligente
        </h1>
        <p className="text-muted-foreground">
          Calcule suas necessidades, acompanhe sua alimentação e alcance seus objetivos
        </p>
      </motion.div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Calculadora
          </TabsTrigger>
          <TabsTrigger value="diary" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Diário
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <Utensils className="w-4 h-4" />
            Planos
          </TabsTrigger>
          <TabsTrigger value="recipes" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Receitas
          </TabsTrigger>
        </TabsList>

        {/* Calculator Tab */}
        <TabsContent value="calculator" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <NutritionCalculator />
          </motion.div>
        </TabsContent>

        {/* Food Diary Tab */}
        <TabsContent value="diary" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <FoodDiary />
          </motion.div>
        </TabsContent>

        {/* Nutrition Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <NutritionPlans />
          </motion.div>
        </TabsContent>

        {/* Recipes Tab */}
        <TabsContent value="recipes" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center py-12"
          >
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Receitas Saudáveis
            </h3>
            <p className="text-muted-foreground">
              Em breve você terá acesso a uma biblioteca de receitas
              <br />balanceadas e adequadas aos seus objetivos.
            </p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <Card className="opacity-60">
                <CardContent className="pt-6">
                  <div className="w-full h-32 bg-muted/20 rounded-lg mb-3" />
                  <div className="text-sm font-medium text-foreground mb-1">
                    Smoothie Proteinéico
                  </div>
                  <div className="text-xs text-muted-foreground">
                    350 kcal • 25g proteína
                  </div>
                </CardContent>
              </Card>
              <Card className="opacity-60">
                <CardContent className="pt-6">
                  <div className="w-full h-32 bg-muted/20 rounded-lg mb-3" />
                  <div className="text-sm font-medium text-foreground mb-1">
                    Salada Mediterrânea
                  </div>
                  <div className="text-xs text-muted-foreground">
                    280 kcal • 15g fibras
                  </div>
                </CardContent>
              </Card>
              <Card className="opacity-60">
                <CardContent className="pt-6">
                  <div className="w-full h-32 bg-muted/20 rounded-lg mb-3" />
                  <div className="text-sm font-medium text-foreground mb-1">
                    Overnight Oats
                  </div>
                  <div className="text-xs text-muted-foreground">
                    320 kcal • 12g proteína
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-card/50 rounded-xl border border-border/30 p-6"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
          Dicas de Nutrição
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
          <div className="text-center">
            <div className="text-gold font-semibold mb-1">🍎 Hidratação</div>
            <p>Beba pelo menos 35ml de água por kg de peso corporal diariamente</p>
          </div>
          <div className="text-center">
            <div className="text-gold font-semibold mb-1">🍕 Equilíbrio</div>
            <p>Inclua proteína, carboidrato e gordura boa em todas as refeições</p>
          </div>
          <div className="text-center">
            <div className="text-gold font-semibold mb-1">⏰ Timing</div>
            <p>Mantenha horários regulares para as refeições e lanches</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}