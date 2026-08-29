import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import type { WorkoutTemplate } from "../api/types";
import { useAuth } from "../auth/AuthProvider";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { RoutineCard } from "../components/RoutineCard";
import { Screen } from "../components/Screen";
import { Section } from "../components/Section";
import { TemplatePickerSheet } from "../components/TemplatePickerSheet";
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
        <View style={styles.actions}>
          <Button label="Crear desde cero" onPress={() => setBuilderTemplate(null)} />
          <Button
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
    </Screen>
  );
}

function showError(error: unknown) {
  Alert.alert("Error", error instanceof Error ? error.message : "Algo ha fallado");
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: 8,
  },
});
