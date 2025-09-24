import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-svg-charts';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../contexts/ThemeContext';
import { useHealth } from '../contexts/HealthContext';
import { healthService } from '../services/HealthService';

const { width } = Dimensions.get('window');

interface ProgressData {
  weight: Array<{ date: string; value: number }>;
  bodyFat: Array<{ date: string; value: number }>;
  muscle: Array<{ date: string; value: number }>;
  workouts: Array<{ date: string; count: number; calories: number }>;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    date: string;
    type: 'streak' | 'goal' | 'record' | 'milestone';
    value?: number;
  }>;
  goals: Array<{
    id: string;
    title: string;
    current: number;
    target: number;
    unit: string;
    progress: number;
  }>;
}

const MOCK_PROGRESS_DATA: ProgressData = {
  weight: [
    { date: '2024-01-01', value: 75.2 },
    { date: '2024-01-08', value: 74.8 },
    { date: '2024-01-15', value: 74.5 },
    { date: '2024-01-22', value: 74.1 },
    { date: '2024-01-29', value: 73.8 },
  ],
  bodyFat: [
    { date: '2024-01-01', value: 18.5 },
    { date: '2024-01-08', value: 18.2 },
    { date: '2024-01-15', value: 17.9 },
    { date: '2024-01-22', value: 17.6 },
    { date: '2024-01-29', value: 17.3 },
  ],
  muscle: [
    { date: '2024-01-01', value: 32.1 },
    { date: '2024-01-08', value: 32.3 },
    { date: '2024-01-15', value: 32.6 },
    { date: '2024-01-22', value: 32.9 },
    { date: '2024-01-29', value: 33.2 },
  ],
  workouts: [
    { date: '2024-01-22', count: 3, calories: 840 },
    { date: '2024-01-23', count: 4, calories: 1120 },
    { date: '2024-01-24', count: 2, calories: 560 },
    { date: '2024-01-25', count: 5, calories: 1400 },
    { date: '2024-01-26', count: 3, calories: 840 },
    { date: '2024-01-27', count: 4, calories: 1120 },
    { date: '2024-01-28', count: 6, calories: 1680 },
  ],
  achievements: [
    {
      id: '1',
      title: 'Sequência de 7 dias',
      description: 'Treinou por 7 dias consecutivos',
      date: '2024-01-28',
      type: 'streak',
      value: 7,
    },
    {
      id: '2',
      title: 'Meta de peso atingida',
      description: 'Perdeu 2kg em 1 mês',
      date: '2024-01-29',
      type: 'goal',
      value: 2,
    },
    {
      id: '3',
      title: 'Recorde no supino',
      description: 'Novo recorde pessoal: 85kg',
      date: '2024-01-25',
      type: 'record',
      value: 85,
    },
  ],
  goals: [
    {
      id: '1',
      title: 'Perder peso',
      current: 73.8,
      target: 72,
      unit: 'kg',
      progress: 78,
    },
    {
      id: '2',
      title: 'Ganhar massa muscular',
      current: 33.2,
      target: 35,
      unit: 'kg',
      progress: 67,
    },
    {
      id: '3',
      title: 'Treinos por semana',
      current: 4,
      target: 5,
      unit: 'treinos',
      progress: 80,
    },
    {
      id: '4',
      title: '10.000 passos/dia',
      current: 8543,
      target: 10000,
      unit: 'passos',
      progress: 85,
    },
  ],
};

