import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type { WorkoutTemplate } from "../api/types";
import { colors, radius } from "../theme/tokens";
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
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <Text style={styles.title}>Usar plantilla</Text>
          {templates.map((template) => (
            <Pressable key={template.id} style={styles.row} onPress={() => onPick(template)}>
              <Text style={styles.name}>{template.name}</Text>
              <Text style={styles.meta}>{template.exercises.length} ejercicios</Text>
            </Pressable>
          ))}
          <Button label="Cerrar" variant="ghost" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.68)",
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface2,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    gap: 10,
    padding: 16,
  },
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
