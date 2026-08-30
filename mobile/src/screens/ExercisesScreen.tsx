import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Keyboard, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Exercise, ExerciseFacets, ExerciseState } from "../api/types";
import { useAuth } from "../auth/AuthProvider";
import { showError } from "../utils/errors";
import { EmptyState } from "../components/EmptyState";
import { ExerciseFilterBar } from "../components/ExerciseFilterBar";
import { ExerciseRow } from "../components/ExerciseRow";
import { LoadingState } from "../components/LoadingState";
import type { ExercisesStackParamList } from "../navigation/types";
import { colors } from "../theme/tokens";

type Nav = NativeStackNavigationProp<ExercisesStackParamList, "ExercisesList">;

export function ExercisesScreen() {
  const { apiFetch } = useAuth();
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState("");
  const [targetMuscle, setTargetMuscle] = useState("");
  const [equipment, setEquipment] = useState("");
  const [bodyPart, setBodyPart] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [usedRecentlyOnly, setUsedRecentlyOnly] = useState(false);
  const [inRoutineOnly, setInRoutineOnly] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [facets, setFacets] = useState<ExerciseFacets | null>(null);
  const [exerciseStates, setExerciseStates] = useState<Map<string, ExerciseState>>(new Map());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

      const result = await apiFetch<{ data: Exercise[] }>(`/exercises?${params.toString()}`);
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
    apiFetch<{ data: ExerciseFacets }>("/exercises/facets")
      .then((result) => setFacets(result.data))
      .catch(() => undefined);
  }, [apiFetch]);

  const visibleExercises = useMemo(
    () =>
      exercises.filter((exercise) => {
        const state = exerciseStates.get(exercise.id);
        if (favoritesOnly && !favorites.has(exercise.id)) return false;
        if (usedRecentlyOnly && !state?.usedRecently) return false;
        if (inRoutineOnly && !state?.inRoutine) return false;
        return true;
      }),
    [exercises, exerciseStates, favorites, favoritesOnly, usedRecentlyOnly, inRoutineOnly],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await search();
    setRefreshing(false);
  }, [search]);

  const renderItem = useCallback(
    ({ item }: { item: Exercise }) => (
      <ExerciseRow
        exercise={item}
        badges={buildBadges(item.id, exerciseStates, favorites)}
        selected={false}
        onPress={() => navigation.navigate("ExerciseDetail", { exercise: item })}
      />
    ),
    [exerciseStates, favorites, navigation],
  );

  const keyExtractor = useCallback((item: Exercise) => item.id, []);

  const listHeader = useMemo(
    () => (
      <View style={styles.header}>
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
        <Text style={styles.sectionTitle}>Resultados</Text>
      </View>
    ),
    [
      facets, query, targetMuscle, equipment, bodyPart,
      favoritesOnly, usedRecentlyOnly, inRoutineOnly,
      search, loading,
    ],
  );

  const listEmpty = useMemo(
    () =>
      loading && !refreshing ? (
        <LoadingState title="Buscando ejercicios" />
      ) : (
        <EmptyState title="Sin resultados" message="Prueba con otro nombre o musculo." />
      ),
    [loading, refreshing],
  );

  return (
    <FlatList
      data={visibleExercises}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={listEmpty}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      onScrollBeginDrag={Keyboard.dismiss}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={colors.lime}
          colors={[colors.lime]}
        />
      }
      ItemSeparatorComponent={Separator}
    />
  );
}

function Separator() {
  return <View style={styles.separator} />;
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

const styles = StyleSheet.create({
  content: {
    backgroundColor: colors.background,
    gap: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 128,
  },
  header: {
    gap: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  separator: {
    height: 10,
  },
});
