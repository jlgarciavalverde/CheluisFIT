import Svg, { G, Path } from "react-native-svg";
import { colors } from "../../theme/tokens";
import { frontMusclePaths, frontSilhouette } from "./muscleMapPaths";
import { getRegionFill } from "./muscleMapColors";
import type { RegionIntensityMap } from "./types";

export function MuscleMapFront({
  maxIntensity,
  values,
  width,
}: {
  maxIntensity: number;
  values: RegionIntensityMap;
  width: number;
}) {
  return (
    <Svg width={width} height={width * 2.25} viewBox="0 0 200 450">
      <Path
        d={frontSilhouette}
        fill={colors.surface2}
        stroke={colors.border}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      {frontMusclePaths.map((path) => (
        <G key={path.id}>
          <Path
            d={path.d}
            fill={getRegionFill(path.id, values, maxIntensity)}
            stroke={colors.border}
            strokeWidth={1}
          />
          {path.mirror ? (
            <Path
              d={path.d}
              fill={getRegionFill(path.id, values, maxIntensity)}
              stroke={colors.border}
              strokeWidth={1}
              transform="translate(200 0) scale(-1 1)"
            />
          ) : null}
        </G>
      ))}
    </Svg>
  );
}
