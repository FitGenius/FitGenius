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
import { LinearGradient } from 'expo-linear-gradient';
import { PieChart } from 'react-native-svg-charts';

import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

interface NutritionData {
  calories: {
    consumed: number;
    target: number;
    remaining: number;
  };
  macros: {
    carbs: { consumed: number; target: number; percentage: number };
    protein: { consumed: number; target: number; percentage: number };
    fat: { consumed: number; target: number; percentage: number };
  };
  water: {
    consumed: number; // in ml
    target: number;
  };
  meals: Array<{
    id: string;
    name: string;
    time: string;
    calories: number;
    foods: Array<{
      name: string;
      calories: number;
      quantity: string;
    }>;
  }>;
}

const MOCK_NUTRITION_DATA: NutritionData = {
  calories: {
    consumed: 1450,
    target: 2100,
    remaining: 650,
  },
  macros: {
    carbs: { consumed: 180, target: 260, percentage: 69 },
    protein: { consumed: 95, target: 130, percentage: 73 },
    fat: { consumed: 45, target: 70, percentage: 64 },
  },
  water: {
    consumed: 1800,
    target: 2500,
  },
  meals: [
    {
      id: '1',
      name: 'Café da Manhã',
      time: '08:00',
      calories: 380,
      foods: [
        { name: 'Aveia com banana', calories: 250, quantity: '100g' },
        { name: 'Whey protein', calories: 130, quantity: '30g' },
      ]
    },
    {
      id: '2',
      name: 'Almoço',
      time: '12:30',
      calories: 620,
      foods: [
        { name: 'Peito de frango grelhado', calories: 280, quantity: '150g' },
        { name: 'Arroz integral', calories: 220, quantity: '100g' },
        { name: 'Brócolis', calories: 35, quantity: '100g' },
        { name: 'Azeite', calories: 85, quantity: '10ml' },
      ]
    },
    {
      id: '3',
      name: 'Lanche',
      time: '16:00',
      calories: 200,
      foods: [
        { name: 'Iogurte grego', calories: 100, quantity: '150g' },
        { name: 'Castanha do Pará', calories: 100, quantity: '15g' },
      ]
    },
    {
      id: '4',
      name: 'Jantar',
      time: '19:30',
      calories: 250,
      foods: [
        { name: 'Salmão grelhado', calories: 180, quantity: '100g' },
        { name: 'Salada verde', calories: 70, quantity: '150g' },
      ]
    },
  ]
};

