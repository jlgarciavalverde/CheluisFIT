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
          <Text style={styles.title}>Selecciona una plantilla</Text>
          <Text style={styles.subtitle}>Usa una base ya validada y personalízala a tu objetivo.</Text>

          {templates.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Sin plantillas todavía</Text>
              <Text style={styles.emptyText}>Crea tu primera rutina desde cero y guárdala para reutilizarla.</Text>
            </View>
          ) : (
            templates.map((template) => {
              const setCount = template.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);

              return (
                <Pressable key={template.id} style={styles.row} onPress={() => onPick(template)}>
                  <Text style={styles.name}>{template.name}</Text>
                  <View style={styles.rowMeta}>
                    <Text style={styles.meta}>{template.exercises.length} ejercicios</Text>
                    <Text style={styles.meta}>·</Text>
                    <Text style={styles.meta}>{setCount} series</Text>
                  </View>
                </Pressable>
              );
            })
          )}

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
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    gap: 10,
    padding: 16,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  row: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 6,
    padding: 12,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  rowMeta: {
    flexDirection: "row",
    gap: 6,
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  emptyText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
});
