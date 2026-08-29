import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import type { ExerciseSetType, WorkoutSet } from "../api/types";
import { colors } from "../theme/tokens";
import { BottomSheet } from "./BottomSheet";
import { Button } from "./Button";
import { SegmentedTabs } from "./SegmentedTabs";
import { TextField } from "./TextField";

const setTypeTabs: Array<{ key: ExerciseSetType; label: string }> = [
  { key: "NORMAL", label: "Normal" },
  { key: "WARMUP", label: "Warm" },
  { key: "SUPERSET", label: "Super" },
  { key: "DROPSET", label: "Drop" },
];

export function SetEditorSheet({
  set,
  visible,
  onClose,
  onSave,
}: {
  set: WorkoutSet | null;
  visible: boolean;
  onClose: () => void;
  onSave: (input: {
    weightKg: number;
    reps: number;
    type: ExerciseSetType;
    restSeconds: number;
  }) => void;
}) {
  const [weightKg, setWeightKg] = useState("0");
  const [reps, setReps] = useState("1");
  const [type, setType] = useState<ExerciseSetType>("NORMAL");
  const [restSeconds, setRestSeconds] = useState("90");

  useEffect(() => {
    if (!set) return;
    setWeightKg(String(set.weightKg));
    setReps(String(set.reps));
    setType(set.type);
    setRestSeconds(String(set.restSeconds));
  }, [set]);

  const save = () => {
    const nextWeight = Number(weightKg);
    const nextReps = Number(reps);
    const nextRest = Number(restSeconds);

    if (
      !Number.isFinite(nextWeight) ||
      nextWeight < 0 ||
      !Number.isInteger(nextReps) ||
      nextReps < 1 ||
      !Number.isInteger(nextRest) ||
      nextRest < 0
    ) {
      Alert.alert("Serie invalida", "Revisa peso, repeticiones y descanso.");
      return;
    }

    onSave({
      weightKg: nextWeight,
      reps: nextReps,
      type,
      restSeconds: nextRest,
    });
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Editar serie</Text>
      <View style={styles.row}>
        <TextField
          keyboardType="numeric"
          placeholder="Peso"
          value={weightKg}
          onChangeText={setWeightKg}
          style={styles.input}
        />
        <TextField
          keyboardType="numeric"
          placeholder="Reps"
          value={reps}
          onChangeText={setReps}
          style={styles.input}
        />
        <TextField
          keyboardType="numeric"
          placeholder="Descanso"
          value={restSeconds}
          onChangeText={setRestSeconds}
          style={styles.input}
        />
      </View>
      <Text style={styles.caption}>Peso · Reps · Descanso</Text>
      <SegmentedTabs
        tabs={setTypeTabs}
        value={type}
        onChange={(key) => setType(key as ExerciseSetType)}
      />
      <View style={styles.actions}>
        <Button label="Cancelar" variant="ghost" onPress={onClose} />
        <Button label="Guardar" onPress={save} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  input: {
    flex: 1,
  },
  caption: {
    color: colors.muted,
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
});
