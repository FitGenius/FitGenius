import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/server';

export const workoutsRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        clientId: z.string().optional(),
        type: z.enum(['STRENGTH', 'CARDIO', 'FLEXIBILITY', 'MIXED']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const workouts = await ctx.prisma.workout.findMany({
        where: {
          professionalId: ctx.session.user.professional?.id,
          ...(input.clientId && { clientId: input.clientId }),
          ...(input.type && { type: input.type }),
        },
        include: {
          client: {
            include: {
              user: true,
            },
          },
          exercises: {
            include: {
              exercise: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return workouts;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const workout = await ctx.prisma.workout.findUnique({
        where: { id: input.id },
        include: {
          client: {
            include: {
              user: true,
            },
          },
          exercises: {
            include: {
              exercise: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
      });

      if (!workout) {
        throw new Error('Workout not found');
      }

      return workout;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        description: z.string().optional(),
        clientId: z.string(),
        type: z.enum(['STRENGTH', 'CARDIO', 'FLEXIBILITY', 'MIXED']),
        difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
        estimatedDuration: z.number().min(1).max(300),
        exercises: z.array(
          z.object({
            exerciseId: z.string(),
            sets: z.number().min(1),
            reps: z.number().optional(),
            weight: z.number().optional(),
            duration: z.number().optional(),
            distance: z.number().optional(),
            restTime: z.number().optional(),
            notes: z.string().optional(),
            order: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { exercises, ...workoutData } = input;

      const workout = await ctx.prisma.workout.create({
        data: {
          ...workoutData,
          professionalId: ctx.session.user.professional!.id,
          exercises: {
            create: exercises,
          },
        },
        include: {
          exercises: {
            include: {
              exercise: true,
            },
          },
        },
      });

      return workout;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        type: z.enum(['STRENGTH', 'CARDIO', 'FLEXIBILITY', 'MIXED']).optional(),
        difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
        estimatedDuration: z.number().min(1).max(300).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      return ctx.prisma.workout.update({
        where: { id },
        data: updateData,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.workout.delete({
        where: { id: input.id },
      });
    }),

  getExerciseLibrary: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.exercise.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }),
});