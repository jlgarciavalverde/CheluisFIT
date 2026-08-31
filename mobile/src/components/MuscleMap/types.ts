export type MuscleRegionId =
  | "abs"
  | "abductors"
  | "adductors"
  | "backShoulders"
  | "biceps"
  | "calvesBack"
  | "calvesFront"
  | "chest"
  | "forearms"
  | "frontShoulders"
  | "glutes"
  | "hamstrings"
  | "lats"
  | "lowerBack"
  | "obliques"
  | "quads"
  | "serratus"
  | "traps"
  | "triceps"
  | "upperBack";

export type MuscleMapPath = {
  id: MuscleRegionId;
  d: string;
  mirror?: boolean;
};

export type RegionIntensityMap = Record<MuscleRegionId, number>;
