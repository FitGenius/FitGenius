import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  rest: number; // seconds
  instructions?: string;
  muscleGroups: string[];
}

interface Workout {
  id: string;
  name: string;
  type: 'strength' | 'cardio' | 'hiit' | 'yoga' | 'stretching';
  duration: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  exercises: Exercise[];
  calories: number;
  description: string;
  tags: string[];
}

const MOCK_WORKOUTS: Workout[] = [
  {
    id: '1',
    name: 'Treino de Peito',
    type: 'strength',
    duration: 45,
    difficulty: 'intermediate',
    calories: 280,
    description: 'Treino focado no desenvolvimento do peitoral',
    tags: ['Peito', 'Força', 'Hipertrofia'],
    exercises: [
      {
        id: '1',
        name: 'Supino Reto',
        sets: 4,
        reps: 10,
        weight: 60,
        rest: 120,
        muscleGroups: ['Peitoral', 'Tríceps'],
        instructions: 'Mantenha as escápulas retraídas e desça a barra até tocar o peito'
      },
      {
        id: '2',
        name: 'Supino Inclinado',
        sets: 3,
        reps: 12,
        weight: 50,
        rest: 90,
        muscleGroups: ['Peitoral Superior'],
        instructions: 'Ajuste o banco em 30-45 graus para trabalhar o peitoral superior'
      },
      {
        id: '3',
        name: 'Crucifixo',
        sets: 3,
        reps: 15,
        weight: 20,
        rest: 60,
        muscleGroups: ['Peitoral'],
        instructions: 'Movimento de abertura focando na contração do peitoral'
      },
    ]
  },
  {
    id: '2',
    name: 'HIIT Cardio',
    type: 'hiit',
    duration: 20,
    difficulty: 'advanced',
    calories: 300,
    description: 'Treino intervalado de alta intensidade',
    tags: ['Cardio', 'HIIT', 'Queima'],
    exercises: [
      {
        id: '4',
        name: 'Burpees',
        sets: 4,
        reps: 15,
        rest: 30,
        muscleGroups: ['Corpo Todo'],
        instructions: 'Execute o movimento completo: agachamento, prancha, flexão, salto'
      },
      {
        id: '5',
        name: 'Mountain Climbers',
        sets: 4,
        reps: 20,
        rest: 30,
        muscleGroups: ['Core', 'Cardio'],
        instructions: 'Alterne as pernas rapidamente mantendo o core ativado'
      },
    ]
  },
  {
    id: '3',
    name: 'Yoga Relaxante',
    type: 'yoga',
    duration: 30,
    difficulty: 'beginner',
    calories: 120,
    description: 'Sequência de yoga para relaxamento e flexibilidade',
    tags: ['Yoga', 'Flexibilidade', 'Relaxamento'],
    exercises: [
      {
        id: '6',
        name: 'Saudação ao Sol',
        sets: 3,
        reps: 1,
        rest: 0,
        muscleGroups: ['Corpo Todo'],
        instructions: 'Flua pela sequência respeitando sua respiração'
      },
    ]
  },
];

export const WorkoutsScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>(MOCK_WORKOUTS);
  const [filteredWorkouts, setFilteredWorkouts] = useState<Workout[]>(MOCK_WORKOUTS);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'strength' | 'cardio' | 'hiit' | 'yoga'>('all');

  useEffect(() => {
    filterWorkouts();
  }, [searchText, selectedFilter, workouts]);

  const filterWorkouts = () => {
    let filtered = workouts;

    // Filter by type
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(workout => workout.type === selectedFilter);
    }

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(workout =>
        workout.name.toLowerCase().includes(searchText.toLowerCase()) ||
        workout.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase()))
      );
    }

    setFilteredWorkouts(filtered);
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // In real app, fetch workouts from API
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const handleStartWorkout = (workout: Workout) => {
    Alert.alert(
      'Iniciar Treino',
      `Deseja começar o treino "${workout.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Iniciar',
          onPress: () => navigation.navigate('WorkoutSession', { workout })
        }
      ]
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return theme.colors.primary;
    }
  };

  const getTypeIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'strength': return 'barbell';
      case 'cardio': return 'heart';
      case 'hiit': return 'flash';
      case 'yoga': return 'leaf';
      case 'stretching': return 'body';
      default: return 'fitness';
    }
  };

  const FilterButton = ({
    title,
    value,
    active
  }: {
    title: string;
    value: typeof selectedFilter;
    active: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        {
          backgroundColor: active ? theme.colors.primary : theme.colors.surface,
          borderColor: active ? theme.colors.primary : theme.colors.border,
        }
      ]}
      onPress={() => setSelectedFilter(value)}
    >
      <Text style={[
        styles.filterButtonText,
        { color: active ? 'white' : theme.colors.text }
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const WorkoutCard = ({ workout }: { workout: Workout }) => (
    <TouchableOpacity
      style={[styles.workoutCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => navigation.navigate('WorkoutDetail', { workout })}
    >
      <View style={styles.workoutHeader}>
        <View style={styles.workoutTitleRow}>
          <View style={[styles.typeIcon, { backgroundColor: theme.colors.primary + '20' }]}>
            <Ionicons name={getTypeIcon(workout.type)} size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.workoutInfo}>
            <Text style={[styles.workoutName, { color: theme.colors.text }]}>
              {workout.name}
            </Text>
            <Text style={[styles.workoutDescription, { color: theme.colors.textSecondary }]}>
              {workout.description}
            </Text>
          </View>
          <View style={[
            styles.difficultyBadge,
            { backgroundColor: getDifficultyColor(workout.difficulty) + '20' }
          ]}>
            <Text style={[
              styles.difficultyText,
              { color: getDifficultyColor(workout.difficulty) }
            ]}>
              {workout.difficulty === 'beginner' ? 'Iniciante' :
               workout.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.workoutStats}>
        <View style={styles.statItem}>
          <Ionicons name="time" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
            {workout.duration} min
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="flame" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
            {workout.calories} kcal
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="fitness" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
            {workout.exercises.length} exercícios
          </Text>
        </View>
      </View>

      <View style={styles.workoutTags}>
        {workout.tags.slice(0, 3).map((tag, index) => (
          <View key={index} style={[styles.tag, { backgroundColor: theme.colors.primary + '10' }]}>
            <Text style={[styles.tagText, { color: theme.colors.primary }]}>
              {tag}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.startButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => handleStartWorkout(workout)}
      >
        <Ionicons name="play" size={16} color="white" />
        <Text style={styles.startButtonText}>Iniciar Treino</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Meus Treinos
        </Text>
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: theme.colors.surface }]}
          onPress={() => {/* Add workout creation */}}
        >
          <Ionicons name="add" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Buscar treinos..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        <FilterButton title="Todos" value="all" active={selectedFilter === 'all'} />
        <FilterButton title="Força" value="strength" active={selectedFilter === 'strength'} />
        <FilterButton title="Cardio" value="cardio" active={selectedFilter === 'cardio'} />
        <FilterButton title="HIIT" value="hiit" active={selectedFilter === 'hiit'} />
        <FilterButton title="Yoga" value="yoga" active={selectedFilter === 'yoga'} />
      </ScrollView>

      {/* Workouts List */}
      <FlatList
        data={filteredWorkouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <WorkoutCard workout={item} />}
        contentContainerStyle={styles.workoutsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="fitness" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
              Nenhum treino encontrado
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  workoutsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  workoutCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  workoutHeader: {
    marginBottom: 12,
  },
  workoutTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  workoutDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  workoutStats: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  workoutTags: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  startButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 12,
  },
});