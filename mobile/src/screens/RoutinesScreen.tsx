import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Copy, Dumbbell, Plus } from "lucide-react-native";
import type { WorkoutTemplate } from "../api/types";
import { useAuth } from "../auth/AuthProvider";
import { BottomSheet } from "../components/BottomSheet";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { RoutineCard } from "../components/RoutineCard";
import { Screen } from "../components/Screen";
import { Section } from "../components/Section";
import { TemplatePickerSheet } from "../components/TemplatePickerSheet";
import { colors, radius, shadow } from "../theme/tokens";
import { RoutineBuilderScreen } from "./RoutineBuilderScreen";

export function RoutinesScreen({
  onActiveChange,
  setMessage,
}: {
  onActiveChange: () => void;
  setMessage: (value: string) => void;
}) {
  const { apiFetch } = useAuth();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [builderTemplate, setBuilderTemplate] = useState<WorkoutTemplate | null | undefined>();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);

  const loadTemplates = useCallback(() => {
    apiFetch<{ data: WorkoutTemplate[] }>("/workout-templates")
      .then((result) => setTemplates(result.data))
      .catch(() => undefined);
  }, [apiFetch]);

  useEffect(loadTemplates, [loadTemplates]);

  const startTemplate = async (template: WorkoutTemplate) => {
    await apiFetch(`/workout-templates/${template.id}/start`, { method: "POST" });
    onActiveChange();
    setMessage("Entreno iniciado");
  };

  const cloneTemplate = async (template: WorkoutTemplate) => {
    await apiFetch(`/workout-templates/${template.id}/clone`, { method: "POST" });
    setMessage("Rutina clonada");
    loadTemplates();
  };

  if (builderTemplate !== undefined) {
    return (
      <RoutineBuilderScreen
        template={builderTemplate}
        onCancel={() => setBuilderTemplate(undefined)}
        onSaved={() => {
          setBuilderTemplate(undefined);
          setMessage("Rutina guardada");
          loadTemplates();
        }}
      />
    );
  }

  return (
    <Screen>
      <Section title="Mis rutinas">
        <View style={styles.hero}>
          <Button icon={Plus} label="Crear desde cero" onPress={() => setBuilderTemplate(null)} />
          <Button
            icon={Copy}
            label="Usar plantilla"
            variant="secondary"
            onPress={() => setPickerOpen(true)}
          />
        </View>

        {templates.length === 0 ? (
          <EmptyState title="Sin rutinas" message="Crea una plantilla para entrenar mas rapido." />
        ) : (
          templates.map((template) => (
            <RoutineCard
              key={template.id}
              template={template}
              onClone={() => cloneTemplate(template).catch(showError)}
              onEdit={() => setBuilderTemplate(template)}
              onOpen={() => setSelectedTemplate(template)}
              onStart={() => startTemplate(template).catch(showError)}
            />
          ))
        )}
      </Section>

      <TemplatePickerSheet
        visible={pickerOpen}
        templates={templates}
        onClose={() => setPickerOpen(false)}
        onPick={(template) => {
          setPickerOpen(false);
          cloneTemplate(template).catch(showError);
        }}
      />

      <BottomSheet visible={Boolean(selectedTemplate)} onClose={() => setSelectedTemplate(null)}>
        {selectedTemplate ? (
          <>
            <Text style={styles.sheetTitle}>{selectedTemplate.name}</Text>
            <Text style={styles.sheetMeta}>
              {selectedTemplate.exercises.length} ejercicios · {countSets(selectedTemplate)} series · {estimateMinutes(selectedTemplate)} min
            </Text>
            {selectedTemplate.exercises.slice(0, 6).map((exercise) => (
              <View key={exercise.id} style={styles.previewRow}>
                <Text style={styles.previewTitle}>{exercise.exercise.name}</Text>
                <Text style={styles.sheetMeta}>
                  {exercise.sets.map((set) => `${set.targetWeightKg ?? 0}x${set.targetReps ?? 0}`).join(" · ")}
                </Text>
              </View>
            ))}
            <View style={styles.actions}>
              <Button
                icon={Dumbbell}
                label="Empezar"
                onPress={() => {
                  const template = selectedTemplate;
                  setSelectedTemplate(null);
                  startTemplate(template).catch(showError);
                }}
              />
              <Button
                label="Editar"
                variant="secondary"
                onPress={() => {
                  setBuilderTemplate(selectedTemplate);
                  setSelectedTemplate(null);
                }}
              />
            </View>
          </>
        ) : null}
      </BottomSheet>
    </Screen>
  );
}

function countSets(template: WorkoutTemplate) {
  return template.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
}

function estimateMinutes(template: WorkoutTemplate) {
  return Math.max(Math.round(template.exercises.length * 4 + countSets(template) * 1.5), 20);
}

function showError(error: unknown) {
  Alert.alert("Error", error instanceof Error ? error.message : "Algo ha fallado");
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 8,
    padding: 12,
    ...shadow.card,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  sheetMeta: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  previewRow: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 4,
    padding: 10,
  },
  previewTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
    textTransform: "capitalize",
  },
});
