import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { AuthUser, BodyMeasurement } from "../api/types";
import { useAuth } from "../auth/AuthProvider";
import { Button } from "../components/Button";
import { MetricTile } from "../components/MetricTile";
import { ProgressChart } from "../components/ProgressChart";
import { Screen } from "../components/Screen";
import { TextField } from "../components/TextField";
import { colors, radius, shadow, typography } from "../theme/tokens";

type SheetMode = "profile" | "measurement" | null;
type WeightUnit = "kg" | "lb";
type HeightUnit = "cm" | "in";

function parseDateInput(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return new Date(1990, 0, 1);
  return new Date(year, month - 1, day);
}

function formatInputDate(value?: string) {
  if (!value) return "";
  return value.slice(0, 10);
}

function formatDisplayDate(value: string) {
  if (!value) return "Selecciona fecha";

  const date = parseDateInput(value);
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatIsoDate(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function toWeightKg(value: string, unit: WeightUnit) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return unit === "kg" ? parsed : parsed / 2.20462;
}

function toHeightCm(value: string, unit: HeightUnit) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return unit === "cm" ? parsed : parsed * 2.54;
}

function formatWeightLabel(value: number, unit: WeightUnit) {
  const normalized = unit === "kg" ? value : value * 2.20462;
  return `${normalized.toFixed(1)} ${unit}`;
}

function formatHeightLabel(value: number, unit: HeightUnit) {
  const normalized = unit === "cm" ? value : value / 2.54;
  return `${normalized.toFixed(1)} ${unit}`;
}

function getInitials(firstName?: string, lastName1?: string) {
  const a = firstName?.trim().charAt(0) ?? "";
  const b = lastName1?.trim().charAt(0) ?? "";
  return `${a}${b}`.toUpperCase() || "CF";
}

function showError(error: unknown) {
  Alert.alert("Error", error instanceof Error ? error.message : "Algo ha fallado");
}

function ProfileHeader({ user, onPressEdit }: { user: AuthUser; onPressEdit: () => void }) {
  return (
    <View style={[styles.heroCard, shadow.floating]}>
      <View style={styles.heroInner}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>{getInitials(user.firstName, user.lastName1)}</Text>
        </View>

        <View style={styles.heroTextWrap}>
          <Text style={styles.heroName}>
            {user.firstName} {user.lastName1}
          </Text>
          <Text style={styles.heroEmail}>{user.email}</Text>
        </View>

        <Pressable onPress={onPressEdit} style={styles.smallAction}>
          <Text style={styles.smallActionText}>Editar</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.settingsRow}>
      <View style={styles.settingInfoWrap}>
        <View style={styles.settingIcon}>
          <Text style={styles.settingIconText}>•</Text>
        </View>
        <View>
          <Text style={styles.settingLabel}>{label}</Text>
          <Text style={styles.settingValue}>{value}</Text>
        </View>
      </View>
      <Text style={styles.chevron}>›</Text>
    </View>
  );
}

