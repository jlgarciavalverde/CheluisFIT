import { ExerciseSource } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { normalizeExerciseLibraryItem } from "./exerciseService";

describe("normalizeExerciseLibraryItem", () => {
  it("maps exercise-library data into the local Prisma shape", () => {
    const exercise = normalizeExerciseLibraryItem({
      id: "push-up",
      name: "Push-up",
      gif: "push-up.gif",
      targetMuscles: ["pectorals"],
      secondaryMuscles: ["triceps"],
      bodyParts: ["chest"],
      equipment: ["body weight"],
      instructions: ["Keep your body straight."],
    });

    expect(exercise).toEqual({
      externalId: "push-up",
      source: ExerciseSource.EXERCISE_LIBRARY,
      name: "Push-up",
      gifUrl:
        "https://raw.githubusercontent.com/mohamedatef90/exercise-library/main/gifs/push-up.gif",
      targetMuscles: ["pectorals"],
      secondaryMuscles: ["triceps"],
      bodyParts: ["chest"],
      equipment: ["body weight"],
      instructions: ["Keep your body straight."],
    });
  });
});
