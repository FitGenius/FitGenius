import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

import { store } from './src/store/store';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthContext } from './src/contexts/AuthContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { HealthProvider } from './src/contexts/HealthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { LoadingScreen } from './src/screens/LoadingScreen';

const Stack = createNativeStackNavigator();

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts
        await Font.loadAsync({
          'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
          'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
          'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
          'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
        });

        // Check for existing auth token
        const token = await AsyncStorage.getItem('authToken');
        const userData = await AsyncStorage.getItem('userData');

        if (token && userData) {
          setUser(JSON.parse(userData));
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.warn('Error during app initialization:', e);
      } finally {
        setIsLoading(false);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  const authContextValue = {
    isAuthenticated,
    user,
    login: async (userData: any, token: string) => {
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
    },
    logout: async () => {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      setUser(null);
      setIsAuthenticated(false);
    },
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Provider store={store}>
      <ThemeProvider>
        <AuthContext.Provider value={authContextValue}>
          <NotificationProvider>
            <HealthProvider>
              <NavigationContainer>
                <StatusBar style="auto" />
                {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
              </NavigationContainer>
            </HealthProvider>
          </NotificationProvider>
        </AuthContext.Provider>
      </ThemeProvider>
    </Provider>
  );
}