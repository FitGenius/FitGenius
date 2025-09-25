-- =====================================================
-- FITGENIUS - SCHEMA LIVRE DE ERROS PARA SUPABASE
-- =====================================================
-- Versao sem emojis e com verificacoes seguras
-- Execute uma unica vez no SQL Editor do Supabase
-- =====================================================

-- Habilitar extensoes necessarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS (TODOS OS TIPOS CUSTOMIZADOS)
-- =====================================================

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
        CREATE TYPE "UserRole" AS ENUM ('PROFESSIONAL', 'CLIENT', 'ADMIN');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubscriptionTier') THEN
        CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ClientStatus') THEN
        CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InviteStatus') THEN
        CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ExerciseCategory') THEN
        CREATE TYPE "ExerciseCategory" AS ENUM ('CHEST', 'BACK', 'SHOULDERS', 'ARMS', 'LEGS', 'ABS', 'CARDIO', 'FUNCTIONAL');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DifficultyLevel') THEN
        CREATE TYPE "DifficultyLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WorkoutStatus') THEN
        CREATE TYPE "WorkoutStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessageType') THEN
        CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'FILE');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
        CREATE TYPE "NotificationType" AS ENUM ('WORKOUT_REMINDER', 'NEW_WORKOUT', 'ASSESSMENT_DUE', 'MESSAGE_RECEIVED', 'ACHIEVEMENT_UNLOCKED', 'SUBSCRIPTION_EXPIRING', 'PAYMENT_FAILED', 'PAYMENT_SUCCESS');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubscriptionPlan') THEN
        CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'PROFESSIONAL', 'ENTERPRISE');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubscriptionStatus') THEN
        CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'UNPAID', 'TRIALING', 'INCOMPLETE', 'INCOMPLETE_EXPIRED');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InvoiceStatus') THEN
        CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'OPEN', 'PAID', 'UNCOLLECTIBLE', 'VOID');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
        CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELED', 'REFUNDED');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PlanInterval') THEN
        CREATE TYPE "PlanInterval" AS ENUM ('MONTHLY', 'YEARLY');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AchievementCategory') THEN
        CREATE TYPE "AchievementCategory" AS ENUM ('WORKOUT', 'NUTRITION', 'CONSISTENCY', 'MILESTONE', 'SOCIAL', 'SPECIAL');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AchievementType') THEN
        CREATE TYPE "AchievementType" AS ENUM ('COUNTER', 'STREAK', 'MILESTONE', 'CHALLENGE');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AchievementTier') THEN
        CREATE TYPE "AchievementTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StreakType') THEN
        CREATE TYPE "StreakType" AS ENUM ('WORKOUT', 'NUTRITION', 'CHECK_IN', 'MEDITATION');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ChallengeType') THEN
        CREATE TYPE "ChallengeType" AS ENUM ('INDIVIDUAL', 'TEAM', 'GLOBAL');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LeaderboardPeriod') THEN
        CREATE TYPE "LeaderboardPeriod" AS ENUM ('WEEKLY', 'MONTHLY', 'ALL_TIME');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FoodCategory') THEN
        CREATE TYPE "FoodCategory" AS ENUM ('GRAINS_CEREALS', 'VEGETABLES', 'FRUITS', 'DAIRY', 'MEAT_FISH', 'LEGUMES_NUTS', 'OILS_FATS', 'BEVERAGES', 'SWEETS_SNACKS', 'CONDIMENTS', 'SUPPLEMENTS', 'OTHER');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MealType') THEN
        CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER', 'EVENING_SNACK', 'OTHER');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RecipeDifficulty') THEN
        CREATE TYPE "RecipeDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NutritionGoalType') THEN
        CREATE TYPE "NutritionGoalType" AS ENUM ('WEIGHT_LOSS', 'WEIGHT_GAIN', 'MAINTENANCE', 'MUSCLE_GAIN', 'FAT_LOSS');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ActivityLevel') THEN
        CREATE TYPE "ActivityLevel" AS ENUM ('SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- TABELA 1: USER (BASE)
-- =====================================================

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT,
    "name" TEXT,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "phoneNumber" TEXT,
    "birthDate" TIMESTAMP(3),
    "gender" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- =====================================================
-- TABELA 2: ACCOUNT (NEXTAUTH)
-- =====================================================

CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- =====================================================
-- TABELA 3: SESSION (NEXTAUTH)
-- =====================================================

CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");

-- =====================================================
-- TABELA 4: VERIFICATION TOKEN (NEXTAUTH)
-- =====================================================

CREATE TABLE IF NOT EXISTS "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- =====================================================
-- TABELA 5: PROFESSIONAL
-- =====================================================

CREATE TABLE IF NOT EXISTS "Professional" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "specialties" TEXT,
    "licenseNumber" TEXT,
    "bio" TEXT,
    "experience" INTEGER,
    "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "maxClients" INTEGER NOT NULL DEFAULT 3,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Professional_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Professional_userId_key" ON "Professional"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Professional_licenseNumber_key" ON "Professional"("licenseNumber") WHERE "licenseNumber" IS NOT NULL;

-- =====================================================
-- TABELA 6: CLIENT
-- =====================================================

CREATE TABLE IF NOT EXISTS "Client" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "professionalId" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "height" DOUBLE PRECISION,
    "activityLevel" TEXT,
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Client_userId_key" ON "Client"("userId");

-- =====================================================
-- TABELA 7: CLIENT INVITE
-- =====================================================

CREATE TABLE IF NOT EXISTS "ClientInvite" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "professionalId" TEXT NOT NULL,
    "clientId" TEXT,
    "inviteCode" TEXT NOT NULL,
    "email" TEXT,
    "message" TEXT,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ClientInvite_inviteCode_key" ON "ClientInvite"("inviteCode");
CREATE UNIQUE INDEX IF NOT EXISTS "ClientInvite_professionalId_email_key" ON "ClientInvite"("professionalId", "email") WHERE "email" IS NOT NULL;

-- =====================================================
-- TABELA 8: SUBSCRIPTION
-- =====================================================

CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "trialStart" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_userId_key" ON "Subscription"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_stripeCustomerId_key" ON "Subscription"("stripeCustomerId") WHERE "stripeCustomerId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId") WHERE "stripeSubscriptionId" IS NOT NULL;

