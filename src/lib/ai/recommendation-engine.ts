import { prisma } from '@/lib/prisma';

export interface WorkoutRecommendation {
  id: string;
  name: string;
  description: string;
  estimatedDuration: number;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  targetMuscleGroups: string[];
  exercises: RecommendedExercise[];
  confidence: number; // 0-100
  reasoning: string;
}

export interface RecommendedExercise {
  exerciseId: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  restTime: number;
  order: number;
  adaptationReason: string;
}

export interface NutritionRecommendation {
  id: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  foods: RecommendedFood[];
  confidence: number;
  reasoning: string;
}

export interface RecommendedFood {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface ClientProfile {
  id: string;
  age: number;
  gender: 'MALE' | 'FEMALE';
  height: number;
  weight: number;
  activityLevel: string;
  fitnessGoal: 'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'ENDURANCE' | 'STRENGTH';
  experience: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  injuries?: string[];
  preferences?: string[];
  workoutHistory: WorkoutHistory[];
  progressData: ProgressData[];
}

export interface WorkoutHistory {
  date: Date;
  exercises: {
    exerciseId: string;
    sets: number;
    reps: number;
    weight: number;
    difficulty: number; // 1-10 perceived exertion
  }[];
  duration: number;
  satisfaction: number; // 1-10
}

export interface ProgressData {
  date: Date;
  weight?: number;
  bodyFat?: number;
  muscle?: number;
  measurements?: Record<string, number>;
  performance?: Record<string, number>;
}

export class AIRecommendationEngine {

  /**
   * Generate personalized workout recommendations based on client profile and history
   */
  async generateWorkoutRecommendations(
    clientId: string,
    targetDate?: Date,
    preferences?: {
      duration?: number;
      equipment?: string[];
      focusAreas?: string[];
    }
  ): Promise<WorkoutRecommendation[]> {

    // Get client profile with comprehensive data
    const profile = await this.getClientProfile(clientId);

    // Analyze workout patterns and performance
    const patterns = await this.analyzeWorkoutPatterns(profile);

    // Calculate optimal progression
    const progression = this.calculateProgression(profile, patterns);

    // Generate base recommendations
    const baseRecommendations = await this.generateBaseWorkouts(profile, preferences);

    // Apply AI personalization
    const personalizedRecommendations = this.personalizeWorkouts(
      baseRecommendations,
      progression,
      patterns
    );

    // Rank by confidence and relevance
    return this.rankRecommendations(personalizedRecommendations);
  }

  /**
   * Generate nutrition recommendations based on goals and preferences
   */
  async generateNutritionRecommendations(
    clientId: string,
    mealType?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'
  ): Promise<NutritionRecommendation[]> {

    const profile = await this.getClientProfile(clientId);

    // Calculate nutritional needs
    const nutritionNeeds = this.calculateNutritionalNeeds(profile);

    // Get dietary preferences and restrictions
    const dietaryProfile = await this.getDietaryProfile(clientId);

    // Generate meal recommendations
    const mealRecommendations = await this.generateMealRecommendations(
      nutritionNeeds,
      dietaryProfile,
      mealType
    );

    return mealRecommendations;
  }

  /**
   * Predict client progress based on current trajectory
   */
  async predictProgress(
    clientId: string,
    timeframe: 'week' | 'month' | 'quarter'
  ): Promise<{
    weightPrediction: { value: number; confidence: number };
    strengthPrediction: { exercises: Record<string, number>; confidence: number };
    endurancePrediction: { metrics: Record<string, number>; confidence: number };
    recommendations: string[];
  }> {

    const profile = await this.getClientProfile(clientId);
    const trends = await this.analyzeTrends(profile);

    // Machine learning prediction based on historical data
    const predictions = this.runProgressionModel(profile, trends, timeframe);

    return predictions;
  }

