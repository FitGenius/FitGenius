'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dumbbell,
  Plus,
  Search,
  Filter,
  Heart,
  Zap,
  Target,
  Play,
  Image,
  MoreVertical,
  Users,
  Eye,
  Edit
} from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  description: string | null;
  instructions: string | null;
  category: 'CHEST' | 'BACK' | 'SHOULDERS' | 'ARMS' | 'LEGS' | 'ABS' | 'CARDIO' | 'FUNCTIONAL';
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  muscleGroups: string | null;
  equipment: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
  isPublic: boolean;
  createdBy: {
    user: {
      name: string;
      email: string;
    };
  } | null;
  _count: {
    workoutExercises: number;
  };
}

const categoryLabels = {
  CHEST: 'Peito',
  BACK: 'Costas',
  SHOULDERS: 'Ombros',
  ARMS: 'Braços',
  LEGS: 'Pernas',
  ABS: 'Abdômen',
  CARDIO: 'Cardio',
  FUNCTIONAL: 'Funcional'
};

const difficultyLabels = {
  BEGINNER: 'Iniciante',
  INTERMEDIATE: 'Intermediário',
  ADVANCED: 'Avançado'
};

const categoryIcons = {
  CHEST: Heart,
  BACK: Target,
  SHOULDERS: Dumbbell,
  ARMS: Zap,
  LEGS: Target,
  ABS: Target,
  CARDIO: Heart,
  FUNCTIONAL: Dumbbell
};

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newExercise, setNewExercise] = useState({
    name: '',
    description: '',
    instructions: '',
    category: 'CHEST',
    difficulty: 'BEGINNER',
    muscleGroups: [] as string[],
    equipment: '',
    videoUrl: '',
    imageUrl: '',
    isPublic: false
  });

  useEffect(() => {
    fetchExercises();
  }, [searchTerm, selectedCategory, selectedDifficulty]);

  const fetchExercises = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);

      const response = await fetch(`/api/exercises?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setExercises(data.exercises || []);
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const createExercise = async () => {
    try {
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExercise)
      });

      if (response.ok) {
        setShowCreateForm(false);
        setNewExercise({
          name: '',
          description: '',
          instructions: '',
          category: 'CHEST',
          difficulty: 'BEGINNER',
          muscleGroups: [],
          equipment: '',
          videoUrl: '',
          imageUrl: '',
          isPublic: false
        });
        fetchExercises();
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao criar exercício');
      }
    } catch (error) {
      console.error('Error creating exercise:', error);
      alert('Erro ao criar exercício');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER':
        return 'bg-accent-success/20 text-accent-success';
      case 'INTERMEDIATE':
        return 'bg-gold/20 text-gold';
      case 'ADVANCED':
        return 'bg-accent-danger/20 text-accent-danger';
      default:
        return 'bg-surface-secondary text-foreground-secondary';
    }
  };

  const getCategoryIcon = (category: keyof typeof categoryIcons) => {
    const IconComponent = categoryIcons[category];
    return <IconComponent size={16} className="text-gold" />;
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full mx-auto"></div>
          <p className="text-foreground-secondary mt-4">Carregando exercícios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Biblioteca de Exercícios</h1>
          <p className="text-foreground-secondary">
            Gerencie exercícios e crie treinos personalizados ({exercises.length} exercícios)
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-gold text-black hover:bg-gold-dark"
        >
          <Plus size={16} className="mr-2" />
          Novo Exercício
        </Button>
      </div>

      {/* Create Exercise Form */}
      {showCreateForm && (
        <Card className="border-gold/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus size={20} className="text-gold" />
              Criar Novo Exercício
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nome do Exercício *
                </label>
                <input
                  type="text"
                  value={newExercise.name}
                  onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:border-gold focus:outline-none text-foreground"
                  placeholder="Ex: Supino Reto"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Categoria *
                </label>
                <select
                  value={newExercise.category}
                  onChange={(e) => setNewExercise({ ...newExercise, category: e.target.value as any })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:border-gold focus:outline-none text-foreground"
                >
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Dificuldade
                </label>
                <select
                  value={newExercise.difficulty}
                  onChange={(e) => setNewExercise({ ...newExercise, difficulty: e.target.value as any })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:border-gold focus:outline-none text-foreground"
                >
                  {Object.entries(difficultyLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Equipamento
                </label>
                <input
                  type="text"
                  value={newExercise.equipment}
                  onChange={(e) => setNewExercise({ ...newExercise, equipment: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:border-gold focus:outline-none text-foreground"
                  placeholder="Ex: Barra, Halteres, Cabo"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Descrição
              </label>
              <textarea
                value={newExercise.description}
                onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:border-gold focus:outline-none text-foreground resize-none"
                rows={3}
                placeholder="Breve descrição do exercício..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Instruções de Execução
              </label>
              <textarea
                value={newExercise.instructions}
                onChange={(e) => setNewExercise({ ...newExercise, instructions: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:border-gold focus:outline-none text-foreground resize-none"
                rows={4}
                placeholder="Instruções detalhadas de como executar o exercício..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={newExercise.isPublic}
                onChange={(e) => setNewExercise({ ...newExercise, isPublic: e.target.checked })}
                className="rounded border-border"
              />
              <label htmlFor="isPublic" className="text-sm text-foreground">
                Tornar público (outros profissionais podem usar)
              </label>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={createExercise}
                disabled={!newExercise.name || !newExercise.category}
                className="bg-gold text-black hover:bg-gold-dark"
              >
                Criar Exercício
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
                placeholder="Buscar exercícios..."
                className="pl-10 pr-4 py-2 w-full rounded-lg border border-border bg-surface focus:border-gold focus:outline-none text-foreground"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-border bg-surface rounded-lg focus:border-gold focus:outline-none text-foreground"
            >
              <option value="">Todas as categorias</option>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 border border-border bg-surface rounded-lg focus:border-gold focus:outline-none text-foreground"
            >
              <option value="">Todas as dificuldades</option>
              {Object.entries(difficultyLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Exercises Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exercises.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Dumbbell size={48} className="text-foreground-muted mx-auto mb-4" />
            <p className="text-foreground-secondary">Nenhum exercício encontrado</p>
            <p className="text-foreground-muted text-sm">Crie seu primeiro exercício!</p>
          </div>
        ) : (
          exercises.map((exercise) => (
            <Card key={exercise.id} className="hover:border-gold/20 transition-colors">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(exercise.category)}
                      <h3 className="font-semibold text-foreground">{exercise.name}</h3>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreVertical size={14} />
                    </Button>
                  </div>

                  {exercise.description && (
                    <p className="text-sm text-foreground-secondary line-clamp-2">
                      {exercise.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-gold/20 text-gold">
                      {categoryLabels[exercise.category]}
                    </Badge>
                    <Badge className={getDifficultyColor(exercise.difficulty)}>
                      {difficultyLabels[exercise.difficulty]}
                    </Badge>
                    {exercise.isPublic && (
                      <Badge className="bg-accent-info/20 text-accent-info">
                        Público
                      </Badge>
                    )}
                  </div>

                  {exercise.equipment && (
                    <p className="text-xs text-foreground-muted">
                      Equipamento: {exercise.equipment}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-4 text-xs text-foreground-muted">
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {exercise._count.workoutExercises} treinos
                      </span>
                      {exercise.videoUrl && (
                        <span className="flex items-center gap-1">
                          <Play size={12} />
                          Vídeo
                        </span>
                      )}
                      {exercise.imageUrl && (
                        <span className="flex items-center gap-1">
                          <Image size={12} />
                          Imagem
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline">
                        <Eye size={14} className="mr-1" />
                        Ver
                      </Button>
                      {!exercise.isPublic && (
                        <Button size="sm" variant="outline">
                          <Edit size={14} />
                        </Button>
                      )}
                    </div>
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