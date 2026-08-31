import { WorkoutSessionStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { computeMuscleSummaryFromSessions } from "./muscleSummaryService";

export async function getAllTimeMuscleStats(userId: string) {
  const sessions = await prisma.workoutSession.findMany({
    where: {
      userId,
      status: WorkoutSessionStatus.COMPLETED,
    },
    include: {
      exercises: {
        include: {
          exercise: true,
          sets: true,
        },
      },
    },
    orderBy: { performedAt: "asc" },
  });

  return { data: computeMuscleSummaryFromSessions(sessions) };
}