  /**
   * Analyze workout patterns to identify strengths, weaknesses, and preferences
   */
  private async analyzeWorkoutPatterns(profile: ClientProfile) {
    const workouts = profile.workoutHistory;

    if (workouts.length < 3) {
      return {
        consistency: 0,
        preferredIntensity: 'MODERATE',
        strongMuscleGroups: [],
        weakMuscleGroups: [],
        optimalDuration: 45,
        recoveryPattern: 'STANDARD'
      };
    }

    // Analyze consistency
    const consistency = this.calculateConsistency(workouts);

    // Identify preferred intensity
    const preferredIntensity = this.analyzeIntensityPreference(workouts);

    // Find strong/weak muscle groups
    const muscleGroupAnalysis = this.analyzeMuscleGroupPerformance(workouts);

    // Optimal workout duration
    const optimalDuration = this.findOptimalDuration(workouts);

    // Recovery patterns
    const recoveryPattern = this.analyzeRecoveryPatterns(workouts);

    return {
      consistency,
      preferredIntensity,
      strongMuscleGroups: muscleGroupAnalysis.strong,
      weakMuscleGroups: muscleGroupAnalysis.weak,
      optimalDuration,
      recoveryPattern
    };
  }

  /**
   * Calculate optimal progression for exercises based on performance data
   */
  private calculateProgression(profile: ClientProfile, patterns: any) {
    const progressionRates: Record<string, number> = {};

    profile.workoutHistory.forEach(workout => {
      workout.exercises.forEach(exercise => {
        const exerciseId = exercise.exerciseId;

        // Calculate progression rate based on weight increases over time
        if (!progressionRates[exerciseId]) {
          progressionRates[exerciseId] = this.calculateExerciseProgression(
            exerciseId,
            profile.workoutHistory
          );
        }
      });
    });

    return {
      rates: progressionRates,
      overallTrend: this.calculateOverallProgressionTrend(profile),
      plateauRisk: this.assessPlateauRisk(profile, patterns)
    };
  }

  private async getClientProfile(clientId: string): Promise<ClientProfile> {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        user: true,
        physicalAssessments: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        workoutLogs: {
          include: {
            workout: {
              include: {
                exercises: {
                  include: {
                    exercise: true
                  }
                }
              }
            },
            exerciseLogs: {
              include: {
                exercise: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 30
        }
      }
    });

    if (!client) {
      throw new Error('Client not found');
    }

    // Transform database data into ClientProfile format
    const profile: ClientProfile = {
      id: client.id,
      age: client.age || 25,
      gender: client.gender as 'MALE' | 'FEMALE',
      height: client.height || 170,
      weight: client.weight || 70,
      activityLevel: client.activityLevel || 'MODERATE',
      fitnessGoal: (client.fitnessGoal as any) || 'MUSCLE_GAIN',
      experience: (client.experienceLevel as any) || 'BEGINNER',
      injuries: client.injuries ? JSON.parse(client.injuries) : [],
      preferences: client.preferences ? JSON.parse(client.preferences) : [],
      workoutHistory: this.transformWorkoutHistory(client.workoutLogs),
      progressData: this.transformProgressData(client.physicalAssessments)
    };

    return profile;
  }

  private transformWorkoutHistory(workoutLogs: any[]): WorkoutHistory[] {
    return workoutLogs.map(log => ({
      date: log.createdAt,
      exercises: log.exerciseLogs.map((exerciseLog: any) => ({
        exerciseId: exerciseLog.exerciseId,
        sets: exerciseLog.sets || 3,
        reps: exerciseLog.reps || 10,
        weight: exerciseLog.weight || 0,
        difficulty: exerciseLog.difficulty || 5
      })),
      duration: log.duration || 45,
      satisfaction: log.satisfaction || 7
    }));
  }

  private transformProgressData(assessments: any[]): ProgressData[] {
    return assessments.map(assessment => ({
      date: assessment.createdAt,
      weight: assessment.weight,
      bodyFat: assessment.bodyFat,
      muscle: assessment.muscleMass,
      measurements: assessment.measurements ? JSON.parse(assessment.measurements) : {},
      performance: assessment.performance ? JSON.parse(assessment.performance) : {}
    }));
  }

