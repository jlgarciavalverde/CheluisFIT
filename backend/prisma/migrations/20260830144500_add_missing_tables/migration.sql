-- CreateEnum (if not exists)
DO $$ BEGIN
  CREATE TYPE "TrainingGoal" AS ENUM ('HYPERTROPHY', 'STRENGTH', 'FAT_LOSS', 'GENERAL_FITNESS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "MeasurementUnits" AS ENUM ('METRIC');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "UserTrainingPreference" (
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

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserTrainingPreference_userId_key" ON "UserTrainingPreference"("userId");

-- CreateIndex (indexes that may have been added during WP work)
CREATE INDEX IF NOT EXISTS "WorkoutSession_userId_status_idx" ON "WorkoutSession"("userId", "status");
CREATE INDEX IF NOT EXISTS "Exercise_name_idx" ON "Exercise"("name");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "UserTrainingPreference" ADD CONSTRAINT "UserTrainingPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
