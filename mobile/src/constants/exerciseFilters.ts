export const MUSCLE_FILTER_OPTIONS = [
  { label: "Pecho", value: "pectorals" },
  { label: "Espalda", value: "lats" },
  { label: "Piernas", value: "quadriceps" },
  { label: "Hombros", value: "deltoids" },
  { label: "Bíceps", value: "biceps" },
  { label: "Tríceps", value: "triceps" },
  { label: "Core", value: "abdominals" },
  { label: "Glúteos", value: "glutes" },
] as const;

export const BODY_PART_FILTER_OPTIONS = [
  { label: "Pecho", value: "chest" },
  { label: "Espalda", value: "back" },
  { label: "Piernas", value: "legs" },
  { label: "Hombros", value: "shoulders" },
  { label: "Abdomen", value: "abs" },
  { label: "Brazos", value: "arms" },
] as const;

export const EQUIPMENT_FILTER_OPTIONS = [
  { label: "Peso libre", value: "barbell" },
  { label: "Mancuernas", value: "dumbbell" },
  { label: "Máquina", value: "machine" },
  { label: "Cable", value: "cable" },
  { label: "Bandas", value: "bands" },
  { label: "Peso corporal", value: "body weight" },
  { label: "Kettlebell", value: "kettlebell" },
] as const;

export const getMuscleLabel = (value?: string) =>
  MUSCLE_FILTER_OPTIONS.find((option) => option.value === value)?.label ?? value ?? "";

export const getBodyPartLabel = (value?: string) =>
  BODY_PART_FILTER_OPTIONS.find((option) => option.value === value)?.label ?? value ?? "";

export const getEquipmentLabel = (value?: string) =>
  EQUIPMENT_FILTER_OPTIONS.find((option) => option.value === value)?.label ?? value ?? "";