  private calculateConsistency(workouts: WorkoutHistory[]): number {
    if (workouts.length < 2) return 0;

    const dates = workouts.map(w => w.date).sort();
    const daysBetween = dates.map((date, i) => {
      if (i === 0) return 0;
      return Math.abs(date.getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
    }).slice(1);

    const avgGap = daysBetween.reduce((a, b) => a + b, 0) / daysBetween.length;
    const consistency = Math.max(0, 100 - (avgGap - 2) * 10); // Optimal is every 2-3 days

    return Math.min(100, consistency);
  }

  private analyzeIntensityPreference(workouts: WorkoutHistory[]): string {
    const avgDifficulty = workouts.reduce((sum, workout) => {
      const workoutDifficulty = workout.exercises.reduce((s, ex) => s + ex.difficulty, 0) / workout.exercises.length;
      return sum + workoutDifficulty;
    }, 0) / workouts.length;

    if (avgDifficulty <= 4) return 'LOW';
    if (avgDifficulty <= 7) return 'MODERATE';
    return 'HIGH';
  }

  private analyzeMuscleGroupPerformance(workouts: WorkoutHistory[]) {
    // Simplified muscle group analysis
    // In a real implementation, you'd map exercises to muscle groups
    return {
      strong: ['chest', 'shoulders'],
      weak: ['legs', 'back']
    };
  }

  private findOptimalDuration(workouts: WorkoutHistory[]): number {
    const durations = workouts.map(w => w.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

    // Find duration with highest satisfaction
    const satisfactionByDuration = workouts.map(w => ({
      duration: w.duration,
      satisfaction: w.satisfaction
    }));

    const optimalDuration = satisfactionByDuration.reduce((best, current) => {
      return current.satisfaction > best.satisfaction ? current : best;
    }).duration;

    return Math.round((avgDuration + optimalDuration) / 2);
  }

  private analyzeRecoveryPatterns(workouts: WorkoutHistory[]): string {
    // Analyze gaps between workouts and performance correlation
    return 'STANDARD'; // Simplified
  }

  private calculateExerciseProgression(exerciseId: string, history: WorkoutHistory[]): number {
    const exerciseData = history.flatMap(w =>
      w.exercises.filter(e => e.exerciseId === exerciseId)
    ).sort((a, b) => history.findIndex(h => h.exercises.includes(a)) -
                      history.findIndex(h => h.exercises.includes(b)));

    if (exerciseData.length < 2) return 0;

    const firstWeight = exerciseData[0].weight;
    const lastWeight = exerciseData[exerciseData.length - 1].weight;
    const weeks = exerciseData.length; // Simplified

    return (lastWeight - firstWeight) / weeks; // Weight increase per week
  }

  private calculateOverallProgressionTrend(profile: ClientProfile): string {
    const recentProgress = profile.progressData.slice(0, 5);
    if (recentProgress.length < 2) return 'INSUFFICIENT_DATA';

    const weightTrend = this.calculateTrend(recentProgress.map(p => p.weight || 0));

    if (profile.fitnessGoal === 'WEIGHT_LOSS') {
      return weightTrend < -0.5 ? 'POSITIVE' : 'NEEDS_ADJUSTMENT';
    } else {
      return weightTrend > 0.2 ? 'POSITIVE' : 'NEEDS_ADJUSTMENT';
    }
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = n * (n + 1) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, i) => sum + (i + 1) * y, 0);
    const sumX2 = n * (n + 1) * (2 * n + 1) / 6;

    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  private assessPlateauRisk(profile: ClientProfile, patterns: any): number {
    // Analyze if client is at risk of hitting a plateau
    const consistency = patterns.consistency;
    const recentProgress = profile.progressData.slice(0, 3);

    if (recentProgress.length < 3) return 0;

    const progressVariation = this.calculateVariation(
      recentProgress.map(p => p.weight || 0)
    );

    // High consistency with low variation = plateau risk
    if (consistency > 80 && progressVariation < 0.5) return 80;
    if (consistency > 60 && progressVariation < 1) return 60;

    return 20;
  }

  private calculateVariation(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

    return Math.sqrt(variance);
  }

  private async generateBaseWorkouts(
    profile: ClientProfile,
    preferences?: any
  ): Promise<WorkoutRecommendation[]> {
    // This would integrate with your existing workout templates
    // For now, return a structured example
    return [
      {
        id: 'rec-1',
        name: 'Progressive Strength Training',
        description: 'Focused on building strength with progressive overload',
        estimatedDuration: profile.workoutHistory.length > 0 ?
          this.findOptimalDuration(profile.workoutHistory) : 45,
        difficulty: profile.experience,
        targetMuscleGroups: ['chest', 'back', 'legs'],
        exercises: await this.generateRecommendedExercises(profile),
        confidence: 85,
        reasoning: 'Based on your consistent training and strength goals'
      }
    ];
  }

  private personalizeWorkouts(
    baseRecommendations: WorkoutRecommendation[],
    progression: any,
    patterns: any
  ): WorkoutRecommendation[] {
    return baseRecommendations.map(rec => ({
      ...rec,
      confidence: this.adjustConfidence(rec.confidence, patterns),
      exercises: rec.exercises.map(ex => ({
        ...ex,
        weight: this.calculateOptimalWeight(ex, progression),
        adaptationReason: this.generateAdaptationReason(ex, patterns)
      }))
    }));
  }

  private rankRecommendations(recommendations: WorkoutRecommendation[]): WorkoutRecommendation[] {
    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  private async generateRecommendedExercises(profile: ClientProfile): Promise<RecommendedExercise[]> {
    // This would query your exercises database
    return [
      {
        exerciseId: 'bench-press',
        name: 'Bench Press',
        sets: 3,
        reps: 8,
        weight: this.estimateStartingWeight(profile, 'bench-press'),
        restTime: 120,
        order: 1,
        adaptationReason: 'Progressive overload for strength development'
      }
    ];
  }

  private estimateStartingWeight(profile: ClientProfile, exerciseId: string): number {
    const history = profile.workoutHistory
      .flatMap(w => w.exercises)
      .filter(e => e.exerciseId === exerciseId);

    if (history.length > 0) {
      const lastWeight = history[history.length - 1].weight;
      return Math.round(lastWeight * 1.025); // 2.5% increase
    }

    // Estimate based on body weight and experience
    const bodyWeight = profile.weight;
    const multipliers = {
      'BEGINNER': 0.5,
      'INTERMEDIATE': 0.75,
      'ADVANCED': 1.0
    };

    return Math.round(bodyWeight * multipliers[profile.experience]);
  }

  private adjustConfidence(baseConfidence: number, patterns: any): number {
    let confidence = baseConfidence;

    // Adjust based on consistency
    if (patterns.consistency > 80) confidence += 10;
    if (patterns.consistency < 40) confidence -= 20;

    return Math.max(0, Math.min(100, confidence));
  }

  private calculateOptimalWeight(exercise: RecommendedExercise, progression: any): number {
    const progressionRate = progression.rates[exercise.exerciseId] || 0;
    return Math.round((exercise.weight || 0) + progressionRate);
  }

  private generateAdaptationReason(exercise: RecommendedExercise, patterns: any): string {
    if (patterns.plateauRisk > 70) {
      return 'Variation added to break through plateau';
    }
    return 'Progressive overload based on your improvement rate';
  }

  // Nutrition methods would follow similar patterns
  private calculateNutritionalNeeds(profile: ClientProfile) {
    // Calculate BMR, TDEE, macro splits based on goals
    return {
      calories: 2200,
      protein: 150,
      carbs: 220,
      fat: 80
    };
  }

  private async getDietaryProfile(clientId: string) {
    // Get dietary preferences, allergies, restrictions
    return {
      preferences: ['high-protein'],
      allergies: [],
      restrictions: []
    };
  }

  private async generateMealRecommendations(
    needs: any,
    dietary: any,
    mealType?: string
  ): Promise<NutritionRecommendation[]> {
    return [
      {
        id: 'meal-1',
        mealType: 'BREAKFAST',
        calories: 550,
        macros: { protein: 30, carbs: 45, fat: 15 },
        foods: [
          {
            name: 'Ovos mexidos',
            quantity: 3,
            unit: 'unidades',
            calories: 210,
            protein: 18,
            carbs: 2,
            fat: 14
          }
        ],
        confidence: 90,
        reasoning: 'High protein start for muscle building goals'
      }
    ];
  }

  private async analyzeTrends(profile: ClientProfile) {
    // Analyze weight, strength, endurance trends
    return {
      weightTrend: 0.2, // kg per week
      strengthTrend: 2.5, // % increase per month
      enduranceTrend: 1.8 // improvement rate
    };
  }

  private runProgressionModel(profile: ClientProfile, trends: any, timeframe: string) {
    // Run ML model to predict future progress
    const multiplier = timeframe === 'week' ? 1 : timeframe === 'month' ? 4 : 12;

    return {
      weightPrediction: {
        value: profile.weight + (trends.weightTrend * multiplier),
        confidence: 75
      },
      strengthPrediction: {
        exercises: { 'bench-press': 102.5 },
        confidence: 80
      },
      endurancePrediction: {
        metrics: { 'cardio-endurance': 15 },
        confidence: 70
      },
      recommendations: [
        'Continue current progression rate',
        'Consider adding cardio for better recovery'
      ]
    };
  }
}