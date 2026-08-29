import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../theme/tokens";
import { Button } from "./Button";

export function ErrorState({
  title = "No se pudo cargar",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? <Button label="Reintentar" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderColor: colors.error,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  title: {
    color: colors.error,
    fontSize: 15,
    fontWeight: "900",
  },
  message: {
    color: colors.muted,
    fontSize: 13,
  },
});
