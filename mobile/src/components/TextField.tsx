import { StyleSheet, TextInput, TextInputProps } from "react-native";
import { colors, radius } from "../theme/tokens";

export function TextField(props: TextInputProps) {
  return (
    <TextInput placeholderTextColor={colors.muted} {...props} style={[styles.input, props.style]} />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