export const ProgressScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { healthData } = useHealth();
  const [progressData, setProgressData] = useState<ProgressData>(MOCK_PROGRESS_DATA);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | '3months' | 'year'>('month');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // In real app, fetch progress data from API
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const getAchievementIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'streak': return 'flame';
      case 'goal': return 'trophy';
      case 'record': return 'medal';
      case 'milestone': return 'star';
      default: return 'checkmark-circle';
    }
  };

  const getAchievementColor = (type: string): string => {
    switch (type) {
      case 'streak': return '#FF5722';
      case 'goal': return '#FFD700';
      case 'record': return '#4CAF50';
      case 'milestone': return '#9C27B0';
      default: return theme.colors.primary;
    }
  };

  const StatCard = ({
    title,
    current,
    previous,
    unit,
    color,
    icon
  }: {
    title: string;
    current: number;
    previous: number;
    unit: string;
    color: string;
    icon: keyof typeof Ionicons.glyphMap;
  }) => {
    const change = current - previous;
    const changePercent = previous > 0 ? ((change / previous) * 100).toFixed(1) : 0;
    const isPositive = change > 0;

    return (
      <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.statHeader}>
          <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon} size={20} color={color} />
          </View>
          <Text style={[styles.statTitle, { color: theme.colors.text }]}>
            {title}
          </Text>
        </View>
        <Text style={[styles.statValue, { color: theme.colors.text }]}>
          {current}{unit}
        </Text>
        <View style={styles.statChange}>
          <Ionicons
            name={isPositive ? 'trending-up' : 'trending-down'}
            size={14}
            color={isPositive ? '#4CAF50' : '#F44336'}
          />
          <Text style={[
            styles.statChangeText,
            { color: isPositive ? '#4CAF50' : '#F44336' }
          ]}>
            {Math.abs(change)}{unit} ({changePercent}%)
          </Text>
        </View>
      </View>
    );
  };

  const GoalCard = ({ goal }: { goal: typeof progressData.goals[0] }) => (
    <View style={[styles.goalCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.goalHeader}>
        <Text style={[styles.goalTitle, { color: theme.colors.text }]}>
          {goal.title}
        </Text>
        <Text style={[styles.goalProgress, { color: theme.colors.primary }]}>
          {goal.progress}%
        </Text>
      </View>
      <Text style={[styles.goalValues, { color: theme.colors.textSecondary }]}>
        {goal.current} / {goal.target} {goal.unit}
      </Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressBarBg, { backgroundColor: theme.colors.border }]}>
          <View
            style={[
              styles.progressBarFill,
              { backgroundColor: theme.colors.primary, width: `${goal.progress}%` }
            ]}
          />
        </View>
      </View>
    </View>
  );

  const AchievementCard = ({ achievement }: { achievement: typeof progressData.achievements[0] }) => (
    <View style={[styles.achievementCard, { backgroundColor: theme.colors.surface }]}>
      <View style={[
        styles.achievementIcon,
        { backgroundColor: getAchievementColor(achievement.type) }
      ]}>
        <Ionicons
          name={getAchievementIcon(achievement.type)}
          size={24}
          color="white"
        />
      </View>
      <View style={styles.achievementContent}>
        <Text style={[styles.achievementTitle, { color: theme.colors.text }]}>
          {achievement.title}
        </Text>
        <Text style={[styles.achievementDescription, { color: theme.colors.textSecondary }]}>
          {achievement.description}
        </Text>
        <Text style={[styles.achievementDate, { color: theme.colors.textSecondary }]}>
          {new Date(achievement.date).toLocaleDateString('pt-BR')}
        </Text>
      </View>
    </View>
  );

  const PeriodButton = ({
    period,
    label,
    active
  }: {
    period: typeof selectedPeriod;
    label: string;
    active: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.periodButton,
        {
          backgroundColor: active ? theme.colors.primary : 'transparent',
          borderColor: theme.colors.border,
        }
      ]}
      onPress={() => setSelectedPeriod(period)}
    >
      <Text style={[
        styles.periodButtonText,
        { color: active ? 'white' : theme.colors.text }
      ]}>
        {label}
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
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Meu Progresso
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          >
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Period Selection */}
        <View style={styles.periodContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.periodButtons}>
              <PeriodButton period="week" label="Semana" active={selectedPeriod === 'week'} />
              <PeriodButton period="month" label="Mês" active={selectedPeriod === 'month'} />
              <PeriodButton period="3months" label="3 Meses" active={selectedPeriod === '3months'} />
              <PeriodButton period="year" label="Ano" active={selectedPeriod === 'year'} />
            </View>
          </ScrollView>
        </View>

        {/* Key Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Estatísticas Principais
          </Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Peso"
              current={73.8}
              previous={75.2}
              unit="kg"
              color="#2196F3"
              icon="scale"
            />
            <StatCard
              title="Gordura"
              current={17.3}
              previous={18.5}
              unit="%"
              color="#FF9800"
              icon="body"
            />
            <StatCard
              title="Músculo"
              current={33.2}
              previous={32.1}
              unit="kg"
              color="#4CAF50"
              icon="fitness"
            />
            <StatCard
              title="Treinos"
              current={28}
              previous={22}
              unit=""
              color="#9C27B0"
              icon="barbell"
            />
          </View>
        </View>

        {/* Weight Chart */}
        <View style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
              Evolução do Peso
            </Text>
            <Text style={[styles.chartPeriod, { color: theme.colors.textSecondary }]}>
              Últimos 30 dias
            </Text>
          </View>
          <LineChart
            style={styles.chart}
            data={progressData.weight.map(d => d.value)}
            svg={{ stroke: theme.colors.primary, strokeWidth: 2 }}
            contentInset={{ top: 20, bottom: 20 }}
          />
        </View>

        {/* Goals */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Metas Atuais
          </Text>
          {progressData.goals.map(goal => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </View>

        {/* Recent Achievements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Conquistas Recentes
            </Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
                Ver todas
              </Text>
            </TouchableOpacity>
          </View>
          {progressData.achievements.slice(0, 3).map(achievement => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </View>

        {/* Body Composition */}
        <View style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
            Composição Corporal
          </Text>
          <View style={styles.bodyComposition}>
            <View style={styles.compositionItem}>
              <View style={[styles.compositionColor, { backgroundColor: '#4CAF50' }]} />
              <Text style={[styles.compositionLabel, { color: theme.colors.text }]}>
                Músculo: 33.2kg (45%)
              </Text>
            </View>
            <View style={styles.compositionItem}>
              <View style={[styles.compositionColor, { backgroundColor: '#FF9800' }]} />
              <Text style={[styles.compositionLabel, { color: theme.colors.text }]}>
                Gordura: 12.8kg (17.3%)
              </Text>
            </View>
            <View style={styles.compositionItem}>
              <View style={[styles.compositionColor, { backgroundColor: '#2196F3' }]} />
              <Text style={[styles.compositionLabel, { color: theme.colors.text }]}>
                Outros: 27.8kg (37.7%)
              </Text>
            </View>
          </View>
        </View>

        {/* Weekly Activity */}
        <View style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
            Atividade Semanal
          </Text>
          <BarChart
            style={styles.chart}
            data={progressData.workouts.map(d => d.count)}
            svg={{ fill: theme.colors.primary }}
            contentInset={{ top: 20, bottom: 20 }}
            spacingInner={0.2}
          />
          <View style={styles.weekDays}>
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day, index) => (
              <Text key={index} style={[styles.weekDay, { color: theme.colors.textSecondary }]}>
                {day}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  scrollView: {
    flex: 1,
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 12,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statChangeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 12,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chartPeriod: {
    fontSize: 12,
  },
  chart: {
    height: 200,
    marginBottom: 16,
  },
  goalCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  goalProgress: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  goalValues: {
    fontSize: 12,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  achievementCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 12,
    marginBottom: 4,
  },
  achievementDate: {
    fontSize: 10,
  },
  bodyComposition: {
    gap: 12,
  },
  compositionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compositionColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  compositionLabel: {
    fontSize: 14,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weekDay: {
    fontSize: 12,
  },
});