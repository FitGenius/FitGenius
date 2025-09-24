import { Platform } from 'react-native';
import * as Permissions from 'expo-permissions';
import { Pedometer } from 'expo-sensors';
import * as Location from 'expo-location';
import { wearableService } from './WearableService';

// Health data types
export interface HealthData {
  steps: number;
  distance: number; // in meters
  calories: number;
  heartRate?: number;
  sleepData?: {
    bedTime: Date;
    wakeTime: Date;
    duration: number; // in minutes
    quality: 'poor' | 'fair' | 'good' | 'excellent';
  };
  workout?: {
    type: string;
    startTime: Date;
    endTime: Date;
    duration: number; // in minutes
    calories: number;
    heartRateZones?: {
      zone1: number; // fat burn
      zone2: number; // cardio
      zone3: number; // peak
    };
  };
}

export interface WeeklyHealthSummary {
  totalSteps: number;
  totalDistance: number;
  totalCalories: number;
  averageHeartRate?: number;
  workoutMinutes: number;
  sleepAverage: number;
  trends: {
    steps: 'up' | 'down' | 'stable';
    calories: 'up' | 'down' | 'stable';
    sleep: 'up' | 'down' | 'stable';
  };
}

class HealthService {
  private isInitialized = false;
  private pedometerSubscription: any = null;

  async initialize(): Promise<boolean> {
    try {
      // Request health permissions
      if (Platform.OS === 'ios') {
        const { status } = await Permissions.askAsync(Permissions.MOTION);
        if (status !== 'granted') {
          throw new Error('Health permissions not granted');
        }
      }

      // Initialize pedometer
      const isAvailable = await Pedometer.isAvailableAsync();
      if (!isAvailable) {
        console.warn('Pedometer is not available on this device');
      }

      // Initialize wearable service for Apple Health / Google Fit integration
      await wearableService.initialize();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize health services:', error);
      return false;
    }
  }

  /**
   * Get today's step count
   */
  async getTodaySteps(): Promise<number> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Try to get data from wearables first (more accurate)
      try {
        const wearableData = await wearableService.getUnifiedHealthData();
        if (wearableData && wearableData.steps > 0) {
          return wearableData.steps;
        }
      } catch (wearableError) {
        console.warn('Could not get steps from wearables, falling back to device sensors');
      }

      // Fallback to device pedometer
      const isAvailable = await Pedometer.isAvailableAsync();
      if (!isAvailable) return 0;