export const NutritionScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [nutritionData, setNutritionData] = useState<NutritionData>(MOCK_NUTRITION_DATA);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // In real app, fetch nutrition data from API
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const addWater = (amount: number) => {
    setNutritionData(prev => ({
      ...prev,
      water: {
        ...prev.water,
        consumed: Math.min(prev.water.consumed + amount, prev.water.target + 500)
      }
    }));
  };

  const getCalorieProgress = () => {
    const percentage = (nutritionData.calories.consumed / nutritionData.calories.target) * 100;
    return Math.min(percentage, 100);
  };

  const getWaterProgress = () => {
    const percentage = (nutritionData.water.consumed / nutritionData.water.target) * 100;
    return Math.min(percentage, 100);
  };

  const MacroCard = ({
    title,
    consumed,
    target,
    percentage,
    color,
    unit = 'g'
  }: {
    title: string;
    consumed: number;
    target: number;
    percentage: number;
    color: string;
    unit?: string;
  }) => (
    <View style={[styles.macroCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.macroHeader}>
        <Text style={[styles.macroTitle, { color: theme.colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.macroPercentage, { color }]}>
          {percentage}%
        </Text>
      </View>
      <View style={styles.macroProgress}>
        <View style={[styles.macroProgressBg, { backgroundColor: color + '20' }]}>
          <View
            style={[
              styles.macroProgressFill,
              { backgroundColor: color, width: `${percentage}%` }
            ]}
          />
        </View>
      </View>
      <Text style={[styles.macroValues, { color: theme.colors.textSecondary }]}>
        {consumed}{unit} / {target}{unit}
      </Text>
    </View>
  );

  const MealCard = ({ meal }: { meal: typeof MOCK_NUTRITION_DATA.meals[0] }) => (
    <TouchableOpacity
      style={[styles.mealCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => {/* Navigate to meal details */}}
    >
      <View style={styles.mealHeader}>
        <View style={styles.mealInfo}>
          <Text style={[styles.mealName, { color: theme.colors.text }]}>
            {meal.name}
          </Text>
          <Text style={[styles.mealTime, { color: theme.colors.textSecondary }]}>
            {meal.time}
          </Text>
        </View>
        <View style={styles.mealCalories}>
          <Text style={[styles.caloriesText, { color: theme.colors.primary }]}>
            {meal.calories} kcal
          </Text>
        </View>
      </View>

      <View style={styles.foodsList}>
        {meal.foods.map((food, index) => (
          <View key={index} style={styles.foodItem}>
            <Text style={[styles.foodName, { color: theme.colors.text }]}>
              {food.name}
            </Text>
            <Text style={[styles.foodDetails, { color: theme.colors.textSecondary }]}>
              {food.quantity} • {food.calories} kcal
            </Text>
          </View>
        ))}
      </View>
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
            Nutrição
          </Text>
          <Text style={[styles.headerDate, { color: theme.colors.textSecondary }]}>
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </Text>
        </View>

        {/* Calories Overview */}
        <View style={[styles.caloriesCard, { backgroundColor: theme.colors.surface }]}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primary + 'CC']}
            style={styles.caloriesGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.caloriesContent}>
              <View style={styles.caloriesLeft}>
                <Text style={styles.caloriesTitle}>Calorias</Text>
                <Text style={styles.caloriesConsumed}>
                  {nutritionData.calories.consumed}
                </Text>
                <Text style={styles.caloriesSubtext}>
                  de {nutritionData.calories.target} kcal
                </Text>
                <Text style={styles.caloriesRemaining}>
                  {nutritionData.calories.remaining} restantes
                </Text>
              </View>

              <View style={styles.caloriesRight}>
                <View style={styles.caloriesCircle}>
                  <View
                    style={[
                      styles.caloriesProgress,
                      {
                        transform: [{
                          rotate: `${(getCalorieProgress() * 360) / 100}deg`
                        }]
                      }
                    ]}
                  />
                  <Text style={styles.caloriesPercent}>
                    {Math.round(getCalorieProgress())}%
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Macros */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Macronutrientes
          </Text>
          <View style={styles.macrosGrid}>
            <MacroCard
              title="Carboidratos"
              consumed={nutritionData.macros.carbs.consumed}
              target={nutritionData.macros.carbs.target}
              percentage={nutritionData.macros.carbs.percentage}
              color="#FF9800"
            />
            <MacroCard
              title="Proteínas"
              consumed={nutritionData.macros.protein.consumed}
              target={nutritionData.macros.protein.target}
              percentage={nutritionData.macros.protein.percentage}
              color="#4CAF50"
            />
            <MacroCard
              title="Gorduras"
              consumed={nutritionData.macros.fat.consumed}
              target={nutritionData.macros.fat.target}
              percentage={nutritionData.macros.fat.percentage}
              color="#2196F3"
            />
          </View>
        </View>

        {/* Water Intake */}
        <View style={[styles.waterCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.waterHeader}>
            <View style={styles.waterInfo}>
              <Text style={[styles.waterTitle, { color: theme.colors.text }]}>
                Hidratação
              </Text>
              <Text style={[styles.waterAmount, { color: theme.colors.textSecondary }]}>
                {nutritionData.water.consumed}ml / {nutritionData.water.target}ml
              </Text>
            </View>
            <Text style={[styles.waterPercent, { color: '#2196F3' }]}>
              {Math.round(getWaterProgress())}%
            </Text>
          </View>

          <View style={styles.waterProgress}>
            <View style={[styles.waterProgressBg, { backgroundColor: '#2196F3' + '20' }]}>
              <View
                style={[
                  styles.waterProgressFill,
                  { backgroundColor: '#2196F3', width: `${getWaterProgress()}%` }
                ]}
              />
            </View>
          </View>

          <View style={styles.waterButtons}>
            <TouchableOpacity
              style={[styles.waterButton, { backgroundColor: '#2196F3' + '20' }]}
              onPress={() => addWater(250)}
            >
              <Ionicons name="water" size={16} color="#2196F3" />
              <Text style={[styles.waterButtonText, { color: '#2196F3' }]}>
                +250ml
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.waterButton, { backgroundColor: '#2196F3' + '20' }]}
              onPress={() => addWater(500)}
            >
              <Ionicons name="water" size={16} color="#2196F3" />
              <Text style={[styles.waterButtonText, { color: '#2196F3' }]}>
                +500ml
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Meals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Refeições de Hoje
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {nutritionData.meals.map(meal => (
            <MealCard key={meal.id} meal={meal} />
          ))}
        </View>

        {/* Quick Add Foods */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Adicionar Rapidamente
          </Text>
          <View style={styles.quickAddGrid}>
            {[
              { name: 'Banana', calories: 105, icon: '🍌' },
              { name: 'Whey Protein', calories: 130, icon: '🥤' },
              { name: 'Ovo', calories: 70, icon: '🥚' },
              { name: 'Água', calories: 0, icon: '💧' },
            ].map((food, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.quickAddButton, { backgroundColor: theme.colors.surface }]}
              >
                <Text style={styles.quickAddEmoji}>{food.icon}</Text>
                <Text style={[styles.quickAddName, { color: theme.colors.text }]}>
                  {food.name}
                </Text>
                <Text style={[styles.quickAddCalories, { color: theme.colors.textSecondary }]}>
                  {food.calories} kcal
                </Text>
              </TouchableOpacity>
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
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
  caloriesCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  caloriesGradient: {
    padding: 20,
  },
  caloriesContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  caloriesLeft: {
    flex: 1,
  },
  caloriesTitle: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 4,
  },
  caloriesConsumed: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  caloriesSubtext: {
    color: 'white',
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 4,
  },
  caloriesRemaining: {
    color: 'white',
    fontSize: 12,
    opacity: 0.7,
  },
  caloriesRight: {
    alignItems: 'center',
  },
  caloriesCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  caloriesProgress: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'white',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  caloriesPercent: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macrosGrid: {
    gap: 12,
  },
  macroCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  macroTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  macroPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  macroProgress: {
    marginBottom: 8,
  },
  macroProgressBg: {
    height: 6,
    borderRadius: 3,
  },
  macroProgressFill: {
    height: 6,
    borderRadius: 3,
  },
  macroValues: {
    fontSize: 12,
  },
  waterCard: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  waterInfo: {},
  waterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  waterAmount: {
    fontSize: 12,
  },
  waterPercent: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  waterProgress: {
    marginBottom: 12,
  },
  waterProgressBg: {
    height: 8,
    borderRadius: 4,
  },
  waterProgressFill: {
    height: 8,
    borderRadius: 4,
  },
  waterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  waterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  waterButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  mealCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealInfo: {},
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  mealTime: {
    fontSize: 12,
  },
  mealCalories: {},
  caloriesText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  foodsList: {
    gap: 8,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodName: {
    fontSize: 14,
    flex: 1,
  },
  foodDetails: {
    fontSize: 12,
  },
  quickAddGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAddButton: {
    width: (width - 56) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickAddEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickAddName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  quickAddCalories: {
    fontSize: 12,
  },
});