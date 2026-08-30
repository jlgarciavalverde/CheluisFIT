import DateTimePicker from "@react-native-community/datetimepicker";
import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../auth/AuthProvider";
import { Button } from "../components/Button";
import { SegmentedTabs } from "../components/SegmentedTabs";
import { TextField } from "../components/TextField";
import { colors, radius, typography } from "../theme/tokens";

type WeightUnit = "kg" | "lb";
type HeightUnit = "cm" | "ft";
type UnitPickerTarget = "weight" | "height" | null;

const DEFAULT_DATE = "1990-01-01";

function parseDateInput(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return new Date(1990, 0, 1);
  }

  return new Date(year, month - 1, day);
}

function formatDisplayDate(value: string): string {
  if (!value) {
    return "Selecciona fecha";
  }

  const date = parseDateInput(value);
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatIsoDate(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function convertWeightToKg(value: string, unit: WeightUnit): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return 0;
  }

  return unit === "kg" ? parsed : parsed * 0.45359237;
}

function convertHeightToCm(value: string, unit: HeightUnit): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return 0;
  }

  return unit === "cm" ? parsed : parsed * 30.48;
}

function UnitPicker({
  label,
  value,
  options,
  open,
  onToggle,
  onSelect,
}: {
  label: string;
  value: string;
  options: string[];
  open: boolean;
  onToggle: () => void;
  onSelect: (option: string) => void;
}) {
  return (
    <View style={styles.unitWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable onPress={onToggle} style={styles.unitToggle}>
        <Text style={styles.unitValue}>{value}</Text>
        <Text style={styles.unitCaret}>▾</Text>
      </Pressable>

      {open ? (
        <View style={styles.unitMenu}>
          {options.map((option) => (
            <Pressable
              accessibilityRole="button"
              key={option}
              onPress={() => onSelect(option)}
              style={[styles.unitOption, option === value && styles.unitOptionActive]}
            >
              <Text style={[styles.unitOptionText, option === value && styles.unitOptionTextActive]}>
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function AuthScreen() {
  const { apiBase, login, register, setApiBase } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [openUnitPicker, setOpenUnitPicker] = useState<UnitPickerTarget>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName1: "",
    lastName2: "",
    birthDate: DEFAULT_DATE,
    currentWeightKg: "80",
    currentHeightCm: "180",
    email: "",
    password: "",
  });
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("cm");

  const birthDateValue = useMemo(() => parseDateInput(form.birthDate), [form.birthDate]);

  const submit = async () => {
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register({
          firstName: form.firstName,
          lastName1: form.lastName1,
          lastName2: form.lastName2 || undefined,
          birthDate: form.birthDate,
          currentWeightKg: convertWeightToKg(form.currentWeightKg, weightUnit),
          currentHeightCm: convertHeightToCm(form.currentHeightCm, heightUnit),
          email: form.email,
          password: form.password,
        });
      }
    } catch (error) {
      Alert.alert("No se pudo entrar", error instanceof Error ? error.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.app}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>CheluisFIT</Text>
          <Text style={styles.brand}>{mode === "login" ? "Bienvenido de nuevo" : "Crea tu cuenta"}</Text>
          <Text style={styles.subtitle}>
            {mode === "login"
              ? "Tu progreso, tus rutinas y tus récords en una sola app."
              : "Empieza con un perfil listo para entrenar y medir tu evolución."}
          </Text>
        </View>

        <View style={styles.card}>
          <SegmentedTabs
            tabs={[
              { key: "login", label: "Login" },
              { key: "register", label: "Registro" },
            ]}
            value={mode}
            onChange={(key) => setMode(key as "login" | "register")}
          />

          {mode === "register" ? (
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Perfil</Text>
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>Nombre</Text>
                  <TextField
                    placeholder="Tu nombre"
                    value={form.firstName}
                    onChangeText={(value) => setForm({ ...form, firstName: value })}
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>Apellido</Text>
                  <TextField
                    placeholder="Primer apellido"
                    value={form.lastName1}
                    onChangeText={(value) => setForm({ ...form, lastName1: value })}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Segundo apellido</Text>
                <TextField
                  placeholder="Opcional"
                  value={form.lastName2}
                  onChangeText={(value) => setForm({ ...form, lastName2: value })}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Fecha de nacimiento</Text>
                <Pressable onPress={() => setShowDatePicker(true)} style={styles.dateInput}>
                  <Text style={styles.dateText}>{formatDisplayDate(form.birthDate)}</Text>
                  <Text style={styles.dateHint}>Cambiar</Text>
                </Pressable>
                {showDatePicker ? (
                  <DateTimePicker
                    value={birthDateValue}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    maximumDate={new Date()}
                    onChange={(_, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setForm({ ...form, birthDate: formatIsoDate(selectedDate) });
                      }
                    }}
                  />
                ) : null}
              </View>

              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>Peso</Text>
                  <View style={styles.metricInputRow}>
                    <TextField
                      placeholder="80"
                      keyboardType="decimal-pad"
                      value={form.currentWeightKg}
                      onChangeText={(value) => setForm({ ...form, currentWeightKg: value })}
                      style={styles.metricInput}
                    />
                    <UnitPicker
                      label=""
                      value={weightUnit}
                      options={["kg", "lb"]}
                      open={openUnitPicker === "weight"}
                      onToggle={() =>
                        setOpenUnitPicker((current) => (current === "weight" ? null : "weight"))
                      }
                      onSelect={(option) => {
                        setWeightUnit(option as WeightUnit);
                        setOpenUnitPicker(null);
                      }}
                    />
                  </View>
                </View>

                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>Altura</Text>
                  <View style={styles.metricInputRow}>
                    <TextField
                      placeholder="180"
                      keyboardType="decimal-pad"
                      value={form.currentHeightCm}
                      onChangeText={(value) => setForm({ ...form, currentHeightCm: value })}
                      style={styles.metricInput}
                    />
                    <UnitPicker
                      label=""
                      value={heightUnit}
                      options={["cm", "ft"]}
                      open={openUnitPicker === "height"}
                      onToggle={() =>
                        setOpenUnitPicker((current) => (current === "height" ? null : "height"))
                      }
                      onSelect={(option) => {
                        setHeightUnit(option as HeightUnit);
                        setOpenUnitPicker(null);
                      }}
                    />
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Cuenta</Text>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextField
                placeholder="tu@email.com"
                autoCapitalize="none"
                keyboardType="email-address"
                value={form.email}
                onChangeText={(value) => setForm({ ...form, email: value })}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Contraseña</Text>
              <TextField
                placeholder="••••••••"
                secureTextEntry
                value={form.password}
                onChangeText={(value) => setForm({ ...form, password: value })}
              />
            </View>
          </View>

          <View style={styles.apiConfig}>
            <Text style={styles.fieldLabel}>Servidor API</Text>
            <TextField value={apiBase} onChangeText={setApiBase} autoCapitalize="none" />
          </View>

          <Button
            disabled={loading}
            label={loading ? "Cargando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
            onPress={submit}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  app: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    paddingVertical: 32,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 18,
    padding: 22,
  },
  eyebrow: {
    color: colors.lime,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  brand: {
    color: colors.text,
    fontSize: typography.display,
    fontWeight: "900",
    lineHeight: 38,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 18,
    padding: 18,
  },
  formSection: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
    opacity: 0.8,
    textTransform: "uppercase",
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  halfField: {
    flex: 1,
    gap: 8,
  },
  dateInput: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 46,
    paddingHorizontal: 12,
  },
  dateText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  dateHint: {
    color: colors.lime,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  metricInputRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  metricInput: {
    flex: 1,
  },
  unitWrap: {
    position: "relative",
  },
  unitToggle: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  unitValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  unitCaret: {
    color: colors.muted,
    fontSize: 12,
  },
  unitMenu: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: 6,
    overflow: "hidden",
    position: "absolute",
    right: 0,
    top: 52,
    width: 78,
    zIndex: 10,
  },
  unitOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  unitOptionActive: {
    backgroundColor: colors.lime,
  },
  unitOptionText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  unitOptionTextActive: {
    color: colors.background,
  },
  apiConfig: {
    gap: 8,
  },
});
