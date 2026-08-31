import { prisma } from "../lib/prisma";
import { computeDurationMinutes, computeMuscleSummaryFromSessions } from "./muscleSummaryService";

export async function getDashboard(userId: string) {
  const weekStart = getWeekStart(new Date());

  const [workoutsThisWeek, weeklySessions, recentSessions, bodyMeasurements] =
    await prisma.$transaction([
      prisma.workoutSession.count({
        where: {
          userId,
          performedAt: {
            gte: weekStart,
          },
        },
      }),
      prisma.workoutSession.findMany({
        where: {
          userId,
          performedAt: {
            gte: weekStart,
          },
        },
        include: {
          exercises: {
            include: {
              exercise: true,
              sets: true,
            },
          },
        },
        orderBy: { performedAt: "desc" },
      }),
      prisma.workoutSession.findMany({
        where: { userId },
        include: {
          exercises: {
            include: {
              exercise: true,
              sets: true,
            },
          },
        },
        orderBy: { performedAt: "desc" },
        take: 10,
      }),
      prisma.bodyMeasurement.findMany({
        where: { userId },
        orderBy: { measuredAt: "asc" },
        take: 20,
      }),
    ]);

  const exerciseStats = new Map<
    string,
    {
      exerciseId: string;
      name: string;
      sessions: Set<string>;
      totalSets: number;
      totalVolumeKg: number;
      lastPerformedAt: Date;
    }
  >();

  for (const session of recentSessions) {
    for (const workoutExercise of session.exercises) {
      const existing = exerciseStats.get(workoutExercise.exerciseId);
      const stat = existing ?? {
        exerciseId: workoutExercise.exerciseId,
        name: workoutExercise.exercise.name,
        sessions: new Set<string>(),
        totalSets: 0,
        totalVolumeKg: 0,
        lastPerformedAt: session.performedAt,
      };

      stat.sessions.add(session.id);
      stat.totalSets += workoutExercise.sets.length;
      stat.totalVolumeKg += workoutExercise.sets.reduce(
        (total, set) => total + set.weightKg * set.reps,
        0,
      );
      stat.lastPerformedAt =
        session.performedAt > stat.lastPerformedAt ? session.performedAt : stat.lastPerformedAt;
      exerciseStats.set(workoutExercise.exerciseId, stat);
    }
  }

  return {
    data: {
      workoutsThisWeek,
      weeklyMuscleSummary: computeMuscleSummaryFromSessions(weeklySessions),
      recentWorkouts: recentSessions.map((session) => ({
        id: session.id,
        performedAt: session.performedAt.toISOString(),
        durationMinutes: computeDurationMinutes(session.startedAt, session.completedAt),
        exerciseCount: session.exercises.length,
        totalSets: session.exercises.reduce(
          (total, workoutExercise) => total + workoutExercise.sets.length,
          0,
        ),
        totalVolumeKg: session.exercises.reduce(
          (sessionTotal, workoutExercise) =>
            sessionTotal +
            workoutExercise.sets.reduce((total, set) => total + set.weightKg * set.reps, 0),
          0,
        ),
      })),
      mostWorkedExercises: Array.from(exerciseStats.values())
        .sort((a, b) => b.totalSets - a.totalSets)
        .slice(0, 5)
        .map((stat) => ({
          exerciseId: stat.exerciseId,
          name: stat.name,
          sessionCount: stat.sessions.size,
          totalSets: stat.totalSets,
          totalVolumeKg: stat.totalVolumeKg,
          lastPerformedAt: stat.lastPerformedAt.toISOString(),
        })),
      bodyWeightTrend: bodyMeasurements.map((measurement) => ({
        measuredAt: measurement.measuredAt.toISOString(),
        weightKg: measurement.weightKg,
        heightCm: measurement.heightCm,
      })),
    },
  };
}

function getWeekStart(date: Date) {
  const weekStart = new Date(date);
  const day = weekStart.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  weekStart.setUTCDate(weekStart.getUTCDate() + diff);
  weekStart.setUTCHours(0, 0, 0, 0);
  return weekStart;
}
