'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Scale,
  Plus,
  Calendar,
  User,
  TrendingUp,
  TrendingDown,
  Activity,
  Heart,
  Ruler,
  Calculator,
  Camera,
  ChartLine
} from 'lucide-react';

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
  photos: string | null;
  client: {
    id: string;
    user: {
      name: string;
      email: string;
      image: string | null;
    };
  };
}

interface Client {
  id: string;
  user: {
    name: string;
    email: string;
  };
}

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [newAssessment, setNewAssessment] = useState({
    clientId: '',
    assessmentDate: new Date().toISOString().split('T')[0],
    weight: '',
    height: '',
    bodyFat: '',
    muscleMass: '',
    waist: '',
    chest: '',
    arm: '',
    thigh: '',
    hip: '',
    restingHR: '',
    bloodPressure: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [selectedClient]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedClient) params.append('clientId', selectedClient);

      const [assessmentsRes, clientsRes] = await Promise.all([
        fetch(`/api/assessments?${params.toString()}`),
        fetch('/api/professional/clients')
      ]);

      if (assessmentsRes.ok) {
        const assessmentsData = await assessmentsRes.json();
        setAssessments(assessmentsData.assessments || []);
      }

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setClients(clientsData.clients || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAssessment = async () => {
    try {
      const assessmentData = {
        ...newAssessment,
        weight: newAssessment.weight ? parseFloat(newAssessment.weight) : null,
        height: newAssessment.height ? parseFloat(newAssessment.height) : null,
        bodyFat: newAssessment.bodyFat ? parseFloat(newAssessment.bodyFat) : null,
        muscleMass: newAssessment.muscleMass ? parseFloat(newAssessment.muscleMass) : null,
        waist: newAssessment.waist ? parseFloat(newAssessment.waist) : null,
        chest: newAssessment.chest ? parseFloat(newAssessment.chest) : null,
        arm: newAssessment.arm ? parseFloat(newAssessment.arm) : null,
        thigh: newAssessment.thigh ? parseFloat(newAssessment.thigh) : null,
        hip: newAssessment.hip ? parseFloat(newAssessment.hip) : null,
        restingHR: newAssessment.restingHR ? parseInt(newAssessment.restingHR) : null
      };

      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assessmentData)
      });

      if (response.ok) {
        setShowCreateForm(false);
        setNewAssessment({
          clientId: '',
          assessmentDate: new Date().toISOString().split('T')[0],
          weight: '',
          height: '',
          bodyFat: '',
          muscleMass: '',
          waist: '',
          chest: '',
          arm: '',
          thigh: '',
          hip: '',
          restingHR: '',
          bloodPressure: '',
          notes: ''
        });
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao criar avaliação');
      }
    } catch (error) {
      console.error('Error creating assessment:', error);
      alert('Erro ao criar avaliação');
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

  const getBMICategory = (bmi: number | null) => {
    if (!bmi) return null;
    if (bmi < 18.5) return { label: 'Abaixo do peso', color: 'text-blue-600' };
    if (bmi < 25) return { label: 'Peso normal', color: 'text-green-600' };
    if (bmi < 30) return { label: 'Sobrepeso', color: 'text-yellow-600' };
    return { label: 'Obesidade', color: 'text-red-600' };
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Avaliações Físicas</h1>
          <p className="text-foreground-secondary">
            Registre e acompanhe o progresso dos seus clientes ({assessments.length} avaliações)
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-gold text-black hover:bg-gold-dark"
        >
          <Plus size={16} className="mr-2" />
          Nova Avaliação
        </Button>
      </div>

      {/* Create Assessment Form */}
      {showCreateForm && (
        <Card className="border-gold/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale size={20} className="text-gold" />
              Nova Avaliação Física
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Cliente *
                </label>
                <select
                  value={newAssessment.clientId}
                  onChange={(e) => setNewAssessment({ ...newAssessment, clientId: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:border-gold focus:outline-none text-foreground"
                >
                  <option value="">Selecionar cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.user.name || client.user.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Data da Avaliação *
                </label>
                <input
                  type="date"
                  value={newAssessment.assessmentDate}
                  onChange={(e) => setNewAssessment({ ...newAssessment, assessmentDate: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:border-gold focus:outline-none text-foreground"
                />
              </div>
            </div>

            {/* Medidas Corporais */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Ruler size={18} className="text-gold" />
                Medidas Corporais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newAssessment.weight}
                    onChange={(e) => setNewAssessment({ ...newAssessment, weight: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:border-gold focus:outline-none text-foreground"
                    placeholder="70.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Altura (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newAssessment.height}
                    onChange={(e) => setNewAssessment({ ...newAssessment, height: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:border-gold focus:outline-none text-foreground"
                    placeholder="175.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    % Gordura
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newAssessment.bodyFat}
                    onChange={(e) => setNewAssessment({ ...newAssessment, bodyFat: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:border-gold focus:outline-none text-foreground"
                    placeholder="15.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Massa Muscular (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newAssessment.muscleMass}
                    onChange={(e) => setNewAssessment({ ...newAssessment, muscleMass: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:border-gold focus:outline-none text-foreground"
                    placeholder="45.2"
                  />
                </div>
              </div>
            </div>

            {/* Circunferências */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Activity size={18} className="text-gold" />
                Circunferências (cm)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Cintura
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newAssessment.waist}
                    onChange={(e) => setNewAssessment({ ...newAssessment, waist: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:border-gold focus:outline-none text-foreground"
                    placeholder="85"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Peito
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newAssessment.chest}
                    onChange={(e) => setNewAssessment({ ...newAssessment, chest: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:border-gold focus:outline-none text-foreground"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Braço
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newAssessment.arm}
                    onChange={(e) => setNewAssessment({ ...newAssessment, arm: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:border-gold focus:outline-none text-foreground"
                    placeholder="35"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Coxa
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newAssessment.thigh}
                    onChange={(e) => setNewAssessment({ ...newAssessment, thigh: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:border-gold focus:outline-none text-foreground"
                    placeholder="55"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Quadril
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newAssessment.hip}
                    onChange={(e) => setNewAssessment({ ...newAssessment, hip: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:border-gold focus:outline-none text-foreground"
                    placeholder="95"
                  />
                </div>
              </div>
            </div>

            {/* Dados de Saúde */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Heart size={18} className="text-gold" />
                Indicadores de Saúde
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    FC Repouso (bpm)
                  </label>
                  <input
                    type="number"
                    value={newAssessment.restingHR}
                    onChange={(e) => setNewAssessment({ ...newAssessment, restingHR: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:border-gold focus:outline-none text-foreground"
                    placeholder="65"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Pressão Arterial
                  </label>
                  <input
                    type="text"
                    value={newAssessment.bloodPressure}
                    onChange={(e) => setNewAssessment({ ...newAssessment, bloodPressure: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:border-gold focus:outline-none text-foreground"
                    placeholder="120/80"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Observações
              </label>
              <textarea
                value={newAssessment.notes}
                onChange={(e) => setNewAssessment({ ...newAssessment, notes: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:border-gold focus:outline-none text-foreground resize-none"
                rows={3}
                placeholder="Observações sobre a avaliação, objetivos, etc..."
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={createAssessment}
                disabled={!newAssessment.clientId || !newAssessment.assessmentDate}
                className="bg-gold text-black hover:bg-gold-dark"
              >
                Salvar Avaliação
              </Button>
              <Button
                onClick={() => setShowCreateForm(false)}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="px-3 py-2 border border-border bg-surface rounded-lg focus:border-gold focus:outline-none text-foreground"
            >
              <option value="">Todos os clientes</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.user.name || client.user.email}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Assessments List */}
      <div className="space-y-4">
        {assessments.length === 0 ? (
          <div className="text-center py-12">
            <Scale size={48} className="text-foreground-muted mx-auto mb-4" />
            <p className="text-foreground-secondary">Nenhuma avaliação encontrada</p>
            <p className="text-foreground-muted text-sm">
              {clients.length === 0 ? 'Adicione clientes primeiro' : 'Crie a primeira avaliação!'}
            </p>
          </div>
        ) : (
          assessments.map((assessment) => {
            const bmiCategory = getBMICategory(assessment.bmi);
            return (
              <Card key={assessment.id} className="hover:border-gold/20 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                        <Scale size={24} className="text-gold" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-lg">
                          {assessment.client.user.name || 'Cliente'}
                        </h3>
                        <p className="text-foreground-secondary text-sm">{assessment.client.user.email}</p>
                        <p className="text-foreground-muted text-sm flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(assessment.assessmentDate)}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <ChartLine size={14} className="mr-1" />
                      Progresso
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                    {assessment.weight && (
                      <div className="text-center p-3 rounded-lg bg-surface-hover">
                        <p className="text-foreground-muted">Peso</p>
                        <p className="font-bold text-lg text-foreground">{assessment.weight}kg</p>
                      </div>
                    )}

                    {assessment.bmi && (
                      <div className="text-center p-3 rounded-lg bg-surface-hover">
                        <p className="text-foreground-muted">IMC</p>
                        <p className="font-bold text-lg text-foreground">{assessment.bmi.toFixed(1)}</p>
                        {bmiCategory && (
                          <p className={`text-xs ${bmiCategory.color}`}>{bmiCategory.label}</p>
                        )}
                      </div>
                    )}

                    {assessment.bodyFat && (
                      <div className="text-center p-3 rounded-lg bg-surface-hover">
                        <p className="text-foreground-muted">% Gordura</p>
                        <p className="font-bold text-lg text-foreground">{assessment.bodyFat}%</p>
                      </div>
                    )}

                    {assessment.muscleMass && (
                      <div className="text-center p-3 rounded-lg bg-surface-hover">
                        <p className="text-foreground-muted">Massa Muscular</p>
                        <p className="font-bold text-lg text-foreground">{assessment.muscleMass}kg</p>
                      </div>
                    )}

                    {assessment.waist && (
                      <div className="text-center p-3 rounded-lg bg-surface-hover">
                        <p className="text-foreground-muted">Cintura</p>
                        <p className="font-bold text-lg text-foreground">{assessment.waist}cm</p>
                      </div>
                    )}

                    {assessment.restingHR && (
                      <div className="text-center p-3 rounded-lg bg-surface-hover">
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
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}