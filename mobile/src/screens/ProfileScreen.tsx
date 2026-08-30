import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import type { AuthUser, BodyMeasurement, TrainingGoal, TrainingPreference } from "../api/types";
import { useAuth } from "../auth/AuthProvider";
import { showError } from "../utils/errors";
import { useToast } from "../contexts/ToastContext";
import { Button } from "../components/Button";
import { MetricTile } from "../components/MetricTile";
import { ProgressChart } from "../components/ProgressChart";
import { Screen } from "../components/Screen";
import { Section } from "../components/Section";
import { SegmentedTabs } from "../components/SegmentedTabs";
import { TextField } from "../components/TextField";
import { colors, radius, shadow } from "../theme/tokens";

export function ProfileScreen() {
  const showToast = useToast();
  const { apiFetch, logout, setUser, user } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName1, setLastName1] = useState(user?.lastName1 ?? "");
  const [lastName2, setLastName2] = useState(user?.lastName2 ?? "");
  const [birthDate, setBirthDate] = useState(formatInputDate(user?.birthDate));
  const [weightKg, setWeightKg] = useState(String(user?.currentWeightKg ?? 80));
  const [heightCm, setHeightCm] = useState(String(user?.currentHeightCm ?? 180));
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [defaultRest, setDefaultRest] = useState("90");
  const [weeklyFrequency, setWeeklyFrequency] = useState("4");
  const [goal, setGoal] = useState<TrainingGoal>("HYPERTROPHY");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");

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
    Promise.all([
      apiFetch<{ data: BodyMeasurement[] }>("/me/body-measurements"),
      apiFetch<{ data: TrainingPreference }>("/me/preferences"),
    ])
      .then(([measurementResult, preferenceResult]) => {
        setMeasurements(measurementResult.data);
        setDefaultRest(String(preferenceResult.data.defaultRestSeconds));
        setWeeklyFrequency(String(preferenceResult.data.weeklyFrequency));
        setGoal(preferenceResult.data.goal);
      })
      .catch(() => undefined);
  }, [apiFetch]);

  if (!user) {
    return null;
  }

  const saveProfile = async () => {
    const nextWeight = Number(weightKg);
    const nextHeight = Number(heightCm);

    if (!Number.isFinite(nextWeight) || !Number.isFinite(nextHeight)) {
      throw new Error("Peso y altura deben ser numeros validos");
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
    showToast("Perfil actualizado");
  };

  const saveMeasurement = async () => {
    const result = await apiFetch<{ data: BodyMeasurement }>("/me/body-measurements", {
      method: "POST",
      body: JSON.stringify({ weightKg: Number(weightKg), heightCm: Number(heightCm) }),
    });
    setUser({
      ...user,
      currentWeightKg: result.data.weightKg,
      currentHeightCm: result.data.heightCm,
    });
    setMeasurements([...measurements, result.data]);
    showToast("Medicion guardada");
  };

  const savePreferences = async () => {
    const result = await apiFetch<{ data: TrainingPreference }>("/me/preferences", {
      method: "PATCH",
      body: JSON.stringify({
        defaultRestSeconds: Number(defaultRest),
        weeklyFrequency: Number(weeklyFrequency),
        goal,
        units: "METRIC",
      }),
    });
    setDefaultRest(String(result.data.defaultRestSeconds));
    setWeeklyFrequency(String(result.data.weeklyFrequency));
    setGoal(result.data.goal);
    showToast("Preferencias guardadas");
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword) {
      showToast("Completa ambos campos");
      return;
    }
    await apiFetch("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setCurrentPassword("");
    setNewPassword("");
    showToast("Contrasena cambiada");
  };

  const confirmDeleteAccount = () => {
    if (!deletePassword) {
      showToast("Introduce tu contrasena para confirmar");
      return;
    }
    Alert.alert(
      "Eliminar cuenta",
      "Esta accion es irreversible. Se borraran todos tus datos.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            apiFetch("/me", {
              method: "DELETE",
              body: JSON.stringify({ password: deletePassword }),
            })
              .then(() => logout())
              .catch(showError);
          },
        },
      ],
    );
  };

  const latestMeasurement =
    (measurements.length > 0 ? measurements[measurements.length - 1].weightKg : null) ??
    user.currentWeightKg;
  const prevMeasurement =
    measurements.length > 1 ? measurements[measurements.length - 2].weightKg : null;
  const weightDelta = latestMeasurement - (prevMeasurement ?? latestMeasurement);

  return (
    <Screen>
      <Section title="Perfil">
        <View style={styles.profileCard}>
          <Text style={styles.name}>
            {user.firstName} {user.lastName1}
          </Text>
          <Text style={styles.meta}>{user.email}</Text>
          <View style={styles.metricGrid}>
            <MetricTile label="Peso" value={`${user.currentWeightKg} kg`} />
            <MetricTile label="Altura" value={`${user.currentHeightCm} cm`} />
          </View>
        </View>
      </Section>

      <Section title="Datos personales">
        <View style={styles.panel}>
          <TextField placeholder="Nombre" value={firstName} onChangeText={setFirstName} />
          <View style={styles.row}>
            <TextField
              placeholder="Primer apellido"
              value={lastName1}
              onChangeText={setLastName1}
              style={styles.flex}
            />
            <TextField
              placeholder="Segundo apellido"
              value={lastName2 ?? ""}
              onChangeText={setLastName2}
              style={styles.flex}
            />
          </View>
          <TextField
            placeholder="Fecha nacimiento YYYY-MM-DD"
            value={birthDate}
            onChangeText={setBirthDate}
          />
          <View style={styles.row}>
            <TextField
              placeholder="Peso kg"
              keyboardType="numeric"
              value={weightKg}
              onChangeText={setWeightKg}
              style={styles.flex}
            />
            <TextField
              placeholder="Altura cm"
              keyboardType="numeric"
              value={heightCm}
              onChangeText={setHeightCm}
              style={styles.flex}
            />
          </View>
          <Button label="Guardar perfil" onPress={() => saveProfile().catch(showError)} />
        </View>
      </Section>

      <Section title="Medicion rapida">
        <View style={styles.panel}>
          <Button label="Guardar medicion" onPress={() => saveMeasurement().catch(showError)} />
        </View>
      </Section>

      <Section title="Evolucion corporal">
        <View style={styles.panel}>
          <ProgressChart
            values={measurements.map((measurement) => measurement.weightKg)}
            labels={measurements.map((measurement) =>
              measurement.measuredAt,
            )}
          />
          <View style={styles.inlineSummary}>
            <Text style={styles.meta}>{measurements.length} mediciones guardadas</Text>
            <Text
              style={[
                styles.deltaText,
                {
                  color:
                    weightDelta === 0
                      ? colors.muted
                      : (goal === "FAT_LOSS" ? weightDelta < 0 : weightDelta > 0)
                        ? colors.lime
                        : colors.error,
                },
              ]}
            >
              {weightDelta >= 0 ? "+" : ""}
              {weightDelta.toFixed(1)} kg
            </Text>
          </View>
          <Text style={styles.meta}>Ultimo registro: {latestMeasurement.toFixed(1)} kg</Text>
        </View>
      </Section>

      <Section title="Preferencias">
        <View style={styles.panel}>
          <SegmentedTabs
            tabs={[
              { key: "HYPERTROPHY", label: "Hipertrofia" },
              { key: "STRENGTH", label: "Fuerza" },
              { key: "FAT_LOSS", label: "Definicion" },
              { key: "GENERAL_FITNESS", label: "General" },
            ]}
            value={goal}
            onChange={(key) => setGoal(key as TrainingGoal)}
          />
          <View style={styles.row}>
            <TextField
              placeholder="Descanso defecto"
              keyboardType="numeric"
              value={defaultRest}
              onChangeText={setDefaultRest}
              style={styles.flex}
            />
            <TextField
              placeholder="Frecuencia semanal"
              keyboardType="numeric"
              value={weeklyFrequency}
              onChangeText={setWeeklyFrequency}
              style={styles.flex}
            />
          </View>
          <Text style={styles.meta}>kg/cm · frecuencia 2 preparada para volumen por musculo.</Text>
          <Button label="Guardar preferencias" onPress={() => savePreferences().catch(showError)} />
        </View>
      </Section>

      <Section title="Cambiar contrasena">
        <View style={styles.panel}>
          <TextField
            placeholder="Contrasena actual"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />
          <TextField
            placeholder="Nueva contrasena"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <Button
            label="Cambiar contrasena"
            variant="secondary"
            onPress={() => changePassword().catch(showError)}
          />
        </View>
      </Section>

      <Section title="Zona peligrosa">
        <View style={styles.dangerPanel}>
          <Text style={styles.dangerText}>
            Al eliminar tu cuenta se borraran todos tus datos permanentemente.
          </Text>
          <TextField
            placeholder="Introduce tu contrasena"
            value={deletePassword}
            onChangeText={setDeletePassword}
            secureTextEntry
          />
          <Button
            label="Eliminar cuenta"
            variant="ghost"
            onPress={confirmDeleteAccount}
          />
        </View>
      </Section>
    </Screen>
  );
}

function formatInputDate(value?: string) {
  if (!value) return "";
  return value.slice(0, 10);
}

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 10,
    padding: 12,
    ...shadow.card,
  },
  metricGrid: {
    flexDirection: "row",
    gap: 10,
  },
  panel: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 10,
    padding: 12,
    ...shadow.card,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  flex: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  inlineSummary: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  deltaText: {
    color: colors.lime,
    fontSize: 14,
    fontWeight: "900",
  },
  dangerPanel: {
    backgroundColor: colors.surface2,
    borderColor: colors.error,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  dangerText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: "600",
  },
});
