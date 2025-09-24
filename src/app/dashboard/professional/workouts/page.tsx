'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dumbbell,
  Plus,
  Calendar,
  User,
  Activity,
  Clock,
  CheckCircle,
  FileText,
  Search,
  Filter,
  Eye,
  Edit,
  Play,
  Users
} from 'lucide-react';

interface Workout {
  id: string;
  name: string;
  description: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  scheduledDate: string | null;
  completedAt: string | null;
  notes: string | null;
  client: {
    id: string;
    user: {
      name: string;
      email: string;
      image: string | null;
    };
  };
  professional: {
    user: {
      name: string;
      email: string;
      image: string | null;
    };
  };
  exercises: Array<{
    id: string;
    order: number;
    sets: number | null;
    reps: string | null;
    weight: number | null;
    rest: string | null;
    notes: string | null;
    exercise: {
      id: string;
      name: string;
      category: string;
      difficulty: string;
    };
  }>;
  _count: {
    exercises: number;
  };
}

interface Client {
  id: string;
  user: {
    name: string;
    email: string;
  };
}

const statusLabels = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Ativo',
  COMPLETED: 'Concluído',
  ARCHIVED: 'Arquivado'
};

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWorkout, setNewWorkout] = useState({
    name: '',
    description: '',
    clientId: '',
    scheduledDate: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [selectedStatus, selectedClient]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedClient) params.append('clientId', selectedClient);

      const [workoutsRes, clientsRes] = await Promise.all([
        fetch(`/api/workouts?${params.toString()}`),
        fetch('/api/professional/clients')
      ]);

      if (workoutsRes.ok) {
        const workoutData = await workoutsRes.json();
        setWorkouts(workoutData.workouts || []);
      }

      if (clientsRes.ok) {
        const clientData = await clientsRes.json();
        setClients(clientData.clients || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWorkout = async () => {
    try {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWorkout)
      });

      if (response.ok) {
        setShowCreateForm(false);
        setNewWorkout({
          name: '',
          description: '',
          clientId: '',
          scheduledDate: '',
          notes: ''
        });
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao criar treino');
      }
    } catch (error) {
      console.error('Error creating workout:', error);
      alert('Erro ao criar treino');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { label: statusLabels.DRAFT, className: 'bg-surface-secondary text-foreground-secondary' },
      ACTIVE: { label: statusLabels.ACTIVE, className: 'bg-gold/20 text-gold' },
      COMPLETED: { label: statusLabels.COMPLETED, className: 'bg-accent-success/20 text-accent-success' },
      ARCHIVED: { label: statusLabels.ARCHIVED, className: 'bg-surface-muted text-foreground-muted' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    const iconProps = { size: 16 };
    switch (status) {
      case 'DRAFT': return <FileText {...iconProps} className="text-foreground-secondary" />;
      case 'ACTIVE': return <Play {...iconProps} className="text-gold" />;
      case 'COMPLETED': return <CheckCircle {...iconProps} className="text-accent-success" />;
      case 'ARCHIVED': return <FileText {...iconProps} className="text-foreground-muted" />;
      default: return <FileText {...iconProps} className="text-foreground-secondary" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Não agendado';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const filteredWorkouts = workouts.filter(workout =>
    workout.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workout.client.user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full mx-auto"></div>
          <p className="text-foreground-secondary mt-4">Carregando treinos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Treinos</h1>
          <p className="text-foreground-secondary">
            Crie e gerencie treinos personalizados para seus clientes ({workouts.length} treinos)
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-gold text-black hover:bg-gold-dark"
        >
          <Plus size={16} className="mr-2" />
          Novo Treino
        </Button>
      </div>

      {/* Create Workout Form */}
      {showCreateForm && (
        <Card className="border-gold/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus size={20} className="text-gold" />
              Criar Novo Treino
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nome do Treino *
                </label>
                <input
                  type="text"
                  value={newWorkout.name}
                  onChange={(e) => setNewWorkout({ ...newWorkout, name: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:border-gold focus:outline-none text-foreground"
                  placeholder="Ex: Treino A - Peito e Tríceps"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Cliente *
                </label>
                <select
                  value={newWorkout.clientId}
                  onChange={(e) => setNewWorkout({ ...newWorkout, clientId: e.target.value })}
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Data Agendada
                </label>
                <input
                  type="date"
                  value={newWorkout.scheduledDate}
                  onChange={(e) => setNewWorkout({ ...newWorkout, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:border-gold focus:outline-none text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Descrição
                </label>
                <input
                  type="text"
                  value={newWorkout.description}
                  onChange={(e) => setNewWorkout({ ...newWorkout, description: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:border-gold focus:outline-none text-foreground"
                  placeholder="Descrição breve do treino"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Observações
              </label>
              <textarea
                value={newWorkout.notes}
                onChange={(e) => setNewWorkout({ ...newWorkout, notes: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:border-gold focus:outline-none text-foreground resize-none"
                rows={3}
                placeholder="Observações especiais para o cliente..."
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={createWorkout}
                disabled={!newWorkout.name || !newWorkout.clientId}
                className="bg-gold text-black hover:bg-gold-dark"
              >
                Criar Treino
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
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-muted" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar treinos ou clientes..."
                className="pl-10 pr-4 py-2 w-full rounded-lg border border-border bg-surface focus:border-gold focus:outline-none text-foreground"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-border bg-surface rounded-lg focus:border-gold focus:outline-none text-foreground"
            >
              <option value="">Todos os status</option>
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
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

      {/* Workouts List */}
      <div className="space-y-4">
        {filteredWorkouts.length === 0 ? (
          <div className="text-center py-12">
            <Dumbbell size={48} className="text-foreground-muted mx-auto mb-4" />
            <p className="text-foreground-secondary">Nenhum treino encontrado</p>
            <p className="text-foreground-muted text-sm">
              {workouts.length === 0 ? 'Crie seu primeiro treino!' : 'Tente ajustar os filtros'}
            </p>
          </div>
        ) : (
          filteredWorkouts.map((workout) => (
            <Card key={workout.id} className="hover:border-gold/20 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gold/10">
                      {getStatusIcon(workout.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground text-lg">{workout.name}</h3>
                        {getStatusBadge(workout.status)}
                      </div>

                      {workout.description && (
                        <p className="text-foreground-secondary text-sm mb-2">
                          {workout.description}
                        </p>
                      )}

                      <div className="flex items-center gap-6 text-sm text-foreground-secondary">
                        <span className="flex items-center gap-1">
                          <User size={14} />
                          {workout.client.user.name || workout.client.user.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity size={14} />
                          {workout._count.exercises} exercícios
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(workout.scheduledDate)}
                        </span>
                        {workout.completedAt && (
                          <span className="flex items-center gap-1">
                            <CheckCircle size={14} />
                            Concluído em {formatDate(workout.completedAt)}
                          </span>
                        )}
                      </div>

                      {workout.notes && (
                        <div className="mt-3 p-3 bg-surface-hover rounded border-l-4 border-gold">
                          <p className="text-sm text-foreground italic">"{workout.notes}"</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button size="sm" variant="outline">
                      <Eye size={14} className="mr-1" />
                      Ver
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit size={14} className="mr-1" />
                      Editar
                    </Button>
                    {workout.status === 'DRAFT' && (
                      <Button size="sm" className="bg-gold text-black hover:bg-gold-dark">
                        <Play size={14} className="mr-1" />
                        Ativar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}