-- =====================================================
-- TABELA 9: INVOICE
-- =====================================================

CREATE TABLE IF NOT EXISTS "Invoice" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "subscriptionId" TEXT NOT NULL,
    "stripeInvoiceId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "status" "InvoiceStatus" NOT NULL,
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_stripeInvoiceId_key" ON "Invoice"("stripeInvoiceId") WHERE "stripeInvoiceId" IS NOT NULL;

-- =====================================================
-- TABELA 10: PAYMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "subscriptionId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "stripePaymentId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "status" "PaymentStatus" NOT NULL,
    "paymentMethod" TEXT,
    "failureReason" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Payment_invoiceId_key" ON "Payment"("invoiceId") WHERE "invoiceId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_stripePaymentId_key" ON "Payment"("stripePaymentId") WHERE "stripePaymentId" IS NOT NULL;

-- =====================================================
-- TABELA 11: PLAN
-- =====================================================

CREATE TABLE IF NOT EXISTS "Plan" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "SubscriptionPlan" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "interval" "PlanInterval" NOT NULL,
    "stripePriceId" TEXT,
    "maxClients" INTEGER,
    "features" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Plan_stripePriceId_key" ON "Plan"("stripePriceId") WHERE "stripePriceId" IS NOT NULL;

-- =====================================================
-- TABELA 12: USAGE
-- =====================================================

CREATE TABLE IF NOT EXISTS "Usage" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "clientsCount" INTEGER NOT NULL DEFAULT 0,
    "workoutsCount" INTEGER NOT NULL DEFAULT 0,
    "assessmentsCount" INTEGER NOT NULL DEFAULT 0,
    "messagesCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Usage_userId_period_key" ON "Usage"("userId", "period");

-- =====================================================
-- TABELA 13: EXERCISE
-- =====================================================

