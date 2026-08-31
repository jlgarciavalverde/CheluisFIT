import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ApiFetch, Exercise, ExerciseFacets, ExercisePicks } from "../api/types";
import { colors, radius } from "../theme/tokens";
import { BottomSheet } from "./BottomSheet";
import { EmptyState } from "./EmptyState";
import { ExerciseFilterBar } from "./ExerciseFilterBar";
import { ExerciseCard } from "./ExerciseCard";

export function WorkoutExercisePicker({
  apiFetch,
  visible,
  onClose,
  onPick,
}: {
  apiFetch: ApiFetch;
  visible: boolean;
  onClose: () => void;
  onPick: (exercise: Exercise) => void;
}) {
  const [query, setQuery] = useState("");
  const [targetMuscle, setTargetMuscle] = useState("");
  const [equipment, setEquipment] = useState("");
  const [bodyPart, setBodyPart] = useState("");
  const [facets, setFacets] = useState<ExerciseFacets | null>(null);
  const [picks, setPicks] = useState<ExercisePicks>({ favorites: [], recent: [] });
  const [results, setResults] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || facets) return;

    apiFetch<{ data: ExerciseFacets }>("/exercises/facets")
      .then((response) => setFacets(response.data))
      .catch(() => undefined);
  }, [apiFetch, facets, visible]);

  useEffect(() => {
    if (!visible) return;

    apiFetch<{ data: ExercisePicks }>("/me/exercise-picks")
      .then((response) => setPicks(response.data))
      .catch(() => undefined);
  }, [apiFetch, visible]);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      search().catch(() => undefined);
    }, 280);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, query, targetMuscle, equipment, bodyPart]);

  const search = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "24" });
      if (query.trim()) params.set("q", query.trim());
      if (targetMuscle) params.set("targetMuscle", targetMuscle);
      if (equipment) params.set("equipment", equipment);
      if (bodyPart) params.set("bodyPart", bodyPart);

      const response = await apiFetch<{ data: Exercise[] }>(`/exercises?${params.toString()}`);
      setResults(response.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Elegir ejercicio</Text>
      <ExerciseFilterBar
        facets={facets}
        query={query}
        targetMuscle={targetMuscle}
        equipment={equipment}
        bodyPart={bodyPart}
        onQueryChange={setQuery}
        onTargetMuscleChange={setTargetMuscle}
        onEquipmentChange={setEquipment}
        onBodyPartChange={setBodyPart}
        onSearch={() => search().catch(() => undefined)}
        loading={loading}
      />
      <ExercisePickRow
        title="Favoritos"
        exercises={picks.favorites}
        onPick={(exercise) => {
          onPick(exercise);
          onClose();
        }}
      />
      <ExercisePickRow
        title="Recientes"
        exercises={picks.recent}
        onPick={(exercise) => {
          onPick(exercise);
          onClose();
        }}
      />
      {results.length === 0 ? (
        <EmptyState title="Sin resultados" message="Busca por nombre, musculo o material." />
      ) : (
        results.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            onPress={() => {
              onPick(exercise);
              onClose();
            }}
          />
        ))
      )}
    </BottomSheet>
  );
}

function ExercisePickRow({
  exercises,
  onPick,
  title,
}: {
  exercises: Exercise[];
  onPick: (exercise: Exercise) => void;
  title: string;
}) {
  if (exercises.length === 0) return null;

  return (
    <View style={styles.pickSection}>
      <Text style={styles.pickTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.pickRow}>
          {exercises.map((exercise) => (
            <Pressable key={exercise.id} style={styles.pickCard} onPress={() => onPick(exercise)}>
              <Text numberOfLines={2} style={styles.pickName}>
                {exercise.name}
              </Text>
              <Text numberOfLines={1} style={styles.pickMeta}>
                {exercise.targetMuscles.slice(0, 2).join(", ") || "Sin musculo"}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  pickSection: {
    gap: 8,
  },
  pickTitle: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  pickRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 8,
  },
  pickCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 6,
    minHeight: 72,
    padding: 10,
    width: 150,
  },
  pickName: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  pickMeta: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
});
