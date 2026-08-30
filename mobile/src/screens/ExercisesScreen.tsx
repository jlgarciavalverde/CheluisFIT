import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import type {
  Exercise,
  ExerciseFacets,
  ExerciseState,
  ProgressionSuggestion,
  ProgressPoint,
  WorkoutSession,
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
  const [usedRecentlyOnly, setUsedRecentlyOnly] = useState(false);
  const [inRoutineOnly, setInRoutineOnly] = useState(false);
  const [metric, setMetric] = useState<"weight" | "volume">("weight");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [facets, setFacets] = useState<ExerciseFacets | null>(null);
  const [exerciseStates, setExerciseStates] = useState<Map<string, ExerciseState>>(new Map());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [progress, setProgress] = useState<ProgressPoint[]>([]);
  const [progression, setProgression] = useState<ProgressionSuggestion | null>(null);
  const [loading, setLoading] = useState(false);

  const loadExerciseStates = useCallback(
    async (ids?: string[]) => {
      const suffix = ids?.length ? `?exerciseIds=${ids.join(",")}` : "";
      const result = await apiFetch<{ data: ExerciseState[] }>(`/me/exercise-states${suffix}`);
      const nextStates = new Map(result.data.map((state) => [state.exerciseId, state]));
      setExerciseStates(nextStates);
      setFavorites(
        new Set(result.data.filter((state) => state.isFavorite).map((state) => state.exerciseId)),
      );
    },
    [apiFetch],
  );

  const search = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (query.trim()) params.set("q", query.trim());
      if (targetMuscle.trim()) params.set("targetMuscle", targetMuscle.trim().toLowerCase());
      if (equipment.trim()) params.set("equipment", equipment.trim().toLowerCase());
      if (bodyPart.trim()) params.set("bodyPart", bodyPart.trim().toLowerCase());

      const result = await apiFetch<{ data: Exercise[] }>(
        `/exercises?${params.toString()}`,
      );
      setExercises(result.data);
      await loadExerciseStates(result.data.map((exercise) => exercise.id));
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, bodyPart, equipment, loadExerciseStates, query, targetMuscle]);

  useEffect(() => {
    const timer = setTimeout(() => {
      search();
    }, 280);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    Promise.all([
      apiFetch<{ data: ExerciseFacets }>("/exercises/facets"),
      apiFetch<{ data: WorkoutSession[] }>("/me/workout-sessions?limit=50"),
    ])
      .then(([facetResult, sessionResult]) => {
        setFacets(facetResult.data);
        setSessions(sessionResult.data);
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
      setExerciseStates((current) => {
        const nextStates = new Map(current);
        const currentState = nextStates.get(exercise.id);
        if (currentState) nextStates.set(exercise.id, { ...currentState, isFavorite: false });
        return nextStates;
      });
      setMessage("Favorito eliminado");
    } else {
      await apiFetch("/favorite-exercises", {
        method: "POST",
        body: JSON.stringify({ exerciseId: exercise.id }),
      });
      setFavorites(new Set([...favorites, exercise.id]));
      setExerciseStates((current) => {
        const nextStates = new Map(current);
        const currentState = nextStates.get(exercise.id);
        nextStates.set(exercise.id, {
          exerciseId: exercise.id,
          isFavorite: true,
          usedRecently: currentState?.usedRecently ?? false,
          inRoutine: currentState?.inRoutine ?? false,
          lastUsedAt: currentState?.lastUsedAt ?? null,
          sessionCount: currentState?.sessionCount ?? 0,
          routineCount: currentState?.routineCount ?? 0,
        });
        return nextStates;
      });
      setMessage("Favorito guardado");
    }
  };

  const visibleExercises = exercises.filter((exercise) => {
    const state = exerciseStates.get(exercise.id);

    if (favoritesOnly && !favorites.has(exercise.id)) return false;
    if (usedRecentlyOnly && !state?.usedRecently) return false;
    if (inRoutineOnly && !state?.inRoutine) return false;

    return true;
  });
  const selectedHistory = selected
    ? sessions.filter((session) =>
        session.exercises.some((exercise) => exercise.exerciseId === selected.id),
      )
    : [];

  return (
    <Screen>
      <ExerciseFilterBar
        facets={facets}
        query={query}
        targetMuscle={targetMuscle}
        equipment={equipment}
        bodyPart={bodyPart}
        favoritesOnly={favoritesOnly}
        usedRecentlyOnly={usedRecentlyOnly}
        inRoutineOnly={inRoutineOnly}
        onQueryChange={setQuery}
        onTargetMuscleChange={setTargetMuscle}
        onEquipmentChange={setEquipment}
        onBodyPartChange={setBodyPart}
        onFavoritesOnlyChange={setFavoritesOnly}
        onUsedRecentlyOnlyChange={setUsedRecentlyOnly}
        onInRoutineOnlyChange={setInRoutineOnly}
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
          onAddToActiveWorkout={() => addToActiveWorkout(selected).catch(showError)}
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
              badges={buildBadges(exercise.id, exerciseStates, favorites)}
              selected={selected?.id === exercise.id}
              onPress={() => openExercise(exercise).catch(showError)}
            />
          ))
        )}
      </Section>
    </Screen>
  );

  async function addToActiveWorkout(exercise: Exercise) {
    const active = await apiFetch<{ data: WorkoutSession | null }>("/workout-sessions/active");

    if (!active.data) {
      setMessage("Empieza una rutina antes de anadir ejercicios");
      return;
    }

    await apiFetch(`/workout-sessions/${active.data.id}/exercises`, {
      method: "POST",
      body: JSON.stringify({
        exerciseId: exercise.id,
        sets: [{ weightKg: 0, reps: 10, type: "NORMAL", restSeconds: 90 }],
      }),
    });

    setMessage("Ejercicio anadido al entreno");
    await loadExerciseStates(exercises.map((item) => item.id));
  }
}

function buildBadges(
  exerciseId: string,
  exerciseStates: Map<string, ExerciseState>,
  favorites: Set<string>,
) {
  const state = exerciseStates.get(exerciseId);

  return [
    favorites.has(exerciseId) ? "Favorito" : null,
    state?.usedRecently ? "Reciente" : null,
    state?.inRoutine ? "En rutina" : null,
  ].filter((badge): badge is string => Boolean(badge));
}

function showError(error: unknown) {
  Alert.alert("Error", error instanceof Error ? error.message : "Algo ha fallado");
}
