import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../theme/tokens";

export function StatStrip({ items }: { items: Array<{ label: string; value: string | number }> }) {
  return (
    <View style={styles.strip}>
      {items.map((item) => (
        <View key={item.label} style={styles.item}>
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.value}>
            {item.value}
          </Text>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    padding: 10,
  },
  item: {
    flex: 1,
  },
  value: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 3,
  },
});
