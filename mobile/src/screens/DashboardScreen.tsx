import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useHealth } from '../contexts/HealthContext';
import { healthService } from '../services/HealthService';
import { notificationService } from '../services/NotificationService';

const { width } = Dimensions.get('window');

interface DashboardStats {
  todaySteps: number;
  todayCalories: number;
  weeklyWorkouts: number;
  currentStreak: number;
  nextWorkout?: {
    name: string;
    time: string;
    type: string;
  };
}

export const DashboardScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { healthData } = useHealth();
  const [stats, setStats] = useState<DashboardStats>({
    todaySteps: 0,
    todayCalories: 0,
    weeklyWorkouts: 0,
    currentStreak: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    initializeDashboard();
    updateGreeting();
  }, []);

  const updateGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Bom dia');
    } else if (hour < 18) {
      setGreeting('Boa tarde');
    } else {
      setGreeting('Boa noite');
    }
  };

  const initializeDashboard = async () => {
    try {
      // Initialize services
      await healthService.initialize();
      await notificationService.initialize();

      // Load dashboard data
      await loadDashboardData();
    } catch (error) {
      console.error('Error initializing dashboard:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      const [steps, weeklyData] = await Promise.all([
        healthService.getTodaySteps(),
        healthService.getWeeklyHealthSummary(),
      ]);

      setStats({
        todaySteps: steps,
        todayCalories: Math.round(steps * 0.04),
        weeklyWorkouts: 4, // Mock data - would come from API
        currentStreak: 7, // Mock data - would come from API
        nextWorkout: {
          name: 'Treino de Peito',
          time: '14:30',
          type: 'strength'
        }
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, []);

  const handleWorkoutStart = () => {
    navigation.navigate('Workouts');
  };

  const handleAIAssistant = () => {
    navigation.navigate('AI');
  };

  const handleProgress = () => {
    navigation.navigate('Progress');
  };

  const StatCard = ({
    title,
    value,
    unit,
    icon,
    color,
    onPress
  }: {
    title: string;
    value: string | number;
    unit?: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.statCard, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.colors.text }]}>
        {value}
        {unit && <Text style={styles.statUnit}>{unit}</Text>}
      </Text>
      <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
              {greeting}!
            </Text>
            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {user?.name || 'Usuário'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.profileButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.openDrawer()}
          >
            <Ionicons name="person" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Next Workout Card */}
        {stats.nextWorkout && (
          <TouchableOpacity
            style={styles.nextWorkoutCard}
            onPress={handleWorkoutStart}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primary + 'DD']}
              style={styles.nextWorkoutGradient}
            >
              <View style={styles.nextWorkoutContent}>
                <View>
                  <Text style={styles.nextWorkoutLabel}>Próximo Treino</Text>
                  <Text style={styles.nextWorkoutName}>{stats.nextWorkout.name}</Text>
                  <Text style={styles.nextWorkoutTime}>{stats.nextWorkout.time}</Text>
                </View>
                <View style={styles.nextWorkoutIcon}>
                  <Ionicons name="fitness" size={32} color="white" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Passos Hoje"
            value={stats.todaySteps.toLocaleString()}
            icon="footsteps"
            color="#4CAF50"
            onPress={handleProgress}
          />
          <StatCard
            title="Calorias"
            value={stats.todayCalories}
            unit=" kcal"
            icon="flame"
            color="#FF5722"
            onPress={handleProgress}
          />
          <StatCard
            title="Treinos/Semana"
            value={stats.weeklyWorkouts}
            icon="barbell"
            color="#2196F3"
            onPress={handleWorkoutStart}
          />
          <StatCard
            title="Sequência"
            value={stats.currentStreak}
            unit=" dias"
            icon="trophy"
            color="#FFD700"
            onPress={handleProgress}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Ações Rápidas
          </Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: theme.colors.surface }]}
              onPress={handleWorkoutStart}
            >
              <Ionicons name="fitness" size={24} color={theme.colors.primary} />
              <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
                Iniciar Treino
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: theme.colors.surface }]}
              onPress={handleAIAssistant}
            >
              <Ionicons name="chatbubble-ellipses" size={24} color={theme.colors.primary} />
              <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
                AI Assistant
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: theme.colors.surface }]}
              onPress={() => navigation.navigate('Nutrition')}
            >
              <Ionicons name="restaurant" size={24} color={theme.colors.primary} />
              <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
                Nutrição
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Atividade Recente
          </Text>
          <View style={[styles.activityCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#4CAF50' + '20' }]}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              </View>
              <View style={styles.activityText}>
                <Text style={[styles.activityTitle, { color: theme.colors.text }]}>
                  Treino de Pernas Completado
                </Text>
                <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>
                  Há 2 horas
                </Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#FF5722' + '20' }]}>
                <Ionicons name="flame" size={20} color="#FF5722" />
              </View>
              <View style={styles.activityText}>
                <Text style={[styles.activityTitle, { color: theme.colors.text }]}>
                  Meta de calorias atingida!
                </Text>
                <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>
                  Hoje
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
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
  greeting: {
    fontSize: 16,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextWorkoutCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  nextWorkoutGradient: {
    padding: 20,
  },
  nextWorkoutContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextWorkoutLabel: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 4,
  },
  nextWorkoutName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  nextWorkoutTime: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
  },
  nextWorkoutIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statUnit: {
    fontSize: 14,
    fontWeight: 'normal',
    opacity: 0.7,
  },
  statTitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  activityCard: {
    padding: 16,
    borderRadius: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityText: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
  },
});