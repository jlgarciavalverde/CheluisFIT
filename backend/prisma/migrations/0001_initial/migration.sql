-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ExerciseSource" AS ENUM ('EXERCISE_LIBRARY');

-- CreateEnum
CREATE TYPE "ExerciseSetType" AS ENUM ('NORMAL', 'WARMUP', 'SUPERSET', 'DROPSET');

-- CreateEnum
CREATE TYPE "WorkoutSessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TrainingGoal" AS ENUM ('HYPERTROPHY', 'STRENGTH', 'FAT_LOSS', 'GENERAL_FITNESS');

-- CreateEnum
CREATE TYPE "MeasurementUnits" AS ENUM ('METRIC');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName1" TEXT NOT NULL,
    "lastName2" TEXT,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "currentWeightKg" DOUBLE PRECISION NOT NULL,
    "currentHeightCm" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTrainingPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "defaultRestSeconds" INTEGER NOT NULL DEFAULT 90,
    "weeklyFrequency" INTEGER NOT NULL DEFAULT 4,
    "goal" "TrainingGoal" NOT NULL DEFAULT 'HYPERTROPHY',
    "units" "MeasurementUnits" NOT NULL DEFAULT 'METRIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTrainingPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyMeasurement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "heightCm" INTEGER NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BodyMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "source" "ExerciseSource" NOT NULL DEFAULT 'EXERCISE_LIBRARY',
    "name" TEXT NOT NULL,
    "gifUrl" TEXT NOT NULL,
    "targetMuscles" TEXT[],
    "secondaryMuscles" TEXT[],
    "bodyParts" TEXT[],
    "equipment" TEXT[],
    "instructions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "WorkoutSessionStatus" NOT NULL DEFAULT 'COMPLETED',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutExercise" (
    "id" TEXT NOT NULL,
    "workoutSessionId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseSet" (
    "id" TEXT NOT NULL,
    "workoutExerciseId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "reps" INTEGER NOT NULL,
    "type" "ExerciseSetType" NOT NULL DEFAULT 'NORMAL',
    "restSeconds" INTEGER NOT NULL DEFAULT 90,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExerciseSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteExercise" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutTemplateExercise" (
    "id" TEXT NOT NULL,
    "workoutTemplateId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutTemplateExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutTemplateSet" (
    "id" TEXT NOT NULL,
    "workoutTemplateExerciseId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "targetWeightKg" DOUBLE PRECISION,
    "targetReps" INTEGER,
    "type" "ExerciseSetType" NOT NULL DEFAULT 'NORMAL',
    "restSeconds" INTEGER NOT NULL DEFAULT 90,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutTemplateSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserTrainingPreference_userId_key" ON "UserTrainingPreference"("userId");

-- CreateIndex
CREATE INDEX "BodyMeasurement_userId_idx" ON "BodyMeasurement"("userId");

-- CreateIndex
CREATE INDEX "BodyMeasurement_measuredAt_idx" ON "BodyMeasurement"("measuredAt");

-- CreateIndex
CREATE INDEX "Exercise_name_idx" ON "Exercise"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_source_externalId_key" ON "Exercise"("source", "externalId");

-- CreateIndex
CREATE INDEX "WorkoutSession_userId_performedAt_idx" ON "WorkoutSession"("userId", "performedAt");

-- CreateIndex
CREATE INDEX "WorkoutSession_userId_status_idx" ON "WorkoutSession"("userId", "status");

-- CreateIndex
CREATE INDEX "WorkoutExercise_workoutSessionId_idx" ON "WorkoutExercise"("workoutSessionId");

-- CreateIndex
CREATE INDEX "WorkoutExercise_exerciseId_idx" ON "WorkoutExercise"("exerciseId");

-- CreateIndex
CREATE INDEX "ExerciseSet_workoutExerciseId_idx" ON "ExerciseSet"("workoutExerciseId");

-- CreateIndex
CREATE INDEX "FavoriteExercise_userId_idx" ON "FavoriteExercise"("userId");

-- CreateIndex
CREATE INDEX "FavoriteExercise_exerciseId_idx" ON "FavoriteExercise"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteExercise_userId_exerciseId_key" ON "FavoriteExercise"("userId", "exerciseId");

-- CreateIndex
CREATE INDEX "WorkoutTemplate_userId_name_idx" ON "WorkoutTemplate"("userId", "name");

-- CreateIndex
CREATE INDEX "WorkoutTemplateExercise_workoutTemplateId_idx" ON "WorkoutTemplateExercise"("workoutTemplateId");

-- CreateIndex
CREATE INDEX "WorkoutTemplateExercise_exerciseId_idx" ON "WorkoutTemplateExercise"("exerciseId");

-- CreateIndex
CREATE INDEX "WorkoutTemplateSet_workoutTemplateExerciseId_idx" ON "WorkoutTemplateSet"("workoutTemplateExerciseId");

-- AddForeignKey
ALTER TABLE "UserTrainingPreference" ADD CONSTRAINT "UserTrainingPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyMeasurement" ADD CONSTRAINT "BodyMeasurement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_workoutSessionId_fkey" FOREIGN KEY ("workoutSessionId") REFERENCES "WorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseSet" ADD CONSTRAINT "ExerciseSet_workoutExerciseId_fkey" FOREIGN KEY ("workoutExerciseId") REFERENCES "WorkoutExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteExercise" ADD CONSTRAINT "FavoriteExercise_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteExercise" ADD CONSTRAINT "FavoriteExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutTemplate" ADD CONSTRAINT "WorkoutTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutTemplateExercise" ADD CONSTRAINT "WorkoutTemplateExercise_workoutTemplateId_fkey" FOREIGN KEY ("workoutTemplateId") REFERENCES "WorkoutTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutTemplateExercise" ADD CONSTRAINT "WorkoutTemplateExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutTemplateSet" ADD CONSTRAINT "WorkoutTemplateSet_workoutTemplateExerciseId_fkey" FOREIGN KEY ("workoutTemplateExerciseId") REFERENCES "WorkoutTemplateExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