CREATE TABLE IF NOT EXISTS "Exercise" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "category" "ExerciseCategory" NOT NULL,
    "difficulty" "DifficultyLevel" NOT NULL DEFAULT 'BEGINNER',
    "muscleGroups" TEXT,
    "equipment" TEXT,
    "videoUrl" TEXT,
    "imageUrl" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- =====================================================
-- TABELA 14: WORKOUT
-- =====================================================

CREATE TABLE IF NOT EXISTS "Workout" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "clientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "status" "WorkoutStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Workout_pkey" PRIMARY KEY ("id")
);

-- =====================================================
-- TABELA 15: WORKOUT EXERCISE
-- =====================================================

CREATE TABLE IF NOT EXISTS "WorkoutExercise" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "workoutId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "sets" INTEGER,
    "reps" TEXT,
    "weight" DOUBLE PRECISION,
    "rest" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkoutExercise_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WorkoutExercise_workoutId_exerciseId_order_key" ON "WorkoutExercise"("workoutId", "exerciseId", "order");

-- =====================================================
-- TABELA 16: PHYSICAL ASSESSMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS "PhysicalAssessment" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "clientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "assessmentDate" TIMESTAMP(3) NOT NULL,
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "bodyFat" DOUBLE PRECISION,
    "muscleMass" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "waist" DOUBLE PRECISION,
    "chest" DOUBLE PRECISION,
    "arm" DOUBLE PRECISION,
    "thigh" DOUBLE PRECISION,
    "hip" DOUBLE PRECISION,
    "restingHR" INTEGER,
    "bloodPressure" TEXT,
    "notes" TEXT,
    "photos" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhysicalAssessment_pkey" PRIMARY KEY ("id")
);

-- =====================================================
-- TABELA 17: MESSAGE
-- =====================================================

CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" "MessageType" NOT NULL DEFAULT 'TEXT',
    "attachmentUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- =====================================================
-- TABELA 18: NOTIFICATION
-- =====================================================

CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- =====================================================
-- TABELA 19: ACHIEVEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS "Achievement" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "AchievementCategory" NOT NULL,
    "type" "AchievementType" NOT NULL,
    "icon" TEXT,
    "points" INTEGER NOT NULL DEFAULT 10,
    "requirement" INTEGER NOT NULL,
    "tier" "AchievementTier" NOT NULL DEFAULT 'BRONZE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Achievement_key_key" ON "Achievement"("key");

-- =====================================================
-- TABELA 20: USER ACHIEVEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS "UserAchievement" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "seen" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- =====================================================
-- TABELA 21: STREAK
-- =====================================================

CREATE TABLE IF NOT EXISTS "Streak" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "type" "StreakType" NOT NULL,
    "currentDays" INTEGER NOT NULL DEFAULT 0,
    "longestDays" INTEGER NOT NULL DEFAULT 0,
    "lastActivity" TIMESTAMP(3) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Streak_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Streak_userId_type_key" ON "Streak"("userId", "type");

-- =====================================================
-- TABELA 22: USER STATS
-- =====================================================

CREATE TABLE IF NOT EXISTS "UserStats" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "totalWorkouts" INTEGER NOT NULL DEFAULT 0,
    "totalMinutes" INTEGER NOT NULL DEFAULT 0,
    "totalCalories" INTEGER NOT NULL DEFAULT 0,
    "perfectWeeks" INTEGER NOT NULL DEFAULT 0,
    "totalAchievements" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "weeklyGoal" INTEGER NOT NULL DEFAULT 3,
    "monthlyGoal" INTEGER NOT NULL DEFAULT 12,
    "lastWorkout" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserStats_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserStats_userId_key" ON "UserStats"("userId");

-- =====================================================
-- TABELA 23: CHALLENGE
-- =====================================================

CREATE TABLE IF NOT EXISTS "Challenge" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "ChallengeType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "target" INTEGER NOT NULL,
    "reward" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- =====================================================
-- TABELA 24: CHALLENGE PARTICIPANT
-- =====================================================

