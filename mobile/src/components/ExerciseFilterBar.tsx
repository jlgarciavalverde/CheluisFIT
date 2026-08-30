import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  BODY_PART_FILTER_OPTIONS,
  EQUIPMENT_FILTER_OPTIONS,
  MUSCLE_FILTER_OPTIONS,
  getBodyPartLabel,
  getEquipmentLabel,
  getMuscleLabel,
} from "../constants/exerciseFilters";
import { colors, radius } from "../theme/tokens";
import { BottomSheet } from "./BottomSheet";
import { Button } from "./Button";
import { TextField } from "./TextField";

export function ExerciseFilterBar({
  query,
  loading,
  bodyPart,
  equipment,
  favoritesOnly,
  targetMuscle,
  onBodyPartChange,
  onEquipmentChange,
  onFavoritesOnlyChange,
  onQueryChange,
  onResetFilters,
  onSearch,
  onTargetMuscleChange,
}: {
  query: string;
  loading?: boolean;
  bodyPart?: string;
  equipment?: string;
  favoritesOnly?: boolean;
  targetMuscle?: string;
  onBodyPartChange?: (value: string) => void;
  onEquipmentChange?: (value: string) => void;
  onFavoritesOnlyChange?: (value: boolean) => void;
  onQueryChange: (value: string) => void;
  onResetFilters?: () => void;
  onSearch: () => void;
  onTargetMuscleChange?: (value: string) => void;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const quickFilters = useMemo(
    () => ({
      target: MUSCLE_FILTER_OPTIONS.map((option) => ({
        ...option,
        active: (targetMuscle ?? "") === option.value,
      })),
      bodyPart: BODY_PART_FILTER_OPTIONS.map((option) => ({
        ...option,
        active: (bodyPart ?? "") === option.value,
      })),
      equipment: EQUIPMENT_FILTER_OPTIONS.map((option) => ({
        ...option,
        active: (equipment ?? "") === option.value,
      })),
    }),
    [bodyPart, equipment, targetMuscle],
  );

  const hasAnyFilter = Boolean(targetMuscle || bodyPart || equipment || favoritesOnly);
  const activeFilterCount = [targetMuscle, bodyPart, equipment, favoritesOnly ? "favoritos" : null].filter(Boolean).length;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <TextField
          placeholder="Buscar ejercicio o movimiento"
          value={query}
          onChangeText={onQueryChange}
          style={styles.input}
        />
        <Button label={loading ? "..." : "Buscar"} onPress={onSearch} disabled={loading} />
      </View>

      <View style={styles.toolbar}>
        <Pressable accessibilityRole="button" onPress={() => setSheetOpen(true)} style={styles.advancedToggle}>
          <Text style={styles.advancedText}>{activeFilterCount > 0 ? `Más filtros (${activeFilterCount})` : "Más filtros"}</Text>
        </Pressable>

        {onResetFilters ? (
          <Pressable accessibilityRole="button" onPress={onResetFilters} style={styles.resetButton}>
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.filterBlock}>
        <Text style={styles.filterTitle}>Músculo principal</Text>
        <ScrollView contentContainerStyle={styles.chipRow} horizontal showsHorizontalScrollIndicator={false}>
          {quickFilters.target.map((chip) => (
            <Pressable
              accessibilityRole="button"
              key={chip.value}
              onPress={() => onTargetMuscleChange?.(chip.active ? "" : chip.value)}
              style={[styles.chip, chip.active && styles.chipActive]}
            >
              <Text style={[styles.chipText, chip.active && styles.chipTextActive]}>{chip.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {hasAnyFilter ? (
        <View style={styles.summaryRow}>
          {targetMuscle ? <Text style={styles.summaryPill}>Músculo: {getMuscleLabel(targetMuscle)}</Text> : null}
          {bodyPart ? <Text style={styles.summaryPill}>Zona: {getBodyPartLabel(bodyPart)}</Text> : null}
          {equipment ? <Text style={styles.summaryPill}>Equipo: {getEquipmentLabel(equipment)}</Text> : null}
          {favoritesOnly ? <Text style={styles.summaryPill}>Favoritos</Text> : null}
        </View>
      ) : null}

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Filtros avanzados</Text>

          <View style={styles.sheetGroup}>
            <Text style={styles.filterTitle}>Zona corporal</Text>
            <View style={styles.horizontalWrap}>
              {quickFilters.bodyPart.map((chip) => (
                <Pressable
                  accessibilityRole="button"
                  key={chip.value}
                  onPress={() => onBodyPartChange?.(chip.active ? "" : chip.value)}
                  style={[styles.sheetChip, chip.active && styles.sheetChipActive]}
                >
                  <Text style={[styles.sheetChipText, chip.active && styles.sheetChipTextActive]}>{chip.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.sheetGroup}>
            <Text style={styles.filterTitle}>Equipo</Text>
            <View style={styles.horizontalWrap}>
              {quickFilters.equipment.map((chip) => (
                <Pressable
                  accessibilityRole="button"
                  key={chip.value}
                  onPress={() => onEquipmentChange?.(chip.active ? "" : chip.value)}
                  style={[styles.sheetChip, chip.active && styles.sheetChipActive]}
                >
                  <Text style={[styles.sheetChipText, chip.active && styles.sheetChipTextActive]}>{chip.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {onFavoritesOnlyChange ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => onFavoritesOnlyChange(!favoritesOnly)}
              style={[styles.favoriteChip, favoritesOnly && styles.favoriteChipActive]}
            >
              <Text style={[styles.favoriteText, favoritesOnly && styles.favoriteTextActive]}>
                Solo favoritos
              </Text>
            </Pressable>
          ) : null}

          <View style={styles.sheetActions}>
            <Button label="Aplicar" onPress={() => setSheetOpen(false)} />
            {onResetFilters ? (
              <Button
                label="Limpiar"
                onPress={() => {
                  onResetFilters();
                  setSheetOpen(false);
                }}
                variant="secondary"
              />
            ) : null}
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  input: {
    flex: 1,
  },
  toolbar: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  advancedToggle: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 12,
  },
  advancedText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  resetButton: {
    alignItems: "center",
    backgroundColor: `${colors.lime}1A`,
    borderColor: colors.lime,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 12,
  },
  resetText: {
    color: colors.lime,
    fontSize: 12,
    fontWeight: "800",
  },
  filterBlock: {
    gap: 8,
  },
  filterTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  chipRow: {
    gap: 8,
    paddingBottom: 2,
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: `${colors.cyan}1A`,
    borderColor: colors.cyan,
  },
  chipText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  chipTextActive: {
    color: colors.cyan,
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  summaryPill: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.text,
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  sheetContent: {
    gap: 12,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  sheetGroup: {
    gap: 8,
  },
  horizontalWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sheetChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sheetChipActive: {
    backgroundColor: `${colors.lime}1A`,
    borderColor: colors.lime,
  },
  sheetChipText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  sheetChipTextActive: {
    color: colors.lime,
  },
  favoriteChip: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 46,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  favoriteChipActive: {
    borderColor: colors.lime,
  },
  favoriteText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900",
  },
  favoriteTextActive: {
    color: colors.lime,
  },
  sheetActions: {
    flexDirection: "row",
    gap: 8,
  },
});
