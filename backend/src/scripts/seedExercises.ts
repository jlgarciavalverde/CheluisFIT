import "dotenv/config";
import { ExerciseSource } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { normalizeExerciseLibraryItem } from "../services/exerciseService";

const EXERCISE_LIBRARY_URL =
  "https://raw.githubusercontent.com/mohamedatef90/exercise-library/main/exercises.json";

type ExerciseLibraryItem = {
  id: string;
  name: string;
  gif: string;
  targetMuscles: string[];
  secondaryMuscles: string[];
  bodyParts: string[];
  equipment: string[];
  instructions: string[];
};

async function main() {
  const response = await fetch(EXERCISE_LIBRARY_URL);

  if (!response.ok) {
    throw new Error(`Exercise library download failed with status ${response.status}`);
  }

  const exercises = (await response.json()) as ExerciseLibraryItem[];
  let importedCount = 0;

  for (const exercise of exercises) {
    const normalizedExercise = normalizeExerciseLibraryItem(exercise);

    await prisma.exercise.upsert({
      where: {
        source_externalId: {
          source: ExerciseSource.EXERCISE_LIBRARY,
          externalId: normalizedExercise.externalId,
        },
      },
      create: normalizedExercise,
      update: normalizedExercise,
    });

    importedCount += 1;
  }

  console.log(`Imported ${importedCount} exercises from exercise-library.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
