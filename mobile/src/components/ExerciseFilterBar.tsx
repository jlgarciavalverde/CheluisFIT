import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../theme/tokens";
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
  onSearch: () => void;
  onTargetMuscleChange?: (value: string) => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <TextField
          placeholder="Nombre"
          value={query}
          onChangeText={onQueryChange}
          style={styles.input}
        />
        <Button label={loading ? "..." : "Buscar"} onPress={onSearch} disabled={loading} />
      </View>

      {onTargetMuscleChange || onEquipmentChange || onBodyPartChange || onFavoritesOnlyChange ? (
        <View style={styles.filters}>
          {onTargetMuscleChange ? (
            <TextField
              placeholder="Musculo"
              value={targetMuscle}
              onChangeText={onTargetMuscleChange}
              style={styles.filterInput}
            />
          ) : null}
          {onEquipmentChange ? (
            <TextField
              placeholder="Equipo"
              value={equipment}
              onChangeText={onEquipmentChange}
              style={styles.filterInput}
            />
          ) : null}
          {onBodyPartChange ? (
            <TextField
              placeholder="Zona"
              value={bodyPart}
              onChangeText={onBodyPartChange}
              style={styles.filterInput}
            />
          ) : null}
          {onFavoritesOnlyChange ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => onFavoritesOnlyChange(!favoritesOnly)}
              style={[styles.favoriteChip, favoritesOnly && styles.favoriteChipActive]}
            >
              <Text style={[styles.favoriteText, favoritesOnly && styles.favoriteTextActive]}>
                Favoritos
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  input: {
    flex: 1,
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterInput: {
    flexBasis: "30%",
    flexGrow: 1,
    minWidth: 92,
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
});
