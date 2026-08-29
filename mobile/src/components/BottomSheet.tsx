import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, StyleSheet, View } from "react-native";
import { colors, radius, shadow } from "../theme/tokens";

export function BottomSheet({
  children,
  visible,
  onClose,
}: {
  children: ReactNode;
  visible: boolean;
  onClose: () => void;
}) {
  const translateY = useRef(new Animated.Value(28)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    translateY.setValue(28);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, visible]);

  return (
    <Modal animationType="none" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[styles.scrim, { opacity }]} />
        <Pressable onPress={(event) => event.stopPropagation()}>
          <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
            <View style={styles.handle} />
            {children}
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  scrim: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: colors.overlay,
  },
  sheet: {
    ...shadow.floating,
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: colors.border,
    borderRadius: 4,
    height: 4,
    width: 42,
  },
});
