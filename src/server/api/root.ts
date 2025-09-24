import { createTRPCRouter } from '@/lib/trpc/server';
import { usersRouter } from './routers/users';
import { workoutsRouter } from './routers/workouts';

export const appRouter = createTRPCRouter({
  users: usersRouter,
  workouts: workoutsRouter,
});

export type AppRouter = typeof appRouter;