function SegmentedControl({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (option: string) => void;
}) {
  return (
    <View style={styles.segmentedWrap}>
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[styles.segmentButton, active && styles.segmentButtonActive]}
          >
            <Text style={[styles.segmentButtonText, active && styles.segmentButtonTextActive]}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ProfileScreen({ setMessage }: { setMessage: (value: string) => void }) {
  const { apiFetch, setUser, user } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName1, setLastName1] = useState(user?.lastName1 ?? "");
  const [lastName2, setLastName2] = useState(user?.lastName2 ?? "");
  const [birthDate, setBirthDate] = useState(formatInputDate(user?.birthDate));
  const [weightKg, setWeightKg] = useState(String(user?.currentWeightKg ?? 80));
  const [heightCm, setHeightCm] = useState(String(user?.currentHeightCm ?? 180));
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [defaultRest, setDefaultRest] = useState("90");
  const [weeklyFrequency, setWeeklyFrequency] = useState("4");
  const [goal, setGoal] = useState("Hipertrofia");
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("cm");

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName1(user.lastName1);
    setLastName2(user.lastName2 ?? "");
    setBirthDate(formatInputDate(user.birthDate));
    setWeightKg(String(user.currentWeightKg));
    setHeightCm(String(user.currentHeightCm));
  }, [user]);

  useEffect(() => {
    apiFetch<{ data: BodyMeasurement[] }>("/me/body-measurements")
      .then((result) => setMeasurements(result.data || []))
      .catch(() => undefined);
  }, [apiFetch]);

  const latestWeight = useMemo(() => {
    if (measurements.length === 0) return Number(weightKg || 0);
    return measurements[measurements.length - 1].weightKg;
  }, [measurements, weightKg]);

  const weightDisplay = useMemo(() => {
    const value = Number(weightKg || 0);
    return weightUnit === "kg" ? `${value.toFixed(0)} kg` : formatWeightLabel(value, "lb");
  }, [weightKg, weightUnit]);

  const heightDisplay = useMemo(() => {
    const value = Number(heightCm || 0);
    return heightUnit === "cm" ? `${value.toFixed(0)} cm` : formatHeightLabel(value, "in");
  }, [heightCm, heightUnit]);

  const weightInputValue = useMemo(() => {
    const value = Number(weightKg || 0);
    if (weightUnit === "kg") return String(value);
    return String((value * 2.20462).toFixed(1));
  }, [weightKg, weightUnit]);

  const heightInputValue = useMemo(() => {
    const value = Number(heightCm || 0);
    if (heightUnit === "cm") return String(value);
    return String((value / 2.54).toFixed(1));
  }, [heightCm, heightUnit]);

  if (!user) return null;

  const saveProfile = async () => {
    const nextWeight = Number(weightKg);
    const nextHeight = Number(heightCm);

    if (!Number.isFinite(nextWeight) || !Number.isFinite(nextHeight)) {
      throw new Error("Peso y altura deben ser números válidos");
    }

    const result = await apiFetch<{ data: AuthUser }>("/me", {
      method: "PATCH",
      body: JSON.stringify({
        firstName,
        lastName1,
        lastName2: lastName2.trim() ? lastName2 : null,
        birthDate,
        currentWeightKg: nextWeight,
        currentHeightCm: nextHeight,
      }),
    });

    setUser(result.data);
    setMessage("Perfil actualizado");
    setSheetMode(null);
  };

  const saveMeasurement = async () => {
    const nextWeight = Number(weightKg);
    const nextHeight = Number(heightCm);

    if (!Number.isFinite(nextWeight) || !Number.isFinite(nextHeight)) {
      throw new Error("La medición debe contener peso y altura válidos");
    }

    const result = await apiFetch<{ data: BodyMeasurement }>("/me/body-measurements", {
      method: "POST",
      body: JSON.stringify({
        weightKg: nextWeight,
        heightCm: nextHeight,
      }),
    });

    setUser({ ...user, currentWeightKg: result.data.weightKg, currentHeightCm: result.data.heightCm });
    setMeasurements((current) => [...current, result.data]);
    setMessage("Medición guardada");
    setSheetMode(null);
  };

  const handleWeightInput = (input: string) => {
    const raw = input.trim();
    if (!raw) {
      setWeightKg("");
      return;
    }

    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;

    if (weightUnit === "kg") {
      setWeightKg(String(parsed));
      return;
    }

    setWeightKg(String((parsed / 2.20462).toFixed(2)));
  };

  const handleHeightInput = (input: string) => {
    const raw = input.trim();
    if (!raw) {
      setHeightCm("");
      return;
    }

    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;

    if (heightUnit === "cm") {
      setHeightCm(String(parsed));
      return;
    }

    setHeightCm(String((parsed * 2.54).toFixed(2)));
  };

  return (
    <Screen>
      <View style={styles.screenStack}>
        <ProfileHeader user={user} onPressEdit={() => setSheetMode("profile")} />

        <View style={styles.metricGrid}>
          <MetricTile label="Peso" value={weightDisplay} />
          <MetricTile label="Altura" value={heightDisplay} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardEyebrow}>Evolución corporal</Text>
              <Text style={styles.cardTitle}>Progreso</Text>
            </View>
            <Pressable onPress={() => setSheetMode("measurement")} style={styles.primaryAction}>
              <Text style={styles.primaryActionText}>+ Medición</Text>
            </Pressable>
          </View>

          <ProgressChart values={measurements.map((measurement) => measurement.weightKg)} />

          <View style={styles.valueRow}>
            <Text style={styles.metaSmall}>{measurements.length} mediciones</Text>
            <Text style={styles.summaryValue}>{latestWeight.toFixed(0)} kg</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Ajustes</Text>
            <Text style={styles.cardEyebrow}>Preferencias</Text>
          </View>

          <View style={styles.settingsList}>
            <SettingsRow label="Objetivo" value={goal} />
            <SettingsRow label="Descanso base" value={`${defaultRest} s`} />
            <SettingsRow label="Frecuencia semanal" value={`${weeklyFrequency} días`} />
            <SettingsRow label="Unidades" value={`${weightUnit.toUpperCase()} / ${heightUnit.toUpperCase()}`} />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Datos personales</Text>
            <Pressable onPress={() => setSheetMode("profile")} style={styles.secondaryAction}>
              <Text style={styles.secondaryActionText}>Editar</Text>
            </Pressable>
          </View>

          <View style={styles.dataList}>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Fecha nacimiento</Text>
              <Text style={styles.dataValue}>{formatDisplayDate(birthDate)}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Peso actual</Text>
              <Text style={styles.dataValue}>{weightDisplay}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Altura actual</Text>
              <Text style={styles.dataValue}>{heightDisplay}</Text>
            </View>
          </View>
        </View>
      </View>

      <Modal transparent visible={sheetMode !== null} animationType="slide" onRequestClose={() => setSheetMode(null)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setSheetMode(null)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              {sheetMode === "profile" ? "Editar perfil" : "Nueva medición"}
            </Text>

            {sheetMode === "profile" ? (
              <View style={styles.sheetContent}>
                <TextField
                  placeholder="Nombre"
                  value={firstName}
                  onChangeText={setFirstName}
                  style={styles.input}
                />

                <View style={styles.rowTwo}>
                  <TextField
                    placeholder="Apellido 1"
                    value={lastName1}
                    onChangeText={setLastName1}
                    style={[styles.input, styles.flexInput]}
                  />
                  <TextField
                    placeholder="Apellido 2"
                    value={lastName2}
                    onChangeText={setLastName2}
                    style={[styles.input, styles.flexInput]}
                  />
                </View>

                <Pressable onPress={() => setShowDatePicker(true)} style={styles.dateField}>
                  <Text style={styles.dateFieldText}>{formatDisplayDate(birthDate)}</Text>
                </Pressable>

                {showDatePicker && (
                  <DateTimePicker
                    value={parseDateInput(birthDate || "1990-01-01")}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    maximumDate={new Date()}
                    onChange={(_, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) setBirthDate(formatIsoDate(selectedDate));
                    }}
                  />
                )}

                <View style={styles.rowTwo}>
                  <View style={styles.unitFieldWrap}>
                    <Text style={styles.fieldLabel}>Peso</Text>
                    <SegmentedControl
                      value={weightUnit}
                      options={["kg", "lb"]}
                      onChange={(option) => setWeightUnit(option as WeightUnit)}
                    />
                    <TextField
                      placeholder={weightUnit === "kg" ? "Peso kg" : "Peso lb"}
                      keyboardType="numeric"
                      value={weightInputValue}
                      onChangeText={handleWeightInput}
                      style={[styles.input, styles.inputWithTopSpacing]}
                    />
                  </View>

                  <View style={styles.unitFieldWrap}>
                    <Text style={styles.fieldLabel}>Altura</Text>
                    <SegmentedControl
                      value={heightUnit}
                      options={["cm", "in"]}
                      onChange={(option) => setHeightUnit(option as HeightUnit)}
                    />
                    <TextField
                      placeholder={heightUnit === "cm" ? "Altura cm" : "Altura in"}
                      keyboardType="numeric"
                      value={heightInputValue}
                      onChangeText={handleHeightInput}
                      style={[styles.input, styles.inputWithTopSpacing]}
                    />
                  </View>
                </View>

                <Button label="Guardar perfil" onPress={() => saveProfile().catch(showError)} />
              </View>
            ) : (
              <View style={styles.sheetContent}>
                <Text style={styles.fieldLabel}>Unidades</Text>
                <SegmentedControl
                  value={weightUnit}
                  options={["kg", "lb"]}
                  onChange={(option) => setWeightUnit(option as WeightUnit)}
                />

                <View style={styles.miniFieldGroup}>
                  <TextField
                    placeholder={weightUnit === "kg" ? "Peso kg" : "Peso lb"}
                    keyboardType="numeric"
                    value={weightInputValue}
                    onChangeText={handleWeightInput}
                    style={styles.input}
                  />
                  <TextField
                    placeholder={heightUnit === "cm" ? "Altura cm" : "Altura in"}
                    keyboardType="numeric"
                    value={heightInputValue}
                    onChangeText={handleHeightInput}
                    style={styles.input}
                  />
                </View>

                <View style={styles.previewCard}>
                  <Text style={styles.previewLabel}>Vista previa</Text>
                  <Text style={styles.previewValue}>
                    {weightDisplay} · {heightDisplay}
                  </Text>
                </View>

                <Button label="Guardar medición" onPress={() => saveMeasurement().catch(showError)} />
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenStack: {
    gap: 16,
    paddingBottom: 24,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
  },
  heroInner: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  avatarWrap: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 18,
    height: 66,
    justifyContent: "center",
    width: 66,
  },
  avatarText: {
    color: colors.background,
    fontSize: 20,
    fontWeight: "900",
  },
  heroTextWrap: {
    flex: 1,
  },
  heroName: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900",
  },
  heroEmail: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  smallAction: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  smallActionText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  metricGrid: {
    flexDirection: "row",
    gap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardEyebrow: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900",
  },
  primaryAction: {
    backgroundColor: colors.lime,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  primaryActionText: {
    color: colors.background,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  secondaryAction: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  secondaryActionText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  valueRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaSmall: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  summaryValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  settingsList: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  settingsRow: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  settingInfoWrap: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  settingIcon: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  settingIconText: {
    color: colors.lime,
    fontSize: 15,
    fontWeight: "900",
  },
  settingLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  settingValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 2,
  },
  chevron: {
    color: colors.muted,
    fontSize: 22,
    fontWeight: "700",
  },
  dataList: {
    gap: 10,
  },
  dataRow: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dataLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  dataValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  sheetBackdrop: {
    backgroundColor: "rgba(0,0,0,0.62)",
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "88%",
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 10,
  },
  sheetHandle: {
    alignSelf: "center",
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 4,
    marginBottom: 16,
    width: 48,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 16,
  },
  sheetContent: {
    gap: 14,
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  rowTwo: {
    flexDirection: "row",
    gap: 10,
  },
  flexInput: {
    flex: 1,
  },
  dateField: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  dateFieldText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  fieldLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  inputWithTopSpacing: {
    marginTop: 10,
  },
  unitFieldWrap: {
    flex: 1,
  },
  segmentedWrap: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    overflow: "hidden",
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
  },
  segmentButtonActive: {
    backgroundColor: colors.lime,
    borderRadius: 999,
  },
  segmentButtonText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
    textAlign: "center",
    textTransform: "uppercase",
  },
  segmentButtonTextActive: {
    color: colors.background,
  },
  miniFieldGroup: {
    gap: 10,
  },
  previewCard: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  previewLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  previewValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 6,
  },
});

