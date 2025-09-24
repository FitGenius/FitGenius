/**
 * Offline Storage Manager
 * Manages local data storage using IndexedDB for offline-first architecture
 */

interface SyncableEntity {
  id: string;
  tenantId: string;
  lastModified: Date;
  version: number;
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
  localChanges?: Record<string, any>;
}

interface OfflineWorkout extends SyncableEntity {
  name: string;
  description?: string;
  exercises: OfflineExercise[];
  duration?: number;
  completed: boolean;
  startedAt?: Date;
  completedAt?: Date;
  notes?: string;
  type: string;
}

interface OfflineExercise extends SyncableEntity {
  workoutId: string;
  exerciseId: string;
  name: string;
  sets: OfflineSet[];
  restTime?: number;
  notes?: string;
  order: number;
}

interface OfflineSet extends SyncableEntity {
  workoutExerciseId: string;
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  restTime?: number;
  completed: boolean;
  order: number;
}

interface OfflineUser extends SyncableEntity {
  email: string;
  name: string;
  profile?: {
    weight?: number;
    height?: number;
    birthDate?: Date;
    goals?: string[];
    preferences?: Record<string, any>;
  };
}

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'FitGeniusOffline';
  private readonly version = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        this.createObjectStore(db, 'workouts', 'id');
        this.createObjectStore(db, 'exercises', 'id');
        this.createObjectStore(db, 'sets', 'id');
        this.createObjectStore(db, 'users', 'id');
        this.createObjectStore(db, 'syncQueue', 'id');
        this.createObjectStore(db, 'conflicts', 'id');
        this.createObjectStore(db, 'metadata', 'key');

        // Create indexes
        this.createIndexes(db);
      };
    });
  }

  private createObjectStore(db: IDBDatabase, name: string, keyPath: string) {
    if (!db.objectStoreNames.contains(name)) {
      db.createObjectStore(name, { keyPath });
    }
  }

  private createIndexes(db: IDBDatabase) {
    // Workout indexes
    if (db.objectStoreNames.contains('workouts')) {
      const workoutStore = db.transaction(['workouts'], 'versionchange').objectStore('workouts');
      if (!workoutStore.indexNames.contains('tenantId')) {
        workoutStore.createIndex('tenantId', 'tenantId');
      }
      if (!workoutStore.indexNames.contains('syncStatus')) {
        workoutStore.createIndex('syncStatus', 'syncStatus');
      }
      if (!workoutStore.indexNames.contains('lastModified')) {
        workoutStore.createIndex('lastModified', 'lastModified');
      }
    }

    // Similar indexes for other stores
    const stores = ['exercises', 'sets', 'users'];
    stores.forEach(storeName => {
      if (db.objectStoreNames.contains(storeName)) {
        const store = db.transaction([storeName], 'versionchange').objectStore(storeName);
        if (!store.indexNames.contains('tenantId')) {
          store.createIndex('tenantId', 'tenantId');
        }
        if (!store.indexNames.contains('syncStatus')) {
          store.createIndex('syncStatus', 'syncStatus');
        }
      }
    });
  }

  // Workout operations
  async saveWorkout(workout: OfflineWorkout): Promise<void> {
    await this.save('workouts', {
      ...workout,
      lastModified: new Date(),
      syncStatus: workout.syncStatus || 'pending'
    });
  }

  async getWorkout(id: string): Promise<OfflineWorkout | null> {
    return await this.get('workouts', id);
  }

  async getWorkoutsByTenant(tenantId: string): Promise<OfflineWorkout[]> {
    return await this.getByIndex('workouts', 'tenantId', tenantId);
  }

  async deleteWorkout(id: string): Promise<void> {
    // Mark as deleted instead of actually deleting
    const workout = await this.getWorkout(id);
    if (workout) {
      workout.syncStatus = 'pending';
      workout.localChanges = { ...workout.localChanges, deleted: true };
      await this.saveWorkout(workout);
    }
  }

  // Exercise operations
  async saveExercise(exercise: OfflineExercise): Promise<void> {
    await this.save('exercises', {
      ...exercise,
      lastModified: new Date(),
      syncStatus: exercise.syncStatus || 'pending'
    });
  }

  async getExercisesByWorkout(workoutId: string): Promise<OfflineExercise[]> {
    return await this.getByIndex('exercises', 'workoutId', workoutId);
  }

  // Set operations
  async saveSet(set: OfflineSet): Promise<void> {
    await this.save('sets', {
      ...set,
      lastModified: new Date(),
      syncStatus: set.syncStatus || 'pending'
    });
  }

  async getSetsByExercise(workoutExerciseId: string): Promise<OfflineSet[]> {
    return await this.getByIndex('sets', 'workoutExerciseId', workoutExerciseId);
  }

  // User operations
  async saveUser(user: OfflineUser): Promise<void> {
    await this.save('users', {
      ...user,
      lastModified: new Date(),
      syncStatus: user.syncStatus || 'pending'
    });
  }

  async getUser(id: string): Promise<OfflineUser | null> {
    return await this.get('users', id);
  }

  // Sync queue operations
  async addToSyncQueue(operation: {
    id: string;
    type: 'create' | 'update' | 'delete';
    entity: string;
    entityId: string;
    data: any;
    timestamp: Date;
    retryCount: number;
  }): Promise<void> {
    await this.save('syncQueue', operation);
  }

  async getSyncQueue(): Promise<any[]> {
    return await this.getAll('syncQueue');
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    await this.delete('syncQueue', id);
  }

  // Conflict management
  async saveConflict(conflict: {
    id: string;
    entityType: string;
    entityId: string;
    localData: any;
    serverData: any;
    timestamp: Date;
    resolved: boolean;
  }): Promise<void> {
    await this.save('conflicts', conflict);
  }

  async getUnresolvedConflicts(): Promise<any[]> {
    return await this.getByIndex('conflicts', 'resolved', false);
  }

  // Metadata operations
  async setMetadata(key: string, value: any): Promise<void> {
    await this.save('metadata', { key, value, lastUpdated: new Date() });
  }

  async getMetadata(key: string): Promise<any> {
    const result = await this.get('metadata', key);
    return result?.value;
  }

  // Generic operations
  private async save(storeName: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async get<T>(storeName: string, id: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  private async getAll<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  private async getByIndex<T>(storeName: string, indexName: string, value: any): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  private async delete(storeName: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Storage management
  async getStorageStats(): Promise<{
    workouts: number;
    exercises: number;
    sets: number;
    pendingSync: number;
    conflicts: number;
    totalSize: number;
  }> {
    const [workouts, exercises, sets, syncQueue, conflicts] = await Promise.all([
      this.getAll('workouts'),
      this.getAll('exercises'),
      this.getAll('sets'),
      this.getSyncQueue(),
      this.getUnresolvedConflicts(),
    ]);

    return {
      workouts: workouts.length,
      exercises: exercises.length,
      sets: sets.length,
      pendingSync: syncQueue.length,
      conflicts: conflicts.length,
      totalSize: await this.estimateStorageSize(),
    };
  }

  private async estimateStorageSize(): Promise<number> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    }
    return 0;
  }

  async clearOldData(daysOld: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Clear old synced workouts
    const oldWorkouts = await this.getAll<OfflineWorkout>('workouts');
    for (const workout of oldWorkouts) {
      if (workout.syncStatus === 'synced' && workout.lastModified < cutoffDate) {
        await this.delete('workouts', workout.id);
      }
    }
  }

  async exportData(): Promise<{
    workouts: OfflineWorkout[];
    exercises: OfflineExercise[];
    sets: OfflineSet[];
    metadata: any[];
  }> {
    const [workouts, exercises, sets, metadata] = await Promise.all([
      this.getAll<OfflineWorkout>('workouts'),
      this.getAll<OfflineExercise>('exercises'),
      this.getAll<OfflineSet>('sets'),
      this.getAll('metadata'),
    ]);

    return { workouts, exercises, sets, metadata };
  }

  async importData(data: {
    workouts: OfflineWorkout[];
    exercises: OfflineExercise[];
    sets: OfflineSet[];
  }): Promise<void> {
    // Import workouts
    for (const workout of data.workouts) {
      await this.saveWorkout(workout);
    }

    // Import exercises
    for (const exercise of data.exercises) {
      await this.saveExercise(exercise);
    }

    // Import sets
    for (const set of data.sets) {
      await this.saveSet(set);
    }
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorage();

// Initialize storage when module loads
if (typeof window !== 'undefined') {
  offlineStorage.init().catch(console.error);
}

export type { OfflineWorkout, OfflineExercise, OfflineSet, OfflineUser, SyncableEntity };