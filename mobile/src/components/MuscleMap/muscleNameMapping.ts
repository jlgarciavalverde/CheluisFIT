import type { MuscleRegionId } from "./types";

export const muscleNameToRegions: Record<string, MuscleRegionId[]> = {
  abductors: ["abductors"],
  abs: ["abs"],
  adductors: ["adductors"],
  biceps: ["biceps"],
  calves: ["calvesFront", "calvesBack"],
  "cardiovascular system": [],
  delts: ["frontShoulders", "backShoulders"],
  forearms: ["forearms"],
  glutes: ["glutes"],
  hamstrings: ["hamstrings"],
  lats: ["lats"],
  "levator scapulae": ["traps"],
  obliques: ["obliques"],
  pectorals: ["chest"],
  quads: ["quads"],
  "serratus anterior": ["serratus"],
  spine: ["lowerBack"],
  traps: ["traps"],
  triceps: ["triceps"],
  "upper back": ["upperBack"],
};

export function getRegionsForMuscle(muscle: string) {
  return muscleNameToRegions[muscle.trim().toLowerCase()] ?? [];
}
