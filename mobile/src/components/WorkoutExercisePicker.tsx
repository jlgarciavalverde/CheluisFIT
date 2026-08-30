import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import type { ApiFetch, Exercise, ExerciseFacets } from "../api/types";
import { colors } from "../theme/tokens";
import { BottomSheet } from "./BottomSheet";
import { EmptyState } from "./EmptyState";
import { ExerciseFilterBar } from "./ExerciseFilterBar";
import { ExerciseRow } from "./ExerciseRow";

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
    const timer = setTimeout(() => {
      search().catch(() => undefined);
    }, 280);

    return () => clearTimeout(timer);
  }, [visible, query, targetMuscle, equipment, bodyPart]);

  const search = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "24" });
      if (query.trim()) params.set("q", query.trim());
      if (targetMuscle) params.set("targetMuscle", targetMuscle);
      if (equipment) params.set("equipment", equipment);
      if (bodyPart) params.set("bodyPart", bodyPart);

      const response = await apiFetch<{ data: Exercise[] }>(
        `/exercises?${params.toString()}`,
      );
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
      {results.length === 0 ? (
        <EmptyState title="Sin resultados" message="Busca por nombre, musculo o material." />
      ) : (
        results.map((exercise) => (
          <ExerciseRow
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

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
});
