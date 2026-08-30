import { Search, X } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { ExerciseFacets } from "../api/types";
import { colors, radius, shadow, spacing } from "../theme/tokens";
import { Button } from "./Button";
import { FilterChip } from "./FilterChip";
import { TextField } from "./TextField";

export function ExerciseFilterBar({
  facets,
  query,
  loading,
  bodyPart,
  equipment,
  favoritesOnly,
  inRoutineOnly,
  targetMuscle,
  usedRecentlyOnly,
  onBodyPartChange,
  onEquipmentChange,
  onFavoritesOnlyChange,
  onInRoutineOnlyChange,
  onQueryChange,
  onSearch,
  onTargetMuscleChange,
  onUsedRecentlyOnlyChange,
}: {
  facets?: ExerciseFacets | null;
  query: string;
  loading?: boolean;
  bodyPart?: string;
  equipment?: string;
  favoritesOnly?: boolean;
  inRoutineOnly?: boolean;
  targetMuscle?: string;
  usedRecentlyOnly?: boolean;
  onBodyPartChange?: (value: string) => void;
  onEquipmentChange?: (value: string) => void;
  onFavoritesOnlyChange?: (value: boolean) => void;
  onInRoutineOnlyChange?: (value: boolean) => void;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  onTargetMuscleChange?: (value: string) => void;
  onUsedRecentlyOnlyChange?: (value: boolean) => void;
}) {
  const activeCount = [
    query.trim(),
    targetMuscle,
    equipment,
    bodyPart,
    favoritesOnly,
    usedRecentlyOnly,
    inRoutineOnly,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onQueryChange("");
    onTargetMuscleChange?.("");
    onEquipmentChange?.("");
    onBodyPartChange?.("");
    onFavoritesOnlyChange?.(false);
    onUsedRecentlyOnlyChange?.(false);
    onInRoutineOnlyChange?.(false);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.primaryRow}>
        <TextField
          placeholder="Buscar ejercicio"
          value={query}
          onChangeText={onQueryChange}
          style={styles.input}
          returnKeyType="search"
          onSubmitEditing={onSearch}
        />
        <Button
          icon={Search}
          label={loading ? "..." : "Buscar"}
          onPress={onSearch}
          disabled={loading}
        />
      </View>

      {onTargetMuscleChange || onEquipmentChange || onBodyPartChange || onFavoritesOnlyChange ? (
        <View style={styles.filters}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>
              Filtros rápidos{activeCount ? ` · ${activeCount}` : ""}
            </Text>
            {activeCount ? (
              <Button icon={X} label="Limpiar" size="sm" variant="ghost" onPress={clearFilters} />
            ) : null}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {onFavoritesOnlyChange ? (
              <FilterChip
                label="Favoritos"
                active={favoritesOnly}
                onPress={() => onFavoritesOnlyChange(!favoritesOnly)}
              />
            ) : null}
            {onUsedRecentlyOnlyChange ? (
              <FilterChip
                label="Recientes"
                active={usedRecentlyOnly}
                onPress={() => onUsedRecentlyOnlyChange(!usedRecentlyOnly)}
              />
            ) : null}
            {onInRoutineOnlyChange ? (
              <FilterChip
                label="En rutina"
                active={inRoutineOnly}
                onPress={() => onInRoutineOnlyChange(!inRoutineOnly)}
              />
            ) : null}
          </ScrollView>

          {onTargetMuscleChange ? (
            <FacetRow
              title="Músculo"
              options={facets?.targetMuscles}
              value={targetMuscle}
              onChange={onTargetMuscleChange}
            />
          ) : null}
          {onEquipmentChange ? (
            <FacetRow
              title="Material"
              options={facets?.equipment}
              value={equipment}
              onChange={onEquipmentChange}
            />
          ) : null}
          {onBodyPartChange ? (
            <FacetRow
              title="Zona"
              options={facets?.bodyParts}
              value={bodyPart}
              onChange={onBodyPartChange}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function FacetRow({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options?: Array<{ value: string; count: number }>;
  value?: string;
  onChange: (value: string) => void;
}) {
  const visibleOptions = (options ?? []).slice(0, 12);

  if (visibleOptions.length === 0) {
    return null;
  }

  return (
    <View style={styles.facetBlock}>
      <Text style={styles.facetTitle}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {visibleOptions.map((option) => (
          <FilterChip
            key={option.value}
            label={option.value}
            count={option.count}
            active={value === option.value}
            onPress={() => onChange(value === option.value ? "" : option.value)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    ...shadow.card,
  },
  primaryRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  input: {
    flex: 1,
  },
  filters: {
    gap: spacing.sm,
  },
  filterHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  filterTitle: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  facetBlock: {
    gap: spacing.xs,
  },
  facetTitle: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  chipRow: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
});
