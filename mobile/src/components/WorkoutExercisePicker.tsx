import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import type { ApiFetch, Exercise } from "../api/types";
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
  const [query, setQuery] = useState("bench");
  const [results, setResults] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    setLoading(true);
    try {
      const response = await apiFetch<{ data: Exercise[] }>(
        `/exercises?q=${encodeURIComponent(query)}&limit=12`,
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
        query={query}
        onQueryChange={setQuery}
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