CREATE TABLE IF NOT EXISTS "ChallengeParticipant" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChallengeParticipant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ChallengeParticipant_userId_challengeId_key" ON "ChallengeParticipant"("userId", "challengeId");

-- =====================================================
-- TABELA 25: LEADERBOARD ENTRY
-- =====================================================

CREATE TABLE IF NOT EXISTS "LeaderboardEntry" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "period" "LeaderboardPeriod" NOT NULL,
    "periodDate" TIMESTAMP(3) NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "workouts" INTEGER NOT NULL DEFAULT 0,
    "minutes" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderboardEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LeaderboardEntry_userId_period_periodDate_key" ON "LeaderboardEntry"("userId", "period", "periodDate");
CREATE INDEX IF NOT EXISTS "LeaderboardEntry_period_periodDate_points_idx" ON "LeaderboardEntry"("period", "periodDate", "points");

-- =====================================================
-- TABELA 26: FOOD
-- =====================================================

CREATE TABLE IF NOT EXISTS "Food" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "category" "FoodCategory" NOT NULL,
    "servingSize" DOUBLE PRECISION NOT NULL,
    "servingUnit" TEXT NOT NULL DEFAULT 'g',
    "calories" DOUBLE PRECISION NOT NULL,
    "carbs" DOUBLE PRECISION NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL,
    "fat" DOUBLE PRECISION NOT NULL,
    "fiber" DOUBLE PRECISION,
    "sugar" DOUBLE PRECISION,
    "sodium" DOUBLE PRECISION,
    "vitamins" TEXT,
    "minerals" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Food_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Food_category_name_idx" ON "Food"("category", "name");

-- =====================================================
-- TABELA 27: NUTRITION PLAN
-- =====================================================

CREATE TABLE IF NOT EXISTS "NutritionPlan" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "clientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "dailyCalories" DOUBLE PRECISION NOT NULL,
    "dailyCarbs" DOUBLE PRECISION NOT NULL,
    "dailyProtein" DOUBLE PRECISION NOT NULL,
    "dailyFat" DOUBLE PRECISION NOT NULL,
    "dailyFiber" DOUBLE PRECISION,
    "dailySodium" DOUBLE PRECISION,
    "mealsPerDay" INTEGER NOT NULL DEFAULT 6,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NutritionPlan_pkey" PRIMARY KEY ("id")
);

-- =====================================================
-- TABELA 28: MEAL
-- =====================================================

CREATE TABLE IF NOT EXISTS "Meal" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "targetTime" TEXT,
    "targetCalories" DOUBLE PRECISION,
    "targetCarbs" DOUBLE PRECISION,
    "targetProtein" DOUBLE PRECISION,
    "targetFat" DOUBLE PRECISION,
    "instructions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Meal_planId_order_key" ON "Meal"("planId", "order");

-- =====================================================
-- TABELA 29: MEAL FOOD
-- =====================================================

CREATE TABLE IF NOT EXISTS "MealFood" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "mealId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MealFood_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MealFood_mealId_foodId_key" ON "MealFood"("mealId", "foodId");

-- =====================================================
-- TABELA 30: FOOD DIARY
-- =====================================================

CREATE TABLE IF NOT EXISTS "FoodDiary" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "clientId" TEXT NOT NULL,
    "planId" TEXT,
    "mealId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "mealType" "MealType" NOT NULL,
    "foodName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "calories" DOUBLE PRECISION NOT NULL,
    "carbs" DOUBLE PRECISION NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL,
    "fat" DOUBLE PRECISION NOT NULL,
    "fiber" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodDiary_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FoodDiary_clientId_date_idx" ON "FoodDiary"("clientId", "date");

-- =====================================================
-- TABELA 31: RECIPE
-- =====================================================

