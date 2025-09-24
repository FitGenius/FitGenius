'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Calendar, Download, Filter } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WeightEvolutionChart } from '@/components/analytics/WeightEvolutionChart';
import { BodyCompositionChart } from '@/components/analytics/BodyCompositionChart';
import { MeasurementsChart } from '@/components/analytics/MeasurementsChart';
import { PerformanceChart } from '@/components/analytics/PerformanceChart';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('6m');
  const [activeTab, setActiveTab] = useState('overview');

  const periodOptions = [
    { value: '1m', label: 'Último Mês' },
    { value: '3m', label: 'Últimos 3 Meses' },
    { value: '6m', label: 'Últimos 6 Meses' },
    { value: '1y', label: 'Último Ano' },
    { value: 'all', label: 'Todo Período' },
  ];

  const exportReport = async () => {
    try {
      // TODO: Implementar exportação de relatório PDF
      console.log('Exporting report for period:', period);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gold to-gold/60 bg-clip-text text-transparent">
            Analytics & Progresso
          </h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe sua evolução física e de performance ao longo do tempo
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-48">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportReport}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </motion.div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="body" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Corpo
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="detailed" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Detalhado
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 xl:grid-cols-2 gap-6"
          >
            <WeightEvolutionChart period={period} />
            <BodyCompositionChart period={period} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <PerformanceChart period={period} />
          </motion.div>
        </TabsContent>

        {/* Body Tab */}
        <TabsContent value="body" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <WeightEvolutionChart period={period} className="lg:col-span-1" />
            <BodyCompositionChart period={period} className="lg:col-span-1" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <MeasurementsChart period={period} />
          </motion.div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <PerformanceChart period={period} />
          </motion.div>
          
          {/* Additional Performance Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Quick Stats Cards */}
            <div className="bg-card rounded-xl border border-border/50 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">-</div>
                  <div className="text-xs text-muted-foreground">Treinos Concluídos</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                No período selecionado
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border/50 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Filter className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">-</div>
                  <div className="text-xs text-muted-foreground">Exercícios Diferentes</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Variedade no treinamento
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border/50 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">-</div>
                  <div className="text-xs text-muted-foreground">Média Semanal</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Frequência de treino
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Detailed Tab */}
        <TabsContent value="detailed" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <WeightEvolutionChart period={period} />
            <BodyCompositionChart period={period} />
            <MeasurementsChart period={period} />
            <PerformanceChart period={period} />
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-sm text-muted-foreground pt-8 border-t border-border/50"
      >
        <p>
          Os dados são baseados nas suas avaliações físicas e treinos concluídos.
          <br />
          Para uma análise mais precisa, mantenha seus registros sempre atualizados.
        </p>
      </motion.div>
    </div>
  );
}