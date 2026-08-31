import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { MuscleSummaryPoint } from "../../api/types";
import { colors, radius, withOpacity } from "../../theme/tokens";
import { buildRegionIntensityMap, getMaxRegionIntensity } from "./muscleMapColors";
import { MuscleMapBack } from "./MuscleMapBack";
import { MuscleMapFront } from "./MuscleMapFront";

type MuscleMapProps = {
  summary: MuscleSummaryPoint[];
  size?: "sm" | "md" | "lg";
  showLegend?: boolean;
  variant?: "front-back" | "front" | "back";
};

const bodyWidths = {
  sm: 70,
  md: 96,
  lg: 118,
};

export function MuscleMap({
  summary,
  size = "md",
  showLegend = false,
  variant = "front-back",
}: MuscleMapProps) {
  const values = useMemo(() => buildRegionIntensityMap(summary), [summary]);
  const maxIntensity = useMemo(() => getMaxRegionIntensity(values), [values]);
  const width = bodyWidths[size];
  const topMuscles = summary.filter((point) => point.effectiveSets > 0).slice(0, 4);
  const empty = topMuscles.length === 0;

  return (
    <View style={[styles.panel, size === "sm" && styles.panelSm]}>
      <View style={styles.bodyRow}>
        {variant !== "back" ? (
          <View style={styles.figure}>
            <MuscleMapFront values={values} maxIntensity={maxIntensity} width={width} />
            <Text style={styles.figureLabel}>Frontal</Text>
          </View>
        ) : null}
        {variant !== "front" ? (
          <View style={styles.figure}>
            <MuscleMapBack values={values} maxIntensity={maxIntensity} width={width} />
            <Text style={styles.figureLabel}>Espalda</Text>
          </View>
        ) : null}
      </View>

      {showLegend ? (
        <View style={styles.legend}>
          {empty ? (
            <Text style={styles.emptyText}>Sin series efectivas registradas.</Text>
          ) : (
            <>
              <View style={styles.scaleRow}>
                <View style={[styles.scaleBlock, styles.scaleLow]} />
                <View style={[styles.scaleBlock, styles.scaleMid]} />
                <View style={[styles.scaleBlock, styles.scaleHigh]} />
                <Text style={styles.scaleText}>
                  Max. {formatSets(summary[0]?.effectiveSets ?? 0)} series
                </Text>
              </View>
              {topMuscles.map((point) => (
                <View key={point.muscle} style={styles.legendRow}>
                  <View
                    style={[
                      styles.legendDot,
                      {
                        opacity: Math.max(
                          0.3,
                          point.effectiveSets / (summary[0]?.effectiveSets ?? 1),
                        ),
                      },
                    ]}
                  />
                  <Text numberOfLines={1} style={styles.legendMuscle}>
                    {point.muscle}
                  </Text>
                  <Text style={styles.legendValue}>{formatSets(point.effectiveSets)}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

function formatSets(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  panelSm: {
    padding: 8,
  },
  bodyRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  figure: {
    alignItems: "center",
    gap: 4,
  },
  figureLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  legend: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 8,
    paddingTop: 10,
  },
  scaleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    marginBottom: 2,
  },
  scaleBlock: {
    borderRadius: 3,
    height: 8,
    width: 22,
  },
  scaleLow: {
    backgroundColor: withOpacity(colors.lime, 0.2),
  },
  scaleMid: {
    backgroundColor: withOpacity(colors.lime, 0.55),
  },
  scaleHigh: {
    backgroundColor: colors.lime,
  },
  scaleText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    marginLeft: 4,
    textTransform: "uppercase",
  },
  legendRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  legendDot: {
    backgroundColor: colors.lime,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  legendMuscle: {
    color: colors.text,
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  legendValue: {
    color: colors.lime,
    fontSize: 12,
    fontWeight: "900",
  },
  emptyText: {
    color: withOpacity(colors.muted, 0.9),
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
});