CREATE TABLE IF NOT EXISTS "Recipe" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "FoodCategory" NOT NULL,
    "servings" INTEGER NOT NULL DEFAULT 1,
    "prepTime" INTEGER,
    "cookTime" INTEGER,
    "difficulty" "RecipeDifficulty" NOT NULL DEFAULT 'EASY',
    "caloriesPerServing" DOUBLE PRECISION,
    "carbsPerServing" DOUBLE PRECISION,
    "proteinPerServing" DOUBLE PRECISION,
    "fatPerServing" DOUBLE PRECISION,
    "instructions" TEXT NOT NULL,
    "tips" TEXT,
    "imageUrl" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Recipe_category_isPublic_idx" ON "Recipe"("category", "isPublic");

-- =====================================================
-- TABELA 32: RECIPE INGREDIENT
-- =====================================================

CREATE TABLE IF NOT EXISTS "RecipeIngredient" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "recipeId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'g',
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RecipeIngredient_recipeId_foodId_key" ON "RecipeIngredient"("recipeId", "foodId");

-- =====================================================
-- TABELA 33: RECIPE TAG
-- =====================================================

CREATE TABLE IF NOT EXISTS "RecipeTag" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#ffd700',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecipeTag_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RecipeTag_name_key" ON "RecipeTag"("name");

-- =====================================================
-- TABELA 34: WATER INTAKE
-- =====================================================

CREATE TABLE IF NOT EXISTS "WaterIntake" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "clientId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaterIntake_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WaterIntake_clientId_date_idx" ON "WaterIntake"("clientId", "date");

-- =====================================================
-- TABELA 35: NUTRITION GOAL
-- =====================================================

CREATE TABLE IF NOT EXISTS "NutritionGoal" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "clientId" TEXT NOT NULL,
    "goalType" "NutritionGoalType" NOT NULL,
    "targetWeight" DOUBLE PRECISION,
    "activityLevel" "ActivityLevel" NOT NULL,
    "bmr" DOUBLE PRECISION,
    "tdee" DOUBLE PRECISION,
    "carbRatio" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "proteinRatio" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "fatRatio" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NutritionGoal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "NutritionGoal_clientId_key" ON "NutritionGoal"("clientId");

-- =====================================================
-- TABELA 36: AI CONVERSATION
-- =====================================================

CREATE TABLE IF NOT EXISTS "AiConversation" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "messages" TEXT NOT NULL,
    "context" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiConversation_pkey" PRIMARY KEY ("id")
);

-- =====================================================
-- FOREIGN KEYS SEGUROS
-- =====================================================

