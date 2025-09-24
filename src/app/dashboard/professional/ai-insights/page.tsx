'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Brain,
  Dumbbell,
  Apple,
  TrendingUp,
  Users,
  Sparkles,
  Target,
  Activity,
  AlertTriangle,
  CheckCircle,
  Info,
  Star,
  Clock,
  BarChart3,
  Zap,
  Loader2
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  fitnessGoal: string;
  experienceLevel: string;
}

interface WorkoutRecommendation {
  id: string;
  name: string;
  description: string;
  estimatedDuration: number;
  difficulty: string;
  targetMuscleGroups: string[];
  exercises: any[];
  confidence: number;
  reasoning: string;
}

interface NutritionRecommendation {
  id: string;
  mealType: string;
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  foods: any[];
  confidence: number;
  reasoning: string;
}

interface ProgressPrediction {
  weightPrediction: { value: number; confidence: number };
  strengthPrediction: { exercises: Record<string, number>; confidence: number };
  endurancePrediction: { metrics: Record<string, number>; confidence: number };
  recommendations: string[];
}

export default function AIInsightsPage() {
  const { data: session } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'workouts' | 'nutrition' | 'predictions'>('workouts');
  const [workoutRecommendations, setWorkoutRecommendations] = useState<WorkoutRecommendation[]>([]);
  const [nutritionRecommendations, setNutritionRecommendations] = useState<NutritionRecommendation[]>([]);
  const [progressPredictions, setProgressPredictions] = useState<ProgressPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load clients on mount
  useEffect(() => {
    loadClients();
  }, []);

  // Load recommendations when client is selected
  useEffect(() => {
    if (selectedClient) {
      loadRecommendations();
    }
  }, [selectedClient, activeTab]);

  const loadClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
        if (data.clients?.length > 0) {
          setSelectedClient(data.clients[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadRecommendations = async () => {
    if (!selectedClient) return;

    setLoading(true);
    setError(null);

    try {
      switch (activeTab) {
        case 'workouts':
          await loadWorkoutRecommendations();
          break;
        case 'nutrition':
          await loadNutritionRecommendations();
          break;
        case 'predictions':
          await loadProgressPredictions();
          break;
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar recomendações');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkoutRecommendations = async () => {
    const response = await fetch(`/api/ai/recommendations/workouts?clientId=${selectedClient}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to load workout recommendations');
    }

    const data = await response.json();
    setWorkoutRecommendations(data.recommendations || []);
  };

  const loadNutritionRecommendations = async () => {
    const response = await fetch(`/api/ai/recommendations/nutrition?clientId=${selectedClient}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to load nutrition recommendations');
    }

    const data = await response.json();
    setNutritionRecommendations(data.recommendations || []);
  };

  const loadProgressPredictions = async () => {
    const response = await fetch(`/api/ai/analytics/progress-prediction?clientId=${selectedClient}&timeframe=month`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to load progress predictions');
    }

    const data = await response.json();
    setProgressPredictions(data.predictions);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-500';
    if (confidence >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 80) return <CheckCircle size={16} className="text-green-500" />;
    if (confidence >= 60) return <AlertTriangle size={16} className="text-yellow-500" />;
    return <Info size={16} className="text-red-500" />;
  };

  if (!session) {
    return <div>Por favor, faça login para acessar esta página.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center">
              <Brain size={24} className="text-black" />
            </div>
            Insights de IA
          </h1>
          <p className="text-foreground-secondary mt-2">
            Recomendações inteligentes baseadas em dados dos seus clientes
          </p>
        </div>

        {/* Client selector */}
        <div className="min-w-64">
          <label className="block text-sm font-medium text-foreground mb-2">
            Selecione o Cliente
          </label>
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
          >
            <option value="">Escolha um cliente...</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} - {client.fitnessGoal}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedClient ? (
        <>
          {/* Tabs */}
          <div className="border-b border-border">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('workouts')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'workouts'
                    ? 'border-gold text-gold'
                    : 'border-transparent text-foreground-secondary hover:text-foreground hover:border-border'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Dumbbell size={16} />
                  Treinos Inteligentes
                </div>
              </button>
              <button
                onClick={() => setActiveTab('nutrition')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'nutrition'
                    ? 'border-gold text-gold'
                    : 'border-transparent text-foreground-secondary hover:text-foreground hover:border-border'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Apple size={16} />
                  Nutrição Personalizada
                </div>
              </button>
              <button
                onClick={() => setActiveTab('predictions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'predictions'
                    ? 'border-gold text-gold'
                    : 'border-transparent text-foreground-secondary hover:text-foreground hover:border-border'
                }`}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} />
                  Análise Preditiva
                </div>
              </button>
            </nav>
          </div>

          {/* Content */}
          {loading && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gold" />
              <p className="text-foreground-secondary">Gerando insights com IA...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle size={20} />
                <span className="font-medium">Erro</span>
              </div>
              <p className="text-red-600 mt-1">{error}</p>
              <button
                onClick={loadRecommendations}
                className="mt-3 btn-outline text-red-600 border-red-200 hover:bg-red-50"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-6">
              {/* Workout Recommendations */}
              {activeTab === 'workouts' && (
                <div className="grid gap-6">
                  {workoutRecommendations.length === 0 ? (
                    <div className="text-center py-12 card">
                      <Dumbbell size={48} className="mx-auto mb-4 text-foreground-secondary" />
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        Nenhuma recomendação disponível
                      </h3>
                      <p className="text-foreground-secondary">
                        São necessários mais dados de treino para gerar recomendações personalizadas.
                      </p>
                    </div>
                  ) : (
                    workoutRecommendations.map((rec, index) => (
                      <div key={rec.id} className="card p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
                                <Sparkles size={20} className="text-gold" />
                              </div>
                              <div>
                                <h3 className="text-xl font-semibold text-foreground">{rec.name}</h3>
                                <p className="text-sm text-foreground-secondary">{rec.description}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {getConfidenceIcon(rec.confidence)}
                            <span className={`text-sm font-medium ${getConfidenceColor(rec.confidence)}`}>
                              {rec.confidence}% confiança
                            </span>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                            <Clock size={16} />
                            <span>{rec.estimatedDuration} minutos</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                            <BarChart3 size={16} />
                            <span>Dificuldade: {rec.difficulty}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                            <Target size={16} />
                            <span>{rec.targetMuscleGroups.join(', ')}</span>
                          </div>
                        </div>

                        <div className="bg-surface p-4 rounded-lg mb-4">
                          <h4 className="font-medium text-foreground mb-2">🎯 Por que esta recomendação?</h4>
                          <p className="text-sm text-foreground-secondary">{rec.reasoning}</p>
                        </div>

                        <div className="flex gap-3">
                          <button className="btn-primary">
                            Criar Treino
                          </button>
                          <button className="btn-outline">
                            Ver Detalhes
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Nutrition Recommendations */}
              {activeTab === 'nutrition' && (
                <div className="grid gap-6">
                  {nutritionRecommendations.length === 0 ? (
                    <div className="text-center py-12 card">
                      <Apple size={48} className="mx-auto mb-4 text-foreground-secondary" />
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        Nenhuma recomendação nutricional disponível
                      </h3>
                      <p className="text-foreground-secondary">
                        Registre dados nutricionais do cliente para obter sugestões personalizadas.
                      </p>
                    </div>
                  ) : (
                    nutritionRecommendations.map((rec, index) => (
                      <div key={rec.id} className="card p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                              <Apple size={20} className="text-green-600" />
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold text-foreground">
                                {rec.mealType}
                              </h3>
                              <p className="text-sm text-foreground-secondary">
                                {rec.calories} kcal
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {getConfidenceIcon(rec.confidence)}
                            <span className={`text-sm font-medium ${getConfidenceColor(rec.confidence)}`}>
                              {rec.confidence}% confiança
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-blue-600">
                              {rec.macros.protein}g
                            </div>
                            <div className="text-sm text-foreground-secondary">Proteína</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-orange-600">
                              {rec.macros.carbs}g
                            </div>
                            <div className="text-sm text-foreground-secondary">Carboidratos</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-purple-600">
                              {rec.macros.fat}g
                            </div>
                            <div className="text-sm text-foreground-secondary">Gorduras</div>
                          </div>
                        </div>

                        <div className="bg-surface p-4 rounded-lg mb-4">
                          <h4 className="font-medium text-foreground mb-2">🍎 Recomendação baseada em:</h4>
                          <p className="text-sm text-foreground-secondary">{rec.reasoning}</p>
                        </div>

                        <div className="flex gap-3">
                          <button className="btn-primary">
                            Criar Plano Alimentar
                          </button>
                          <button className="btn-outline">
                            Ver Alimentos
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Progress Predictions */}
              {activeTab === 'predictions' && progressPredictions && (
                <div className="grid gap-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Weight Prediction */}
                    <div className="card p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Activity size={24} className="text-blue-500" />
                        <div>
                          <h3 className="font-semibold text-foreground">Predição de Peso</h3>
                          <p className="text-sm text-foreground-secondary">Próximo mês</p>
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-500 mb-1">
                          {progressPredictions.weightPrediction.value.toFixed(1)} kg
                        </div>
                        <div className="flex items-center justify-center gap-1 text-sm text-foreground-secondary">
                          {getConfidenceIcon(progressPredictions.weightPrediction.confidence)}
                          {progressPredictions.weightPrediction.confidence}% confiança
                        </div>
                      </div>
                    </div>

                    {/* Strength Prediction */}
                    <div className="card p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Zap size={24} className="text-red-500" />
                        <div>
                          <h3 className="font-semibold text-foreground">Força Estimada</h3>
                          <p className="text-sm text-foreground-secondary">Evolução esperada</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {Object.entries(progressPredictions.strengthPrediction.exercises).map(([exercise, value]) => (
                          <div key={exercise} className="flex justify-between text-sm">
                            <span className="text-foreground-secondary">{exercise}:</span>
                            <span className="font-medium text-foreground">{value} kg</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-center gap-1 text-sm text-foreground-secondary mt-3">
                        {getConfidenceIcon(progressPredictions.strengthPrediction.confidence)}
                        {progressPredictions.strengthPrediction.confidence}% confiança
                      </div>
                    </div>

                    {/* Endurance Prediction */}
                    <div className="card p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Target size={24} className="text-green-500" />
                        <div>
                          <h3 className="font-semibold text-foreground">Resistência</h3>
                          <p className="text-sm text-foreground-secondary">Capacidade cardio</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {Object.entries(progressPredictions.endurancePrediction.metrics).map(([metric, value]) => (
                          <div key={metric} className="flex justify-between text-sm">
                            <span className="text-foreground-secondary">{metric}:</span>
                            <span className="font-medium text-foreground">{value}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-center gap-1 text-sm text-foreground-secondary mt-3">
                        {getConfidenceIcon(progressPredictions.endurancePrediction.confidence)}
                        {progressPredictions.endurancePrediction.confidence}% confiança
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="card p-6">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Star size={20} className="text-gold" />
                      Recomendações para Otimizar Resultados
                    </h3>

                    <div className="space-y-3">
                      {progressPredictions.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-surface rounded-lg">
                          <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-black">{index + 1}</span>
                          </div>
                          <p className="text-sm text-foreground">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 card">
          <Users size={48} className="mx-auto mb-4 text-foreground-secondary" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Selecione um Cliente
          </h3>
          <p className="text-foreground-secondary">
            Escolha um cliente para visualizar insights e recomendações personalizadas.
          </p>
        </div>
      )}
    </div>
  );
}