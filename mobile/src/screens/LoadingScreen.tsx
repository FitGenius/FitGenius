import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const LoadingScreen = () => {
  return (
    <LinearGradient
      colors={['#6366F1', '#8B5CF6']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.logo}>FitGenius</Text>
        <ActivityIndicator size="large" color="white" style={styles.loader} />
        <Text style={styles.subtitle}>Seu personal trainer inteligente</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  loader: {
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});