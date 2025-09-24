import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { getTenantContext } from '@/lib/tenant/tenant-context';
import { z } from 'zod';

const syncOperationSchema = z.object({
  id: z.string(),
  type: z.enum(['create', 'update', 'delete']),
  entity: z.string(),
  entityId: z.string(),
  data: z.any(),
  timestamp: z.string().datetime(),
  retryCount: z.number(),
  tenantId: z.string(),
});

const pushRequestSchema = z.object({
  operations: z.array(syncOperationSchema),
});

/**
 * POST /api/sync/push
 * Push local changes to server
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 });
    }

    const body = await request.json();
    const { operations } = pushRequestSchema.parse(body);

    const results = {
      succeeded: [] as any[],
      conflicts: [] as any[],
      failed: [] as any[],
    };

    // Process operations in batches
    for (const operation of operations) {
      try {
        // Verify tenant access
        if (operation.tenantId !== tenantContext.id) {
          results.failed.push({
            ...operation,
            error: 'Tenant access denied',
          });
          continue;
        }

        const result = await processOperation(operation, session.user.id);

        if (result.success) {
          results.succeeded.push({
            ...operation,
            serverVersion: result.version,
            serverTimestamp: result.timestamp,
          });
        } else if (result.conflict) {
          results.conflicts.push({
            ...operation,
            conflict: result.conflict,
            serverData: result.serverData,
          });
        } else {
          results.failed.push({
            ...operation,
            error: result.error,
          });
        }
      } catch (error) {
        console.error('Error processing operation:', error);
        results.failed.push({
          ...operation,
          error: 'Internal server error',
        });
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', issues: error.issues },
        { status: 400 }
      );
    }

    console.error('Sync push error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processOperation(operation: any, userId: string): Promise<{
  success: boolean;
  conflict?: any;
  serverData?: any;
  version?: number;
  timestamp?: Date;
  error?: string;
}> {
  const { type, entity, entityId, data } = operation;

  switch (entity) {
    case 'workout':
      return await processWorkoutOperation(type, entityId, data, userId);
    case 'exercise':
      return await processExerciseOperation(type, entityId, data, userId);
    case 'set':
      return await processSetOperation(type, entityId, data, userId);
    case 'user':
      return await processUserOperation(type, entityId, data, userId);
    default:
      return { success: false, error: `Unknown entity type: ${entity}` };
  }
}

async function processWorkoutOperation(
  type: string,
  entityId: string,
  data: any,
  userId: string
): Promise<any> {
  try {
    switch (type) {
      case 'create':
        // Check if workout already exists (conflict)
        const existingWorkout = await prisma.workout.findUnique({
          where: { id: entityId },
        });

        if (existingWorkout) {
          return {
            success: false,
            conflict: {
              type: 'concurrent_creation',
              localData: data,
              serverData: existingWorkout,
            },
            serverData: existingWorkout,
          };
        }

        const newWorkout = await prisma.workout.create({
          data: {
            id: entityId,
            name: data.name,
            description: data.description,
            type: data.type,
            duration: data.duration,
            completed: data.completed,
            startedAt: data.startedAt ? new Date(data.startedAt) : null,
            completedAt: data.completedAt ? new Date(data.completedAt) : null,
            notes: data.notes,
            tenantId: data.tenantId,
            userId: userId,
            version: 1,
          },
        });

        // Create change log entry
        await createChangeLog('workout', entityId, 'create', newWorkout, data.tenantId);

        return {
          success: true,
          version: newWorkout.version,
          timestamp: newWorkout.updatedAt,
        };

      case 'update':
        const workoutToUpdate = await prisma.workout.findUnique({
          where: { id: entityId },
        });

        if (!workoutToUpdate) {
          // Server doesn't have this workout, treat as create
          return await processWorkoutOperation('create', entityId, data, userId);
        }

        // Check for conflicts based on version
        if (data.version && workoutToUpdate.version > data.version) {
          return {
            success: false,
            conflict: {
              type: 'update_conflict',
              localData: data,
              serverData: workoutToUpdate,
            },
            serverData: workoutToUpdate,
          };
        }

        const updatedWorkout = await prisma.workout.update({
          where: { id: entityId },
          data: {
            name: data.name,
            description: data.description,
            type: data.type,
            duration: data.duration,
            completed: data.completed,
            startedAt: data.startedAt ? new Date(data.startedAt) : null,
            completedAt: data.completedAt ? new Date(data.completedAt) : null,
            notes: data.notes,
            version: { increment: 1 },
          },
        });

        await createChangeLog('workout', entityId, 'update', updatedWorkout, data.tenantId);

        return {
          success: true,
          version: updatedWorkout.version,
          timestamp: updatedWorkout.updatedAt,
        };

      case 'delete':
        const workoutToDelete = await prisma.workout.findUnique({
          where: { id: entityId },
        });

        if (!workoutToDelete) {
          return { success: true }; // Already deleted
        }

        // Soft delete
        await prisma.workout.update({
          where: { id: entityId },
          data: {
            deleted: true,
            version: { increment: 1 },
          },
        });

        await createChangeLog('workout', entityId, 'delete', null, data.tenantId);

        return { success: true };

      default:
        return { success: false, error: `Unknown operation type: ${type}` };
    }
  } catch (error) {
    console.error('Workout operation error:', error);
    return { success: false, error: 'Database operation failed' };
  }
}

async function processExerciseOperation(
  type: string,
  entityId: string,
  data: any,
  userId: string
): Promise<any> {
  try {
    switch (type) {
      case 'create':
        const existingExercise = await prisma.workoutExercise.findUnique({
          where: { id: entityId },
        });

        if (existingExercise) {
          return {
            success: false,
            conflict: {
              type: 'concurrent_creation',
              localData: data,
              serverData: existingExercise,
            },
            serverData: existingExercise,
          };
        }

        const newExercise = await prisma.workoutExercise.create({
          data: {
            id: entityId,
            workoutId: data.workoutId,
            exerciseId: data.exerciseId,
            sets: data.sets?.length || 0,
            reps: data.targetReps,
            weight: data.targetWeight,
            duration: data.targetDuration,
            restTime: data.restTime,
            notes: data.notes,
            order: data.order,
            tenantId: data.tenantId,
            version: 1,
          },
        });

        await createChangeLog('exercise', entityId, 'create', newExercise, data.tenantId);
        return { success: true, version: 1, timestamp: new Date() };

      case 'update':
        const exerciseToUpdate = await prisma.workoutExercise.findUnique({
          where: { id: entityId },
        });

        if (!exerciseToUpdate) {
          return await processExerciseOperation('create', entityId, data, userId);
        }

        if (data.version && exerciseToUpdate.version > data.version) {
          return {
            success: false,
            conflict: {
              type: 'update_conflict',
              localData: data,
              serverData: exerciseToUpdate,
            },
            serverData: exerciseToUpdate,
          };
        }

        const updatedExercise = await prisma.workoutExercise.update({
          where: { id: entityId },
          data: {
            sets: data.sets?.length || exerciseToUpdate.sets,
            reps: data.targetReps || exerciseToUpdate.reps,
            weight: data.targetWeight || exerciseToUpdate.weight,
            duration: data.targetDuration || exerciseToUpdate.duration,
            restTime: data.restTime,
            notes: data.notes,
            order: data.order,
            version: { increment: 1 },
          },
        });

        await createChangeLog('exercise', entityId, 'update', updatedExercise, data.tenantId);
        return { success: true, version: updatedExercise.version, timestamp: new Date() };

      case 'delete':
        await prisma.workoutExercise.update({
          where: { id: entityId },
          data: { deleted: true, version: { increment: 1 } },
        });

        await createChangeLog('exercise', entityId, 'delete', null, data.tenantId);
        return { success: true };

      default:
        return { success: false, error: `Unknown operation type: ${type}` };
    }
  } catch (error) {
    console.error('Exercise operation error:', error);
    return { success: false, error: 'Database operation failed' };
  }
}

async function processSetOperation(
  type: string,
  entityId: string,
  data: any,
  userId: string
): Promise<any> {
  try {
    switch (type) {
      case 'create':
        const existingSet = await prisma.workoutSet.findUnique({
          where: { id: entityId },
        });

        if (existingSet) {
          return {
            success: false,
            conflict: {
              type: 'concurrent_creation',
              localData: data,
              serverData: existingSet,
            },
            serverData: existingSet,
          };
        }

        const newSet = await prisma.workoutSet.create({
          data: {
            id: entityId,
            workoutExerciseId: data.workoutExerciseId,
            reps: data.reps,
            weight: data.weight,
            duration: data.duration,
            distance: data.distance,
            restTime: data.restTime,
            completed: data.completed,
            order: data.order,
            tenantId: data.tenantId,
            version: 1,
          },
        });

        await createChangeLog('set', entityId, 'create', newSet, data.tenantId);
        return { success: true, version: 1, timestamp: new Date() };

      case 'update':
        const setToUpdate = await prisma.workoutSet.findUnique({
          where: { id: entityId },
        });

        if (!setToUpdate) {
          return await processSetOperation('create', entityId, data, userId);
        }

        if (data.version && setToUpdate.version > data.version) {
          return {
            success: false,
            conflict: {
              type: 'update_conflict',
              localData: data,
              serverData: setToUpdate,
            },
            serverData: setToUpdate,
          };
        }

        const updatedSet = await prisma.workoutSet.update({
          where: { id: entityId },
          data: {
            reps: data.reps,
            weight: data.weight,
            duration: data.duration,
            distance: data.distance,
            restTime: data.restTime,
            completed: data.completed,
            order: data.order,
            version: { increment: 1 },
          },
        });

        await createChangeLog('set', entityId, 'update', updatedSet, data.tenantId);
        return { success: true, version: updatedSet.version, timestamp: new Date() };

      case 'delete':
        await prisma.workoutSet.update({
          where: { id: entityId },
          data: { deleted: true, version: { increment: 1 } },
        });

        await createChangeLog('set', entityId, 'delete', null, data.tenantId);
        return { success: true };

      default:
        return { success: false, error: `Unknown operation type: ${type}` };
    }
  } catch (error) {
    console.error('Set operation error:', error);
    return { success: false, error: 'Database operation failed' };
  }
}

async function processUserOperation(
  type: string,
  entityId: string,
  data: any,
  userId: string
): Promise<any> {
  // Only allow users to update their own profile
  if (entityId !== userId) {
    return { success: false, error: 'Access denied' };
  }

  try {
    switch (type) {
      case 'update':
        const updatedUser = await prisma.user.update({
          where: { id: entityId },
          data: {
            name: data.name,
            profile: data.profile,
          },
        });

        await createChangeLog('user', entityId, 'update', updatedUser, data.tenantId);
        return { success: true, timestamp: new Date() };

      default:
        return { success: false, error: `Unsupported user operation: ${type}` };
    }
  } catch (error) {
    console.error('User operation error:', error);
    return { success: false, error: 'Database operation failed' };
  }
}

async function createChangeLog(
  entityType: string,
  entityId: string,
  operation: string,
  data: any,
  tenantId: string
): Promise<void> {
  try {
    await prisma.syncChangeLog.create({
      data: {
        entityType,
        entityId,
        operation,
        data: data ? JSON.stringify(data) : null,
        tenantId,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to create change log:', error);
    // Don't fail the main operation if change log fails
  }
}