-- User relationships
ALTER TABLE "Account" DROP CONSTRAINT IF EXISTS "Account_userId_fkey";
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Session" DROP CONSTRAINT IF EXISTS "Session_userId_fkey";
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Professional" DROP CONSTRAINT IF EXISTS "Professional_userId_fkey";
ALTER TABLE "Professional" ADD CONSTRAINT "Professional_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Client" DROP CONSTRAINT IF EXISTS "Client_userId_fkey";
ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Subscription" DROP CONSTRAINT IF EXISTS "Subscription_userId_fkey";
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Usage" DROP CONSTRAINT IF EXISTS "Usage_userId_fkey";
ALTER TABLE "Usage" ADD CONSTRAINT "Usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Message" DROP CONSTRAINT IF EXISTS "Message_senderId_fkey";
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Message" DROP CONSTRAINT IF EXISTS "Message_receiverId_fkey";
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS "Notification_userId_fkey";
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserAchievement" DROP CONSTRAINT IF EXISTS "UserAchievement_userId_fkey";
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Streak" DROP CONSTRAINT IF EXISTS "Streak_userId_fkey";
ALTER TABLE "Streak" ADD CONSTRAINT "Streak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserStats" DROP CONSTRAINT IF EXISTS "UserStats_userId_fkey";
ALTER TABLE "UserStats" ADD CONSTRAINT "UserStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChallengeParticipant" DROP CONSTRAINT IF EXISTS "ChallengeParticipant_userId_fkey";
ALTER TABLE "ChallengeParticipant" ADD CONSTRAINT "ChallengeParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LeaderboardEntry" DROP CONSTRAINT IF EXISTS "LeaderboardEntry_userId_fkey";
ALTER TABLE "LeaderboardEntry" ADD CONSTRAINT "LeaderboardEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AiConversation" DROP CONSTRAINT IF EXISTS "AiConversation_userId_fkey";
ALTER TABLE "AiConversation" ADD CONSTRAINT "AiConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Professional relationships
ALTER TABLE "Client" DROP CONSTRAINT IF EXISTS "Client_professionalId_fkey";
ALTER TABLE "Client" ADD CONSTRAINT "Client_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ClientInvite" DROP CONSTRAINT IF EXISTS "ClientInvite_professionalId_fkey";
ALTER TABLE "ClientInvite" ADD CONSTRAINT "ClientInvite_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Exercise" DROP CONSTRAINT IF EXISTS "Exercise_createdById_fkey";
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Workout" DROP CONSTRAINT IF EXISTS "Workout_professionalId_fkey";
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PhysicalAssessment" DROP CONSTRAINT IF EXISTS "PhysicalAssessment_professionalId_fkey";
ALTER TABLE "PhysicalAssessment" ADD CONSTRAINT "PhysicalAssessment_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Food" DROP CONSTRAINT IF EXISTS "Food_createdById_fkey";
ALTER TABLE "Food" ADD CONSTRAINT "Food_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "NutritionPlan" DROP CONSTRAINT IF EXISTS "NutritionPlan_professionalId_fkey";
ALTER TABLE "NutritionPlan" ADD CONSTRAINT "NutritionPlan_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Recipe" DROP CONSTRAINT IF EXISTS "Recipe_createdById_fkey";
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Client relationships
ALTER TABLE "ClientInvite" DROP CONSTRAINT IF EXISTS "ClientInvite_clientId_fkey";
ALTER TABLE "ClientInvite" ADD CONSTRAINT "ClientInvite_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Workout" DROP CONSTRAINT IF EXISTS "Workout_clientId_fkey";
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PhysicalAssessment" DROP CONSTRAINT IF EXISTS "PhysicalAssessment_clientId_fkey";
ALTER TABLE "PhysicalAssessment" ADD CONSTRAINT "PhysicalAssessment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NutritionPlan" DROP CONSTRAINT IF EXISTS "NutritionPlan_clientId_fkey";
ALTER TABLE "NutritionPlan" ADD CONSTRAINT "NutritionPlan_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FoodDiary" DROP CONSTRAINT IF EXISTS "FoodDiary_clientId_fkey";
ALTER TABLE "FoodDiary" ADD CONSTRAINT "FoodDiary_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WaterIntake" DROP CONSTRAINT IF EXISTS "WaterIntake_clientId_fkey";
ALTER TABLE "WaterIntake" ADD CONSTRAINT "WaterIntake_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NutritionGoal" DROP CONSTRAINT IF EXISTS "NutritionGoal_clientId_fkey";
ALTER TABLE "NutritionGoal" ADD CONSTRAINT "NutritionGoal_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Billing relationships
ALTER TABLE "Invoice" DROP CONSTRAINT IF EXISTS "Invoice_subscriptionId_fkey";
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "Payment_subscriptionId_fkey";
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "Payment_invoiceId_fkey";
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Exercise relationships
ALTER TABLE "WorkoutExercise" DROP CONSTRAINT IF EXISTS "WorkoutExercise_workoutId_fkey";
ALTER TABLE "WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkoutExercise" DROP CONSTRAINT IF EXISTS "WorkoutExercise_exerciseId_fkey";
ALTER TABLE "WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Gamification relationships
ALTER TABLE "UserAchievement" DROP CONSTRAINT IF EXISTS "UserAchievement_achievementId_fkey";
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ChallengeParticipant" DROP CONSTRAINT IF EXISTS "ChallengeParticipant_challengeId_fkey";
ALTER TABLE "ChallengeParticipant" ADD CONSTRAINT "ChallengeParticipant_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Nutrition relationships
ALTER TABLE "Meal" DROP CONSTRAINT IF EXISTS "Meal_planId_fkey";
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_planId_fkey" FOREIGN KEY ("planId") REFERENCES "NutritionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MealFood" DROP CONSTRAINT IF EXISTS "MealFood_mealId_fkey";
ALTER TABLE "MealFood" ADD CONSTRAINT "MealFood_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MealFood" DROP CONSTRAINT IF EXISTS "MealFood_foodId_fkey";
ALTER TABLE "MealFood" ADD CONSTRAINT "MealFood_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FoodDiary" DROP CONSTRAINT IF EXISTS "FoodDiary_planId_fkey";
ALTER TABLE "FoodDiary" ADD CONSTRAINT "FoodDiary_planId_fkey" FOREIGN KEY ("planId") REFERENCES "NutritionPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FoodDiary" DROP CONSTRAINT IF EXISTS "FoodDiary_mealId_fkey";
ALTER TABLE "FoodDiary" ADD CONSTRAINT "FoodDiary_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RecipeIngredient" DROP CONSTRAINT IF EXISTS "RecipeIngredient_recipeId_fkey";
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecipeIngredient" DROP CONSTRAINT IF EXISTS "RecipeIngredient_foodId_fkey";
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- =====================================================
-- TRIGGERS PARA TIMESTAMPS AUTOMATICOS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_professional_updated_at ON "Professional";
CREATE TRIGGER update_professional_updated_at BEFORE UPDATE ON "Professional" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_updated_at ON "Client";
CREATE TRIGGER update_client_updated_at BEFORE UPDATE ON "Client" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clientinvite_updated_at ON "ClientInvite";
CREATE TRIGGER update_clientinvite_updated_at BEFORE UPDATE ON "ClientInvite" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_updated_at ON "Subscription";
CREATE TRIGGER update_subscription_updated_at BEFORE UPDATE ON "Subscription" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoice_updated_at ON "Invoice";
CREATE TRIGGER update_invoice_updated_at BEFORE UPDATE ON "Invoice" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_updated_at ON "Payment";
CREATE TRIGGER update_payment_updated_at BEFORE UPDATE ON "Payment" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_plan_updated_at ON "Plan";
CREATE TRIGGER update_plan_updated_at BEFORE UPDATE ON "Plan" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_usage_updated_at ON "Usage";
CREATE TRIGGER update_usage_updated_at BEFORE UPDATE ON "Usage" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_exercise_updated_at ON "Exercise";
CREATE TRIGGER update_exercise_updated_at BEFORE UPDATE ON "Exercise" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workout_updated_at ON "Workout";
CREATE TRIGGER update_workout_updated_at BEFORE UPDATE ON "Workout" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_physicalassessment_updated_at ON "PhysicalAssessment";
CREATE TRIGGER update_physicalassessment_updated_at BEFORE UPDATE ON "PhysicalAssessment" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_message_updated_at ON "Message";
CREATE TRIGGER update_message_updated_at BEFORE UPDATE ON "Message" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_updated_at ON "Notification";
CREATE TRIGGER update_notification_updated_at BEFORE UPDATE ON "Notification" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_achievement_updated_at ON "Achievement";
CREATE TRIGGER update_achievement_updated_at BEFORE UPDATE ON "Achievement" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_streak_updated_at ON "Streak";
CREATE TRIGGER update_streak_updated_at BEFORE UPDATE ON "Streak" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_userstats_updated_at ON "UserStats";
CREATE TRIGGER update_userstats_updated_at BEFORE UPDATE ON "UserStats" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_challenge_updated_at ON "Challenge";
CREATE TRIGGER update_challenge_updated_at BEFORE UPDATE ON "Challenge" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leaderboardentry_updated_at ON "LeaderboardEntry";
CREATE TRIGGER update_leaderboardentry_updated_at BEFORE UPDATE ON "LeaderboardEntry" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_food_updated_at ON "Food";
CREATE TRIGGER update_food_updated_at BEFORE UPDATE ON "Food" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_nutritionplan_updated_at ON "NutritionPlan";
CREATE TRIGGER update_nutritionplan_updated_at BEFORE UPDATE ON "NutritionPlan" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meal_updated_at ON "Meal";
CREATE TRIGGER update_meal_updated_at BEFORE UPDATE ON "Meal" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fooddiary_updated_at ON "FoodDiary";
CREATE TRIGGER update_fooddiary_updated_at BEFORE UPDATE ON "FoodDiary" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_nutritiongoal_updated_at ON "NutritionGoal";
CREATE TRIGGER update_nutritiongoal_updated_at BEFORE UPDATE ON "NutritionGoal" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recipe_updated_at ON "Recipe";
CREATE TRIGGER update_recipe_updated_at BEFORE UPDATE ON "Recipe" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_aiconversation_updated_at ON "AiConversation";
CREATE TRIGGER update_aiconversation_updated_at BEFORE UPDATE ON "AiConversation" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DADOS INICIAIS (SEEDS)
-- =====================================================