      const end = new Date();
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const result = await Pedometer.getStepCountAsync(start, end);
      return result.steps || 0;
    } catch (error) {
      console.error('Error getting step count:', error);
      return 0;
    }
  }

  /**
   * Subscribe to real-time step updates
   */
  subscribeToSteps(callback: (steps: number) => void): () => void {
    if (this.pedometerSubscription) {
      this.pedometerSubscription.remove();
    }

    this.pedometerSubscription = Pedometer.watchStepCount((result) => {
      callback(result.steps || 0);
    });

    return () => {
      if (this.pedometerSubscription) {
        this.pedometerSubscription.remove();
        this.pedometerSubscription = null;
      }
    };
  }

  /**
   * Get weekly health summary
   */
  async getWeeklyHealthSummary(): Promise<WeeklyHealthSummary> {
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);

      // Get step data for the week
      const stepData = await this.getStepsForPeriod(start, end);
      const totalSteps = stepData.reduce((sum, day) => sum + day.steps, 0);

      // Estimate distance (average 0.7 meters per step)
      const totalDistance = totalSteps * 0.7;

      // Estimate calories (average 0.04 calories per step)
      const totalCalories = Math.round(totalSteps * 0.04);

      // Calculate trends (simplified - would be more sophisticated in production)
      const recentSteps = stepData.slice(-3).reduce((sum, day) => sum + day.steps, 0);
      const earlierSteps = stepData.slice(0, 3).reduce((sum, day) => sum + day.steps, 0);

      const stepsTrend = recentSteps > earlierSteps ? 'up' :
                        recentSteps < earlierSteps ? 'down' : 'stable';

      return {
        totalSteps,
        totalDistance,
        totalCalories,
        workoutMinutes: 0, // Would integrate with workout tracking
        sleepAverage: 7.5 * 60, // Default 7.5 hours in minutes
        trends: {
          steps: stepsTrend,
          calories: stepsTrend, // Correlated with steps
          sleep: 'stable'
        }
      };
    } catch (error) {
      console.error('Error getting weekly health summary:', error);
      return {
        totalSteps: 0,
        totalDistance: 0,
        totalCalories: 0,
        workoutMinutes: 0,
        sleepAverage: 0,
        trends: {
          steps: 'stable',
          calories: 'stable',
          sleep: 'stable'
        }
      };
    }
  }

  /**
   * Get steps for a specific period
   */
  private async getStepsForPeriod(start: Date, end: Date): Promise<Array<{date: Date, steps: number}>> {
    const days = [];
    const current = new Date(start);

    while (current <= end) {
      const dayStart = new Date(current);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(current);
      dayEnd.setHours(23, 59, 59, 999);

      try {
        const result = await Pedometer.getStepCountAsync(dayStart, dayEnd);
        days.push({
          date: new Date(current),
          steps: result.steps || 0
        });
      } catch (error) {
        days.push({
          date: new Date(current),
          steps: 0
        });
      }

      current.setDate(current.getDate() + 1);
    }

    return days;
  }

  /**
   * Start a workout session
   */
  async startWorkout(workoutType: string): Promise<{
    sessionId: string;
    startTime: Date;
  }> {
    const sessionId = `workout_${Date.now()}`;
    const startTime = new Date();

    // Store workout start in local storage
    // In a real app, you'd also start health kit workout session

    return {
      sessionId,
      startTime
    };
  }

  /**
   * End a workout session
   */
  async endWorkout(sessionId: string, workoutData: {
    type: string;
    startTime: Date;
    exercises?: Array<{
      name: string;
      sets: number;
      reps: number;
      weight?: number;
    }>;
  }): Promise<{
    duration: number;
    estimatedCalories: number;
    summary: any;
  }> {
    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - workoutData.startTime.getTime()) / 60000); // minutes

    // Estimate calories based on workout type and duration
    const calorieRates: { [key: string]: number } = {
      'strength': 6, // calories per minute
      'cardio': 10,
      'hiit': 12,
      'yoga': 3,
      'stretching': 2
    };

    const rate = calorieRates[workoutData.type.toLowerCase()] || 8;
    const estimatedCalories = Math.round(duration * rate);

    const summary = {
      type: workoutData.type,
      duration,
      estimatedCalories,
      exercises: workoutData.exercises || [],
      heartRateZones: {
        zone1: Math.round(duration * 0.3), // 30% in fat burn
        zone2: Math.round(duration * 0.5), // 50% in cardio
        zone3: Math.round(duration * 0.2)  // 20% in peak
      }
    };

    return {
      duration,
      estimatedCalories,
      summary
    };
  }

  /**
   * Get location for gym/workout location tracking
   */
  async getCurrentLocation(): Promise<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission not granted');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocoding to get address
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: address[0] ?
          `${address[0].street || ''} ${address[0].city || ''}, ${address[0].region || ''}`.trim()
          : undefined
      };

      return locationData;
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }

  /**
   * Find nearby gyms using location
   */
  async findNearbyGyms(radius: number = 5000): Promise<Array<{
    id: string;
    name: string;
    address: string;
    distance: number;
    rating?: number;
    isOpen?: boolean;
  }>> {
    try {
      const location = await this.getCurrentLocation();
      if (!location) return [];

      // In a real implementation, you'd use Google Places API or similar
      // For demo purposes, returning mock data
      const mockGyms = [
        {
          id: 'gym1',
          name: 'SmartFit Academia',
          address: 'Rua das Flores, 123 - Centro',
          distance: 850,
          rating: 4.5,
          isOpen: true
        },
        {
          id: 'gym2',
          name: 'Bio Ritmo',
          address: 'Av. Principal, 456 - Jardins',
          distance: 1200,
          rating: 4.2,
          isOpen: true
        },
        {
          id: 'gym3',
          name: 'Competition',
          address: 'Rua Fitness, 789 - Vila Nova',
          distance: 2100,
          rating: 4.7,
          isOpen: false
        }
      ];

      return mockGyms.filter(gym => gym.distance <= radius);
    } catch (error) {
      console.error('Error finding nearby gyms:', error);
      return [];
    }
  }

  /**
   * Sync health data with backend
   */
  async syncWithBackend(healthData: Partial<HealthData>): Promise<boolean> {
    try {
      // This would sync with your FitGenius backend API
      const response = await fetch('/api/health-data/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add auth header
        },
        body: JSON.stringify({
          ...healthData,
          timestamp: new Date().toISOString(),
          source: 'mobile_app'
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error syncing health data:', error);
      return false;
    }
  }

  /**
   * Get comprehensive health data from wearables
   */
  async getWearableHealthData(): Promise<Partial<HealthData> | null> {
    try {
      const wearableData = await wearableService.getUnifiedHealthData();
      if (!wearableData) return null;

      return {
        steps: wearableData.steps,
        calories: wearableData.calories,
        distance: wearableData.distance,
        heartRate: wearableData.heartRate,
        workout: wearableData.workouts.length > 0 ? {
          type: wearableData.workouts[0].type,
          startTime: wearableData.workouts[0].startDate,
          endTime: wearableData.workouts[0].endDate,
          duration: wearableData.workouts[0].duration,
          calories: wearableData.workouts[0].calories,
        } : undefined,
        sleepData: wearableData.sleep ? {
          bedTime: wearableData.sleep.bedTime,
          wakeTime: wearableData.sleep.wakeTime,
          duration: wearableData.sleep.duration,
          quality: wearableData.sleep.efficiency > 85 ? 'excellent' :
                   wearableData.sleep.efficiency > 70 ? 'good' :
                   wearableData.sleep.efficiency > 50 ? 'fair' : 'poor'
        } : undefined,
      };
    } catch (error) {
      console.error('Error getting wearable health data:', error);
      return null;
    }
  }

  /**
   * Get connected wearable devices
   */
  getConnectedWearables() {
    return wearableService.getConnectedDevices();
  }

  /**
   * Force sync with all wearables
   */
  async syncWearables(): Promise<{ success: boolean; synced: number; failed: number }> {
    return await wearableService.forceSyncAll();
  }

  /**
   * Start heart rate monitoring from wearables
   */
  async startHeartRateMonitoring(callback: (heartRate: number) => void): Promise<() => void> {
    return await wearableService.startHeartRateMonitoring(callback);
  }

  /**
   * Get sleep data from wearables
   */
  async getSleepData(date: Date = new Date()) {
    return await wearableService.getSleepData(date);
  }

  /**
   * Sync completed workout to wearables
   */
  async syncWorkoutToWearables(workoutData: {
    type: string;
    startTime: Date;
    endTime: Date;
    calories: number;
    exercises: any[];
  }): Promise<boolean> {
    return await wearableService.syncWorkoutToWearables(workoutData);
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.pedometerSubscription) {
      this.pedometerSubscription.remove();
      this.pedometerSubscription = null;
    }
    wearableService.cleanup();
  }
}

export const healthService = new HealthService();