import { Pressable, StyleSheet, Text } from "react-native";
import type { WorkoutTemplate } from "../api/types";
import { colors, radius } from "../theme/tokens";
import { BottomSheet } from "./BottomSheet";
import { Button } from "./Button";

export function TemplatePickerSheet({
  visible,
  templates,
  onClose,
  onPick,
}: {
  visible: boolean;
  templates: WorkoutTemplate[];
  onClose: () => void;
  onPick: (template: WorkoutTemplate) => void;
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Usar plantilla</Text>
      {templates.map((template) => (
        <Pressable key={template.id} style={styles.row} onPress={() => onPick(template)}>
          <Text style={styles.name}>{template.name}</Text>
          <Text style={styles.meta}>{template.exercises.length} ejercicios</Text>
        </Pressable>
      ))}
      <Button label="Cerrar" variant="ghost" onPress={onClose} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    gap: 4,
    padding: 12,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
  },
});
