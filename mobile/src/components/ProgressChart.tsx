import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, withOpacity } from "../theme/tokens";

export function ProgressChart({ values, labels }: { values: number[]; labels?: string[] }) {
  const slice = values.slice(-12);
  const sliceLabels = labels?.slice(-12);
  const max = useMemo(() => Math.max(...slice, 1), [slice]);
  const min = useMemo(() => Math.min(...slice), [slice]);
  const range = Math.max(max - min, 1);
  const avg = useMemo(
    () => (slice.length > 0 ? slice.reduce((a, b) => a + b, 0) / slice.length : 0),
    [slice],
  );

  if (values.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyText}>Sin datos todavia.</Text>
      </View>
    );
  }

  const avgHeight = Math.max(18, ((avg - min) / range) * 104 + 16);
  const isLast = (i: number) => i === slice.length - 1;

  return (
    <View style={styles.wrapper}>
      <View style={styles.annotations}>
        <Text style={styles.annotationText}>{Math.round(max)}</Text>
        <Text style={styles.annotationText}>{Math.round(min)}</Text>
      </View>
      <View style={styles.chart}>
        <View style={[styles.gridLine, { bottom: 116 }]} />
        <View style={[styles.gridLine, { bottom: 64 }]} />
        <View style={[styles.avgLine, { bottom: avgHeight + 12 }]}>
          <Text style={styles.avgLabel}>x&#772; {avg.toFixed(1)}</Text>
        </View>

        {slice.map((value, index) => {
          const label = sliceLabels?.[index];
          const barHeight = Math.max(18, ((value - min) / range) * 104 + 16);

          return (
            <View key={`${value}-${index}`} style={styles.barWrap}>
              <View style={[styles.bar, { height: barHeight }, isLast(index) && styles.barCurrent]}>
                <View style={[styles.barTop, { height: barHeight * 0.4 }]} />
              </View>
              <Text style={[styles.barLabel, isLast(index) && styles.barLabelCurrent]}>
                {Math.round(value)}
              </Text>
              {label ? (
                <Text numberOfLines={1} style={styles.dateLabel}>
                  {compactDate(label)}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function compactDate(value: string) {
  const date = new Date(value);
  if (isNaN(date.getTime())) return value.slice(0, 5);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  return `${day}/${month}`;
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    gap: 6,
  },
  annotations: {
    justifyContent: "space-between",
    paddingBottom: 32,
    paddingTop: 4,
  },
  annotationText: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "700",
  },
  chart: {
    alignItems: "flex-end",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 150,
    padding: 12,
    position: "relative",
  },
  gridLine: {
    borderTopColor: withOpacity(colors.borderStrong, 0.28),
    borderTopWidth: 1,
    left: 12,
    position: "absolute",
    right: 12,
  },
  avgLine: {
    borderTopColor: withOpacity(colors.muted, 0.3),
    borderTopWidth: 1,
    left: 8,
    position: "absolute",
    right: 8,
  },
  avgLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "700",
    position: "absolute",
    right: 0,
    top: -12,
  },
  barWrap: {
    alignItems: "center",
    flex: 1,
    gap: 4,
    justifyContent: "flex-end",
  },
  bar: {
    backgroundColor: colors.cyan,
    borderRadius: 5,
    overflow: "hidden",
    width: "100%",
  },
  barTop: {
    backgroundColor: withOpacity(colors.cyan, 0.5),
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    width: "100%",
  },
  barCurrent: {
    borderColor: colors.lime,
    borderWidth: 1.5,
  },
  barLabel: {
    color: colors.muted,
    fontSize: 10,
  },
  barLabelCurrent: {
    color: colors.text,
    fontWeight: "800",
  },
  dateLabel: {
    color: colors.muted,
    fontSize: 9,
    maxWidth: 42,
  },
  emptyChart: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 110,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
  },
});
