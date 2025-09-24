/**
 * Conflict Resolution System
 * Handles conflicts that occur during data synchronization
 */

interface ConflictData {
  entityType: string;
  entityId: string;
  localData: any;
  serverData: any;
  localTimestamp: Date;
  serverTimestamp: Date;
  conflictType: 'update_conflict' | 'delete_conflict' | 'concurrent_creation';
}

interface ConflictResolution {
  action: 'use_local' | 'use_server' | 'merge' | 'manual';
  mergedData?: any;
  requiresUserInput?: boolean;
}

interface MergeStrategy {
  (localData: any, serverData: any): any;
}

class ConflictResolver {
  private mergeStrategies = new Map<string, MergeStrategy>();
  private userPreferences: Record<string, string> = {};

  constructor() {
    this.initializeDefaultStrategies();
    this.loadUserPreferences();
  }

  private initializeDefaultStrategies(): void {
    // Workout merge strategy
    this.mergeStrategies.set('workout', (local: any, server: any) => {
      return {
        id: local.id || server.id,
        name: this.pickNewer(local.name, server.name, local.lastModified, server.lastModified),
        description: this.pickNewer(local.description, server.description, local.lastModified, server.lastModified),
        type: this.pickNewer(local.type, server.type, local.lastModified, server.lastModified),
        duration: Math.max(local.duration || 0, server.duration || 0),
        completed: local.completed || server.completed,
        notes: this.mergeNotes(local.notes, server.notes),
        exercises: this.mergeArrays(local.exercises, server.exercises, 'id'),
        startedAt: local.startedAt || server.startedAt,
        completedAt: local.completedAt || server.completedAt,
        lastModified: new Date(Math.max(
          new Date(local.lastModified).getTime(),
          new Date(server.lastModified).getTime()
        )),
        version: Math.max(local.version || 0, server.version || 0) + 1,
        tenantId: local.tenantId || server.tenantId,
        syncStatus: 'synced' as const,
      };
    });

    // Exercise merge strategy
    this.mergeStrategies.set('exercise', (local: any, server: any) => {
      return {
        id: local.id || server.id,
        workoutId: local.workoutId || server.workoutId,
        exerciseId: local.exerciseId || server.exerciseId,
        name: this.pickNewer(local.name, server.name, local.lastModified, server.lastModified),
        sets: this.mergeArrays(local.sets, server.sets, 'id'),
        restTime: this.pickNewer(local.restTime, server.restTime, local.lastModified, server.lastModified),
        notes: this.mergeNotes(local.notes, server.notes),
        order: Math.min(local.order || 0, server.order || 0),
        lastModified: new Date(Math.max(
          new Date(local.lastModified).getTime(),
          new Date(server.lastModified).getTime()
        )),
        version: Math.max(local.version || 0, server.version || 0) + 1,
        tenantId: local.tenantId || server.tenantId,
        syncStatus: 'synced' as const,
      };
    });

    // Set merge strategy
    this.mergeStrategies.set('set', (local: any, server: any) => {
      return {
        id: local.id || server.id,
        workoutExerciseId: local.workoutExerciseId || server.workoutExerciseId,
        reps: Math.max(local.reps || 0, server.reps || 0),
        weight: Math.max(local.weight || 0, server.weight || 0),
        duration: Math.max(local.duration || 0, server.duration || 0),
        distance: Math.max(local.distance || 0, server.distance || 0),
        restTime: this.pickNewer(local.restTime, server.restTime, local.lastModified, server.lastModified),
        completed: local.completed || server.completed,
        order: Math.min(local.order || 0, server.order || 0),
        lastModified: new Date(Math.max(
          new Date(local.lastModified).getTime(),
          new Date(server.lastModified).getTime()
        )),
        version: Math.max(local.version || 0, server.version || 0) + 1,
        tenantId: local.tenantId || server.tenantId,
        syncStatus: 'synced' as const,
      };
    });

    // User profile merge strategy
    this.mergeStrategies.set('user', (local: any, server: any) => {
      return {
        id: local.id || server.id,
        email: server.email, // Server authority for email
        name: this.pickNewer(local.name, server.name, local.lastModified, server.lastModified),
        profile: this.mergeUserProfile(local.profile, server.profile),
        lastModified: new Date(Math.max(
          new Date(local.lastModified).getTime(),
          new Date(server.lastModified).getTime()
        )),
        version: Math.max(local.version || 0, server.version || 0) + 1,
        tenantId: local.tenantId || server.tenantId,
        syncStatus: 'synced' as const,
      };
    });
  }

