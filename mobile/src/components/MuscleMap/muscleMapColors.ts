import { colors, withOpacity } from "../../theme/tokens";
import { getRegionsForMuscle } from "./muscleNameMapping";
import type { MuscleSummaryPoint } from "../../api/types";
import type { MuscleRegionId, RegionIntensityMap } from "./types";

export function createEmptyRegionIntensityMap(): RegionIntensityMap {
  return {
    abs: 0,
    abductors: 0,
    adductors: 0,
    backShoulders: 0,
    biceps: 0,
    calvesBack: 0,
    calvesFront: 0,
    chest: 0,
    forearms: 0,
    frontShoulders: 0,
    glutes: 0,
    hamstrings: 0,
    lats: 0,
    lowerBack: 0,
    obliques: 0,
    quads: 0,
    serratus: 0,
    traps: 0,
    triceps: 0,
    upperBack: 0,
  };
}

export function buildRegionIntensityMap(summary: MuscleSummaryPoint[]) {
  const values = createEmptyRegionIntensityMap();

  for (const point of summary) {
    const regions = getRegionsForMuscle(point.muscle);

    for (const region of regions) {
      values[region] += point.effectiveSets;
    }
  }

  return values;
}

export function getRegionFill(
  regionId: MuscleRegionId,
  values: RegionIntensityMap,
  maxEffectiveSets: number,
) {
  const value = values[regionId];
  if (!value || maxEffectiveSets <= 0) return colors.surface3;

  const alpha = Math.max(0.15, Math.min(value / maxEffectiveSets, 1));
  return withOpacity(colors.lime, alpha);
}

export function getMaxRegionIntensity(values: RegionIntensityMap) {
  return Math.max(...Object.values(values), 0);
}
