import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { DashboardScreen } from '../screens/DashboardScreen';
import { WorkoutsScreen } from '../screens/WorkoutsScreen';
import { WorkoutDetailScreen } from '../screens/WorkoutDetailScreen';
import { WorkoutSessionScreen } from '../screens/WorkoutSessionScreen';
import { NutritionScreen } from '../screens/NutritionScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { AIAssistantScreen } from '../screens/AIAssistantScreen';
import { GymFinderScreen } from '../screens/GymFinderScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ClientsScreen } from '../screens/ClientsScreen';
import { ClientDetailScreen } from '../screens/ClientDetailScreen';

import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

// Professional Stack Navigators
const WorkoutsStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WorkoutsList" component={WorkoutsScreen} />
      <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
      <Stack.Screen name="WorkoutSession" component={WorkoutSessionScreen} />
    </Stack.Navigator>
  );
};

const ClientsStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ClientsList" component={ClientsScreen} />
      <Stack.Screen name="ClientDetail" component={ClientDetailScreen} />
    </Stack.Navigator>
  );
};

// Main Tab Navigator
const MainTabs = () => {
  const { theme } = useTheme();
  const { user } = useAuth();

  const isProfessional = user?.role === 'PROFESSIONAL';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Workouts':
              iconName = focused ? 'fitness' : 'fitness-outline';
              break;
            case 'Nutrition':
              iconName = focused ? 'restaurant' : 'restaurant-outline';
              break;
            case 'Progress':
              iconName = focused ? 'trending-up' : 'trending-up-outline';
              break;
            case 'AI':
              iconName = focused ? 'brain' : 'brain-outline';
              break;
            case 'Clients':
              iconName = focused ? 'people' : 'people-outline';
              break;
            default:
              iconName = 'help-outline';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingBottom: 5,
          height: 85,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Início' }}
      />

      {isProfessional && (
        <Tab.Screen
          name="Clients"
          component={ClientsStack}
          options={{ title: 'Clientes' }}
        />
      )}

      <Tab.Screen
        name="Workouts"
        component={WorkoutsStack}
        options={{ title: 'Treinos' }}
      />

      <Tab.Screen
        name="Nutrition"
        component={NutritionScreen}
        options={{ title: 'Nutrição' }}
      />

      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{ title: 'Progresso' }}
      />

      <Tab.Screen
        name="AI"
        component={AIAssistantScreen}
        options={{ title: 'AI Assistant' }}
      />
    </Tab.Navigator>
  );
};

// Drawer Navigator (for additional screens)
export const AppNavigator = () => {
  const { theme } = useTheme();

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: theme.colors.surface,
        },
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.textSecondary,
      }}
    >
      <Drawer.Screen
        name="MainTabs"
        component={MainTabs}
        options={{
          title: 'FitGenius',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="GymFinder"
        component={GymFinderScreen}
        options={{
          title: 'Encontrar Academia',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="location-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Meu Perfil',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Configurações',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};