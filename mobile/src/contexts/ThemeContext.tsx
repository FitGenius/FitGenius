import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  info: string;
}

interface Theme {
  colors: ThemeColors;
  dark: boolean;
}

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: 'light' | 'dark' | 'system') => void;
  themeMode: 'light' | 'dark' | 'system';
}

const lightTheme: Theme = {
  dark: false,
  colors: {
    primary: '#6366F1',
    secondary: '#8B5CF6',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#1E293B',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
  },
};

const darkTheme: Theme = {
  dark: true,
  colors: {
    primary: '#818CF8',
    secondary: '#A78BFA',
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    border: '#334155',
    error: '#F87171',
    success: '#34D399',
    warning: '#FBBF24',
    info: '#60A5FA',
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');
  const [theme, setCurrentTheme] = useState<Theme>(
    systemColorScheme === 'dark' ? darkTheme : lightTheme
  );

  useEffect(() => {
    loadThemePreference();
  }, []);

  useEffect(() => {
    updateTheme();
  }, [themeMode, systemColorScheme]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_mode');
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeMode(savedTheme as 'light' | 'dark' | 'system');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const updateTheme = () => {
    let newTheme: Theme;

    switch (themeMode) {
      case 'light':
        newTheme = lightTheme;
        break;
      case 'dark':
        newTheme = darkTheme;
        break;
      case 'system':
      default:
        newTheme = systemColorScheme === 'dark' ? darkTheme : lightTheme;
        break;
    }

    setCurrentTheme(newTheme);
  };

  const setTheme = async (mode: 'light' | 'dark' | 'system') => {
    try {
      setThemeMode(mode);
      await AsyncStorage.setItem('theme_mode', mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme.dark ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const contextValue: ThemeContextType = {
    theme,
    isDark: theme.dark,
    toggleTheme,
    setTheme,
    themeMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};