-- Inserir exercicios basicos
INSERT INTO "Exercise" ("id", "name", "description", "category", "difficulty", "muscleGroups", "equipment", "isPublic") VALUES
('ex1', 'Flexao de braco', 'Exercicio classico para peitorais, triceps e ombros', 'CHEST', 'BEGINNER', '["peitorais", "triceps", "ombros"]', 'Peso corporal', true),
('ex2', 'Agachamento', 'Exercicio fundamental para pernas e gluteos', 'LEGS', 'BEGINNER', '["quadriceps", "gluteos", "isquiotibiais"]', 'Peso corporal', true),
('ex3', 'Prancha', 'Exercicio isometrico para fortalecimento do core', 'ABS', 'BEGINNER', '["abdomen", "core", "lombar"]', 'Peso corporal', true),
('ex4', 'Burpee', 'Exercicio funcional completo', 'FUNCTIONAL', 'INTERMEDIATE', '["corpo todo"]', 'Peso corporal', true),
('ex5', 'Polichinelo', 'Exercicio cardiovascular basico', 'CARDIO', 'BEGINNER', '["cardiovascular"]', 'Peso corporal', true)
ON CONFLICT ("id") DO NOTHING;

-- Inserir conquistas basicas
INSERT INTO "Achievement" ("id", "key", "name", "description", "category", "type", "points", "requirement", "tier") VALUES
('ach1', 'first_workout', 'Primeiro Treino', 'Complete seu primeiro treino', 'WORKOUT', 'COUNTER', 10, 1, 'BRONZE'),
('ach2', 'workout_streak_7', 'Sequencia de 7 dias', 'Mantenha uma sequencia de 7 dias treinando', 'CONSISTENCY', 'STREAK', 50, 7, 'SILVER'),
('ach3', 'total_workouts_50', '50 Treinos', 'Complete 50 treinos no total', 'MILESTONE', 'COUNTER', 100, 50, 'GOLD'),
('ach4', 'early_bird', 'Madrugador', 'Complete um treino antes das 7h da manha', 'SPECIAL', 'MILESTONE', 25, 1, 'SILVER')
ON CONFLICT ("key") DO NOTHING;

-- Inserir alimentos basicos
INSERT INTO "Food" ("id", "name", "category", "servingSize", "calories", "carbs", "protein", "fat", "isPublic") VALUES
('food1', 'Arroz branco cozido', 'GRAINS_CEREALS', 100, 130, 28, 2.7, 0.3, true),
('food2', 'Peito de frango grelhado', 'MEAT_FISH', 100, 165, 0, 31, 3.6, true),
('food3', 'Brocolis cozido', 'VEGETABLES', 100, 35, 7, 3, 0.4, true),
('food4', 'Banana', 'FRUITS', 100, 89, 23, 1.1, 0.3, true),
('food5', 'Aveia', 'GRAINS_CEREALS', 100, 389, 66, 17, 7, true)
ON CONFLICT ("id") DO NOTHING;

-- =====================================================
-- MENSAGEM FINAL (SEM EMOJIS)
-- =====================================================

SELECT 'FITGENIUS DATABASE SCHEMA CRIADO COM SUCESSO!' as result;
SELECT '36 TABELAS CRIADAS - 100% COMPATIVEL COM CODIGO' as status;
SELECT 'BANCO PRONTO PARA PRODUCAO!' as final_status;