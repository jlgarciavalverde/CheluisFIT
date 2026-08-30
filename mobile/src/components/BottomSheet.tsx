import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { colors, radius, shadow } from "../theme/tokens";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const MAX_HEIGHT = SCREEN_HEIGHT * 0.85;
const DISMISS_THRESHOLD = 120;

export function BottomSheet({
  children,
  visible,
  onClose,
  scrollable = true,
}: {
  children: ReactNode;
  visible: boolean;
  onClose: () => void;
  scrollable?: boolean;
}) {
  const translateY = useRef(new Animated.Value(MAX_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 4,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > DISMISS_THRESHOLD || gesture.vy > 0.5) {
          dismiss();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
        }
      },
    }),
  ).current;

  useEffect(() => {
    if (!visible) return;

    translateY.setValue(MAX_HEIGHT);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, visible]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: MAX_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  return (
    <Modal animationType="none" transparent visible={visible} onRequestClose={dismiss}>
      <Pressable style={styles.backdrop} onPress={dismiss}>
        <Animated.View style={[styles.scrim, { opacity }]} />
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
            <View {...panResponder.panHandlers} style={styles.handleZone}>
              <View style={styles.handle} />
            </View>
            {scrollable ? (
              <ScrollView
                bounces={false}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
              >
                {children}
              </ScrollView>
            ) : (
              <View style={styles.scrollContent}>{children}</View>
            )}
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
    maxHeight: MAX_HEIGHT,
  },
  handleZone: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    backgroundColor: colors.border,
    borderRadius: 4,
    height: 4,
    width: 42,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
