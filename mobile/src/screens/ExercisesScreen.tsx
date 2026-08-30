import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import type {
  Exercise,
  ProgressionSuggestion,
  ProgressPoint,
  WorkoutSession,
  WorkoutTemplate,
} from "../api/types";
import { useAuth } from "../auth/AuthProvider";
import { EmptyState } from "../components/EmptyState";
import { ExerciseFilterBar } from "../components/ExerciseFilterBar";
import { ExerciseRow } from "../components/ExerciseRow";
import { LoadingState } from "../components/LoadingState";
import { Screen } from "../components/Screen";
import { Section } from "../components/Section";
import { ExerciseDetailScreen } from "./ExerciseDetailScreen";

export function ExercisesScreen({ setMessage }: { setMessage: (value: string) => void }) {
  const { apiFetch } = useAuth();
  const [query, setQuery] = useState("");
  const [targetMuscle, setTargetMuscle] = useState("");
  const [equipment, setEquipment] = useState("");
  const [bodyPart, setBodyPart] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [metric, setMetric] = useState<"weight" | "volume">("weight");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [progress, setProgress] = useState<ProgressPoint[]>([]);
  const [progression, setProgression] = useState<ProgressionSuggestion | null>(null);
  const [loading, setLoading] = useState(false);

  const clearFilters = () => {
    setQuery("");
    setTargetMuscle("");
    setEquipment("");
    setBodyPart("");
    setFavoritesOnly(false);
  };

  const search = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (query.trim()) params.set("q", query.trim());
      if (targetMuscle.trim()) params.set("targetMuscle", targetMuscle.trim().toLowerCase());
      if (equipment.trim()) params.set("equipment", equipment.trim().toLowerCase());
      if (bodyPart.trim()) params.set("bodyPart", bodyPart.trim().toLowerCase());

      const result = await apiFetch<{ data?: Exercise[] }>(
        `/exercises?${params.toString()}`,
      );
      setExercises(result?.data ?? []);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, bodyPart, equipment, query, targetMuscle]);

  useEffect(() => {
    search();
  }, [apiFetch, search]);

  useEffect(() => {
    Promise.all([
      apiFetch<{ data: Array<{ exercise: Exercise }> }>("/favorite-exercises"),
      apiFetch<{ data: WorkoutSession[] }>("/me/workout-sessions?limit=50"),
      apiFetch<{ data: WorkoutTemplate[] }>("/workout-templates"),
    ])
      .then(([favoriteResult, sessionResult, templateResult]) => {
        setFavorites(new Set((favoriteResult.data ?? []).map((favorite) => favorite.exercise.id)));
        setSessions(sessionResult.data ?? []);
        setTemplates(templateResult.data ?? []);
      })
      .catch(() => undefined);
  }, [apiFetch]);

  const openExercise = async (exercise: Exercise) => {
    setSelected(exercise);
    const [progressResult, progressionResult] = await Promise.all([
      apiFetch<{ data: ProgressPoint[] }>(`/exercises/${exercise.id}/progress`),
      apiFetch<{ data: ProgressionSuggestion }>(`/exercises/${exercise.id}/progression`),
    ]);
    setProgress(progressResult.data);
    setProgression(progressionResult.data);
  };

  const toggleFavorite = async (exercise = selected) => {
    if (!exercise) return;

    if (favorites.has(exercise.id)) {
      await apiFetch(`/favorite-exercises/${exercise.id}`, { method: "DELETE" });
      const next = new Set(favorites);
      next.delete(exercise.id);
      setFavorites(next);
      setMessage("Favorito eliminado");
    } else {
      await apiFetch("/favorite-exercises", {
        method: "POST",
        body: JSON.stringify({ exerciseId: exercise.id }),
      });
      setFavorites(new Set([...favorites, exercise.id]));
      setMessage("Favorito guardado");
    }
  };

  const usedExerciseIds = new Set(
    sessions.flatMap((session) => session.exercises.map((exercise) => exercise.exerciseId)),
  );
  const routineExerciseIds = new Set(
    templates.flatMap((template) => template.exercises.map((exercise) => exercise.exerciseId)),
  );
  const visibleExercises = favoritesOnly
    ? exercises.filter((exercise) => favorites.has(exercise.id))
    : exercises;
  const selectedHistory = selected
    ? sessions.filter((session) =>
        session.exercises.some((exercise) => exercise.exerciseId === selected.id),
      )
    : [];

  return (
    <Screen>
      <ExerciseFilterBar
        query={query}
        targetMuscle={targetMuscle}
        equipment={equipment}
        bodyPart={bodyPart}
        favoritesOnly={favoritesOnly}
        onQueryChange={setQuery}
        onTargetMuscleChange={setTargetMuscle}
        onEquipmentChange={setEquipment}
        onBodyPartChange={setBodyPart}
        onFavoritesOnlyChange={setFavoritesOnly}
        onResetFilters={clearFilters}
        onSearch={search}
        loading={loading}
      />

      {selected ? (
        <ExerciseDetailScreen
          apiFetch={apiFetch}
          exercise={selected}
          favorite={favorites.has(selected.id)}
          history={selectedHistory}
          metric={metric}
          progress={progress}
          progression={progression}
          onBack={() => setSelected(null)}
          onMetricChange={setMetric}
          onToggleFavorite={() => toggleFavorite(selected).catch(showError)}
          setMessage={setMessage}
        />
      ) : null}

      <Section title="Resultados">
        {loading ? (
          <LoadingState title="Buscando ejercicios" />
        ) : visibleExercises.length === 0 ? (
          <EmptyState title="Sin resultados" message="Prueba con otro nombre o musculo." />
        ) : (
          visibleExercises.map((exercise) => (
            <ExerciseRow
              key={exercise.id}
              exercise={exercise}
              badges={buildBadges(exercise.id, favorites, usedExerciseIds, routineExerciseIds)}
              selected={selected?.id === exercise.id}
              onPress={() => openExercise(exercise).catch(showError)}
            />
          ))
        )}
      </Section>
    </Screen>
  );
}

function buildBadges(
  exerciseId: string,
  favorites: Set<string>,
  usedExerciseIds: Set<string>,
  routineExerciseIds: Set<string>,
) {
  return [
    favorites.has(exerciseId) ? "Favorito" : null,
    usedExerciseIds.has(exerciseId) ? "Reciente" : null,
    routineExerciseIds.has(exerciseId) ? "En rutina" : null,
  ].filter((badge): badge is string => Boolean(badge));
}

function showError(error: unknown) {
  Alert.alert("Error", error instanceof Error ? error.message : "Algo ha fallado");
}
