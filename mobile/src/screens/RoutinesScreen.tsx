import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import type { WorkoutSession, WorkoutTemplate } from "../api/types";
import { useAuth } from "../auth/AuthProvider";
import { BottomSheet } from "../components/BottomSheet";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { RoutineCard } from "../components/RoutineCard";
import { Screen } from "../components/Screen";
import { Section } from "../components/Section";
import { TemplatePickerSheet } from "../components/TemplatePickerSheet";
import { colors } from "../theme/tokens";
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
  const [recentSessions, setRecentSessions] = useState<WorkoutSession[]>([]);
  const [builderTemplate, setBuilderTemplate] = useState<WorkoutTemplate | null | undefined>();
  const [builderSession, setBuilderSession] = useState<WorkoutSession | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const loadTemplates = useCallback(() => {
    apiFetch<{ data: WorkoutTemplate[] }>("/workout-templates")
      .then((result) => setTemplates(result.data))
      .catch(() => undefined);
  }, [apiFetch]);

  const loadRecentSessions = useCallback(() => {
    apiFetch<{ data: WorkoutSession[] }>("/me/workout-sessions?limit=10")
      .then((result) => setRecentSessions(result.data ?? []))
      .catch(() => setRecentSessions([]));
  }, [apiFetch]);

  const totalExercises = templates.reduce((sum, template) => sum + template.exercises.length, 0);
  const totalSets = templates.reduce(
    (sum, template) => sum + template.exercises.reduce((exerciseSum, exercise) => exerciseSum + exercise.sets.length, 0),
    0,
  );
  const recommendedTemplate = templates[0];

  useEffect(() => {
    loadTemplates();
    loadRecentSessions();
  }, [loadTemplates, loadRecentSessions]);

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

  const beginFromBlank = () => {
    setBuilderSession(null);
    setBuilderTemplate(null);
  };

  const beginFromHistory = (session: WorkoutSession) => {
    setBuilderSession(session);
    setBuilderTemplate(null);
    setHistoryOpen(false);
  };

  if (builderTemplate !== undefined) {
    return (
      <RoutineBuilderScreen
        template={builderTemplate}
        seedSession={builderSession}
        onCancel={() => {
          setBuilderTemplate(undefined);
          setBuilderSession(null);
        }}
        onSaved={() => {
          setBuilderTemplate(undefined);
          setBuilderSession(null);
          setMessage("Rutina guardada");
          loadTemplates();
        }}
      />
    );
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Rutinas</Text>
        <Text style={styles.title}>Diseña tu plan semanal</Text>
        <Text style={styles.subtitle}>
          Empieza desde cero, reutiliza un entrenamiento previo o usa una plantilla que te funcione.
        </Text>

        <View style={styles.summaryGrid}>
          <SummaryPill label="Plantillas" value={String(templates.length)} />
          <SummaryPill label="Ejercicios" value={String(totalExercises)} />
          <SummaryPill label="Series" value={String(totalSets)} />
        </View>

        {recommendedTemplate ? (
          <View style={styles.quickSummary}>
            <Text style={styles.quickSummaryLabel}>Ruta rápida</Text>
            <Text style={styles.quickSummaryText}>{recommendedTemplate.name}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.sourceGrid}>
        <SourceOptionCard
          accent="lime"
          description="Configura un plan desde cero con tus objetivos y frecuencia."
          title="Desde cero"
          onPress={beginFromBlank}
          recommended
        />
        <SourceOptionCard
          accent="cyan"
          description="Usa un entrenamiento anterior como base para tu nueva rutina."
          title="Entrenos previos"
          onPress={() => setHistoryOpen(true)}
        />
        <SourceOptionCard
          accent="surface"
          description="Copia una estructura ya validada y personalízala."
          title="Plantillas"
          onPress={() => setPickerOpen(true)}
        />
      </View>

      <Section title="Mis rutinas">
        {templates.length === 0 ? (
          <EmptyState title="Sin rutinas" message="Crea una plantilla para entrenar más rápido." />
        ) : (
          templates.map((template) => (
            <RoutineCard
              key={template.id}
              template={template}
              onClone={() => cloneTemplate(template).catch(showError)}
              onEdit={() => {
                setBuilderSession(null);
                setBuilderTemplate(template);
              }}
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
          setBuilderSession(null);
          setBuilderTemplate(template);
        }}
      />

      <BottomSheet visible={historyOpen} onClose={() => setHistoryOpen(false)}>
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Entrenamientos previos</Text>
          <Text style={styles.sheetSubtitle}>Reutiliza una base y conviértela en tu próximo plan.</Text>
          {recentSessions.length === 0 ? (
            <Text style={styles.emptyText}>Todavía no tienes sesiones previas para reutilizar.</Text>
          ) : (
            recentSessions.map((session) => (
              <Pressable
                key={session.id}
                onPress={() => beginFromHistory(session)}
                style={styles.sessionCard}
              >
                <Text style={styles.sessionTitle}>{formatSessionDate(session.performedAt)}</Text>
                <Text style={styles.sessionMeta}>
                  {session.exercises.length} ejercicios · {session.exercises.reduce((total, exercise) => total + exercise.sets.length, 0)} series
                </Text>
              </Pressable>
            ))
          )}
          <Button label="Cerrar" variant="ghost" onPress={() => setHistoryOpen(false)} />
        </View>
      </BottomSheet>
    </Screen>
  );
}

function SourceOptionCard({
  accent,
  description,
  title,
  onPress,
  recommended = false,
}: {
  accent: "lime" | "cyan" | "surface";
  description: string;
  title: string;
  onPress: () => void;
  recommended?: boolean;
}) {
  const accentStyles = {
    lime: { backgroundColor: `${colors.lime}1A`, borderColor: colors.lime },
    cyan: { backgroundColor: `${colors.cyan}1A`, borderColor: colors.cyan },
    surface: { backgroundColor: colors.surface, borderColor: colors.border },
  } as const;

  return (
    <Pressable onPress={onPress} style={[styles.optionCard, accentStyles[accent]]}>
      {recommended ? <Text style={styles.optionBadge}>Recomendado</Text> : null}
      <Text style={styles.optionTitle}>{title}</Text>
      <Text style={styles.optionDescription}>{description}</Text>
    </Pressable>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryPill}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function formatSessionDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function showError(error: unknown) {
  Alert.alert("Error", error instanceof Error ? error.message : "Algo ha fallado");
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  eyebrow: {
    color: colors.lime,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 8,
  },
  quickSummary: {
    alignItems: "flex-start",
    backgroundColor: "rgba(34, 211, 238, 0.08)",
    borderColor: "rgba(34, 211, 238, 0.25)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  quickSummaryLabel: {
    color: colors.cyan,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  quickSummaryText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  summaryPill: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  summaryValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  sourceGrid: {
    gap: 10,
  },
  optionCard: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  optionBadge: {
    color: colors.lime,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  optionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  optionDescription: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  sheetContent: {
    gap: 12,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  sheetSubtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  sessionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  sessionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  sessionMeta: {
    color: colors.muted,
    fontSize: 12,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
  },
});