  private loadUserPreferences(): void {
    try {
      const stored = localStorage.getItem('conflictResolutionPreferences');
      if (stored) {
        this.userPreferences = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load conflict resolution preferences:', error);
    }
  }

  private saveUserPreferences(): void {
    try {
      localStorage.setItem('conflictResolutionPreferences', JSON.stringify(this.userPreferences));
    } catch (error) {
      console.error('Failed to save conflict resolution preferences:', error);
    }
  }

  async resolve(conflict: ConflictData): Promise<ConflictResolution> {
    // Check for user preference for this conflict type
    const preferenceKey = `${conflict.entityType}_${conflict.conflictType}`;
    const userPreference = this.userPreferences[preferenceKey];

    if (userPreference && userPreference !== 'ask') {
      return this.applyPreference(conflict, userPreference);
    }

    // Automatic resolution strategies
    return this.resolveAutomatically(conflict);
  }

  private resolveAutomatically(conflict: ConflictData): ConflictResolution {
    const { entityType, localData, serverData, localTimestamp, serverTimestamp, conflictType } = conflict;

    // Handle different conflict types
    switch (conflictType) {
      case 'delete_conflict':
        // If one side deleted and other modified, ask user
        return { action: 'manual', requiresUserInput: true };

      case 'concurrent_creation':
        // Merge if possible, otherwise ask user
        if (this.canAutoMerge(entityType)) {
          return { action: 'merge', mergedData: this.merge(conflict) };
        }
        return { action: 'manual', requiresUserInput: true };

      case 'update_conflict':
        // Try automatic merge strategies
        return this.resolveUpdateConflict(conflict);

      default:
        return { action: 'manual', requiresUserInput: true };
    }
  }

  private resolveUpdateConflict(conflict: ConflictData): ConflictResolution {
    const { entityType, localData, serverData, localTimestamp, serverTimestamp } = conflict;

    // Simple timestamp-based resolution for critical fields
    if (this.hasCriticalFieldConflict(localData, serverData)) {
      // Use server data for critical conflicts
      return { action: 'use_server' };
    }

    // Try to merge non-conflicting changes
    if (this.canAutoMerge(entityType)) {
      const mergedData = this.merge(conflict);
      if (mergedData) {
        return { action: 'merge', mergedData };
      }
    }

    // Fallback to timestamp-based resolution
    if (localTimestamp > serverTimestamp) {
      return { action: 'use_local' };
    } else {
      return { action: 'use_server' };
    }
  }

  private applyPreference(conflict: ConflictData, preference: string): ConflictResolution {
    switch (preference) {
      case 'always_local':
        return { action: 'use_local' };
      case 'always_server':
        return { action: 'use_server' };
      case 'always_merge':
        if (this.canAutoMerge(conflict.entityType)) {
          return { action: 'merge', mergedData: this.merge(conflict) };
        }
        return { action: 'use_server' }; // Fallback
      case 'always_newer':
        return conflict.localTimestamp > conflict.serverTimestamp
          ? { action: 'use_local' }
          : { action: 'use_server' };
      default:
        return { action: 'manual', requiresUserInput: true };
    }
  }

  private canAutoMerge(entityType: string): boolean {
    return this.mergeStrategies.has(entityType);
  }

  async merge(conflict: ConflictData): Promise<any> {
    const mergeStrategy = this.mergeStrategies.get(conflict.entityType);
    if (!mergeStrategy) {
      throw new Error(`No merge strategy for entity type: ${conflict.entityType}`);
    }

    return mergeStrategy(conflict.localData, conflict.serverData);
  }

  private pickNewer(localValue: any, serverValue: any, localTime: Date, serverTime: Date): any {
    if (localValue === undefined || localValue === null) return serverValue;
    if (serverValue === undefined || serverValue === null) return localValue;

    return new Date(localTime) > new Date(serverTime) ? localValue : serverValue;
  }

  private mergeNotes(localNotes: string, serverNotes: string): string {
    if (!localNotes && !serverNotes) return '';
    if (!localNotes) return serverNotes;
    if (!serverNotes) return localNotes;

    if (localNotes === serverNotes) return localNotes;

    // Combine notes with separator
    return `${localNotes}\n\n--- Merged from other device ---\n${serverNotes}`;
  }

  private mergeArrays(localArray: any[], serverArray: any[], idField: string): any[] {
    if (!localArray && !serverArray) return [];
    if (!localArray) return serverArray;
    if (!serverArray) return localArray;

    const merged = new Map();

    // Add local items
    localArray.forEach(item => {
      merged.set(item[idField], item);
    });

    // Add or update with server items
    serverArray.forEach(item => {
      const existing = merged.get(item[idField]);
      if (!existing) {
        merged.set(item[idField], item);
      } else {
        // Merge individual items if both exist
        const localTime = new Date(existing.lastModified || 0);
        const serverTime = new Date(item.lastModified || 0);
        merged.set(item[idField], serverTime > localTime ? item : existing);
      }
    });

    return Array.from(merged.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  private mergeUserProfile(localProfile: any, serverProfile: any): any {
    if (!localProfile && !serverProfile) return {};
    if (!localProfile) return serverProfile;
    if (!serverProfile) return localProfile;

    return {
      weight: Math.max(localProfile.weight || 0, serverProfile.weight || 0),
      height: localProfile.height || serverProfile.height,
      birthDate: localProfile.birthDate || serverProfile.birthDate,
      goals: [...new Set([...(localProfile.goals || []), ...(serverProfile.goals || [])])],
      preferences: {
        ...serverProfile.preferences,
        ...localProfile.preferences, // Local preferences take precedence
      },
    };
  }

  private hasCriticalFieldConflict(localData: any, serverData: any): boolean {
    const criticalFields = ['deleted', 'archived', 'published', 'status'];

    return criticalFields.some(field => {
      return localData[field] !== undefined &&
             serverData[field] !== undefined &&
             localData[field] !== serverData[field];
    });
  }

  // User interaction methods
  async presentConflictToUser(conflict: ConflictData): Promise<ConflictResolution> {
    return new Promise((resolve) => {
      // This would trigger a UI component to show conflict resolution options
      const event = new CustomEvent('conflict:resolution-needed', {
        detail: {
          conflict,
          resolve: (resolution: ConflictResolution) => {
            // Save user preference if they chose to remember
            if (resolution.action !== 'manual') {
              const preferenceKey = `${conflict.entityType}_${conflict.conflictType}`;
              this.userPreferences[preferenceKey] = resolution.action;
              this.saveUserPreferences();
            }
            resolve(resolution);
          }
        }
      });

      window.dispatchEvent(event);
    });
  }

  setUserPreference(entityType: string, conflictType: string, preference: string): void {
    const key = `${entityType}_${conflictType}`;
    this.userPreferences[key] = preference;
    this.saveUserPreferences();
  }

  getUserPreference(entityType: string, conflictType: string): string | null {
    const key = `${entityType}_${conflictType}`;
    return this.userPreferences[key] || null;
  }

  clearUserPreferences(): void {
    this.userPreferences = {};
    this.saveUserPreferences();
  }

  // Analytics and monitoring
  getConflictStats(): {
    totalConflicts: number;
    resolvedAutomatically: number;
    requiredUserInput: number;
    byEntityType: Record<string, number>;
  } {
    // This would typically be stored in IndexedDB or sent to analytics
    return {
      totalConflicts: 0,
      resolvedAutomatically: 0,
      requiredUserInput: 0,
      byEntityType: {},
    };
  }

  // Custom merge strategy registration
  registerMergeStrategy(entityType: string, strategy: MergeStrategy): void {
    this.mergeStrategies.set(entityType, strategy);
  }

  removeMergeStrategy(entityType: string): void {
    this.mergeStrategies.delete(entityType);
  }
}

// Singleton instance
export const conflictResolver = new ConflictResolver();

export type { ConflictData, ConflictResolution, MergeStrategy };