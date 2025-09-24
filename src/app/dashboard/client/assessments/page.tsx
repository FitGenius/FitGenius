'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Scale,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  Heart,
  Ruler,
  Calculator,
  BarChart3
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface Assessment {
  id: string;
  assessmentDate: string;
  weight: number | null;
  height: number | null;
  bodyFat: number | null;
  muscleMass: number | null;
  bmi: number | null;
  waist: number | null;
  chest: number | null;
  arm: number | null;
  thigh: number | null;
  hip: number | null;
  restingHR: number | null;
  bloodPressure: string | null;
  notes: string | null;
  professional: {
    user: {
      name: string;
      email: string;
    };
  };
}

interface ProgressData {
  date: string;
  weight: number | null;
  bodyFat: number | null;
  muscleMass: number | null;
  bmi: number | null;
  waist: number | null;
  chest: number | null;
  arm: number | null;
  thigh: number | null;
  hip: number | null;
  restingHR: number | null;
}

interface ProgressSummary {
  totalAssessments: number;
  firstAssessment: string | null;
  lastAssessment: string | null;
  changes: {
    weight: { absolute: number; percentage: number } | null;
    bodyFat: { absolute: number; percentage: number } | null;
    muscleMass: { absolute: number; percentage: number } | null;
    bmi: { absolute: number; percentage: number } | null;
    waist: { absolute: number; percentage: number } | null;
    chest: { absolute: number; percentage: number } | null;
    arm: { absolute: number; percentage: number } | null;
    thigh: { absolute: number; percentage: number } | null;
    hip: { absolute: number; percentage: number } | null;
    restingHR: { absolute: number; percentage: number } | null;
  };
}

