import { StyleSheet, Text, View } from "react-native";
import { colors, typography, withOpacity } from "../theme/tokens";
import { Button } from "./Button";

export function TopHeader({
  title,
  eyebrow = "CheluisFIT",
  onLogout,
}: {
  title: string;
  eyebrow?: string;
  onLogout?: () => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
      </View>
      {onLogout ? <Button label="Salir" variant="ghost" onPress={onLogout} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    backgroundColor: colors.backgroundElevated,
    borderBottomColor: withOpacity(colors.borderStrong, 0.45),
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 14,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  copy: {
    flex: 1,
    marginRight: 12,
  },
  eyebrow: {
    color: colors.lime,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900",
    letterSpacing: 0,
  },
});
