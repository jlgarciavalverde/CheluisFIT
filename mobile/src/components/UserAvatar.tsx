import { StyleSheet, Text, View } from "react-native";
import { colors, withOpacity } from "../theme/tokens";

export function UserAvatar({
  firstName,
  lastName,
  size = 72,
}: {
  firstName: string;
  lastName: string;
  size?: number;
}) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const fontSize = size * 0.33;

  return (
    <View
      style={[
        styles.avatar,
        {
          borderRadius: size / 2,
          height: size,
          width: size,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    backgroundColor: withOpacity(colors.lime, 0.12),
    borderColor: colors.lime,
    borderWidth: 2,
    justifyContent: "center",
  },
  initials: {
    color: colors.lime,
    fontWeight: "900",
  },
});