export default function ClientAssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [progress, setProgress] = useState<ProgressData[]>([]);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('weight');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assessmentsRes, progressRes] = await Promise.all([
        fetch('/api/assessments'),
        fetch('/api/assessments/progress?clientId=current') // Will be handled by the API
      ]);

      if (assessmentsRes.ok) {
        const assessmentsData = await assessmentsRes.json();
        setAssessments(assessmentsData.assessments || []);
      }

      if (progressRes.ok) {
        const progressData = await progressRes.json();
        setProgress(progressData.progress || []);
        setSummary(progressData.summary);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const getBMICategory = (bmi: number | null) => {
    if (!bmi) return null;
    if (bmi < 18.5) return { label: 'Abaixo do peso', color: 'text-blue-600' };
    if (bmi < 25) return { label: 'Peso normal', color: 'text-green-600' };
    if (bmi < 30) return { label: 'Sobrepeso', color: 'text-yellow-600' };
    return { label: 'Obesidade', color: 'text-red-600' };
  };

  const getChangeIcon = (change: { absolute: number; percentage: number } | null) => {
    if (!change) return null;
    return change.absolute > 0 ?
      <TrendingUp size={16} className="text-green-600" /> :
      <TrendingDown size={16} className="text-red-600" />;
  };

  const getMetricLabel = (metric: string) => {
    const labels: Record<string, string> = {
      weight: 'Peso (kg)',
      bodyFat: '% Gordura',
      muscleMass: 'Massa Muscular (kg)',
      bmi: 'IMC',
      waist: 'Cintura (cm)',
      chest: 'Peito (cm)',
      arm: 'Braço (cm)',
      thigh: 'Coxa (cm)',
      hip: 'Quadril (cm)',
      restingHR: 'FC Repouso (bpm)'
    };
    return labels[metric] || metric;
  };

  const getMetricColor = (metric: string) => {
    const colors: Record<string, string> = {
      weight: '#ffd700',
      bodyFat: '#ff6b6b',
      muscleMass: '#4ecdc4',
      bmi: '#45b7d1',
      waist: '#96ceb4',
      chest: '#feca57',
      arm: '#ff9ff3',
      thigh: '#54a0ff',
      hip: '#5f27cd',
      restingHR: '#00d2d3'
    };
    return colors[metric] || '#ffd700';
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full mx-auto"></div>
          <p className="text-foreground-secondary mt-4">Carregando avaliações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Minhas Avaliações</h1>
        <p className="text-foreground-secondary">
          Acompanhe sua evolução física ao longo do tempo ({assessments.length} avaliações)
        </p>
      </div>

      {/* Progress Summary */}
      {summary && summary.totalAssessments > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {Object.entries(summary.changes)
            .filter(([_, change]) => change !== null)
            .slice(0, 5)
            .map(([metric, change]) => (
            <Card key={metric}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground-secondary">
                      {getMetricLabel(metric)}
                    </p>
                    <div className="flex items-center gap-2">
                      {getChangeIcon(change)}
                      <span className="text-lg font-bold text-foreground">
                        {change!.absolute > 0 ? '+' : ''}{change!.absolute.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs text-foreground-muted">
                      {change!.percentage > 0 ? '+' : ''}{change!.percentage.toFixed(1)}%
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
                    <BarChart3 size={16} className="text-gold" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Progress Chart */}
      {progress.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BarChart3 size={20} className="text-gold" />
                Evolução - {getMetricLabel(selectedMetric)}
              </span>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="px-3 py-1 bg-surface border border-border rounded text-sm focus:border-gold focus:outline-none"
              >
                <option value="weight">Peso</option>
                <option value="bodyFat">% Gordura</option>
                <option value="muscleMass">Massa Muscular</option>
                <option value="bmi">IMC</option>
                <option value="waist">Cintura</option>
                <option value="chest">Peito</option>
                <option value="arm">Braço</option>
                <option value="thigh">Coxa</option>
                <option value="hip">Quadril</option>
                <option value="restingHR">FC Repouso</option>
              </select>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={progress}>
                  <defs>
                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={getMetricColor(selectedMetric)} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={getMetricColor(selectedMetric)} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDateShort}
                    stroke="#666"
                  />
                  <YAxis stroke="#666" />
                  <Tooltip
                    labelFormatter={(value) => `Data: ${formatDate(value)}`}
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={selectedMetric}
                    stroke={getMetricColor(selectedMetric)}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorMetric)"
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assessments History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale size={20} className="text-gold" />
            Histórico de Avaliações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assessments.length === 0 ? (
            <div className="text-center py-12">
              <Scale size={48} className="text-foreground-muted mx-auto mb-4" />
              <p className="text-foreground-secondary">Nenhuma avaliação registrada</p>
              <p className="text-foreground-muted text-sm">
                Suas avaliações físicas aparecerão aqui quando seu profissional as cadastrar
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {assessments.map((assessment) => {
                const bmiCategory = getBMICategory(assessment.bmi);
                return (
                  <div key={assessment.id} className="p-4 rounded-lg bg-surface-hover border border-border">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar size={16} className="text-gold" />
                          <span className="font-semibold text-foreground">
                            {formatDate(assessment.assessmentDate)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground-secondary">
                          Avaliação realizada por {assessment.professional.user.name}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-sm">
                      {assessment.weight && (
                        <div className="text-center p-3 rounded-lg bg-surface">
                          <p className="text-foreground-muted">Peso</p>
                          <p className="font-bold text-lg text-foreground">{assessment.weight}kg</p>
                        </div>
                      )}

                      {assessment.bmi && (
                        <div className="text-center p-3 rounded-lg bg-surface">
                          <p className="text-foreground-muted">IMC</p>
                          <p className="font-bold text-lg text-foreground">{assessment.bmi.toFixed(1)}</p>
                          {bmiCategory && (
                            <p className={`text-xs ${bmiCategory.color}`}>{bmiCategory.label}</p>
                          )}
                        </div>
                      )}

                      {assessment.bodyFat && (
                        <div className="text-center p-3 rounded-lg bg-surface">
                          <p className="text-foreground-muted">% Gordura</p>
                          <p className="font-bold text-lg text-foreground">{assessment.bodyFat}%</p>
                        </div>
                      )}

                      {assessment.muscleMass && (
                        <div className="text-center p-3 rounded-lg bg-surface">
                          <p className="text-foreground-muted">Massa Muscular</p>
                          <p className="font-bold text-lg text-foreground">{assessment.muscleMass}kg</p>
                        </div>
                      )}

                      {assessment.waist && (
                        <div className="text-center p-3 rounded-lg bg-surface">
                          <p className="text-foreground-muted">Cintura</p>
                          <p className="font-bold text-lg text-foreground">{assessment.waist}cm</p>
                        </div>
                      )}

                      {assessment.restingHR && (
                        <div className="text-center p-3 rounded-lg bg-surface">
                          <p className="text-foreground-muted">FC Repouso</p>
                          <p className="font-bold text-lg text-foreground">{assessment.restingHR}bpm</p>
                        </div>
                      )}
                    </div>

                    {assessment.notes && (
                      <div className="mt-4 p-3 bg-surface rounded border-l-4 border-gold">
                        <p className="text-sm text-foreground italic">"{assessment.notes}"</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}