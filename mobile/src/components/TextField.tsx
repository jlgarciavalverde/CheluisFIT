import { useState } from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";
import { colors, radius } from "../theme/tokens";

export function TextField(props: TextInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      placeholderTextColor={colors.muted}
      selectionColor={colors.lime}
      {...props}
      onBlur={(event) => {
        setFocused(false);
        props.onBlur?.(event);
      }}
      onFocus={(event) => {
        setFocused(true);
        props.onFocus?.(event);
      }}
      style={[
        styles.input,
        focused && styles.focused,
        props.multiline && styles.multiline,
        props.style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  focused: {
    backgroundColor: colors.surface,
    borderColor: colors.lime,
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: "top",
  },
});
