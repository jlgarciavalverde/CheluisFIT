import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../auth/AuthProvider";
import { Button } from "../components/Button";
import { SegmentedTabs } from "../components/SegmentedTabs";
import { TextField } from "../components/TextField";
import { colors, typography } from "../theme/tokens";

export function AuthScreen() {
  const { apiBase, login, register, setApiBase } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName1: "",
    lastName2: "",
    birthDate: "1990-01-01",
    currentWeightKg: "80",
    currentHeightCm: "180",
    email: "",
    password: "",
  });

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
          currentWeightKg: Number(form.currentWeightKg),
          currentHeightCm: Number(form.currentHeightCm),
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
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brandBlock}>
          <Text style={styles.eyebrow}>CheluisFIT</Text>
          <Text style={styles.brand}>Train heavier.</Text>
          <Text style={styles.subtitle}>Registra entrenos, rutinas y progreso real.</Text>
        </View>

        <SegmentedTabs
          tabs={[
            { key: "login", label: "Login" },
            { key: "register", label: "Registro" },
          ]}
          value={mode}
          onChange={(key) => setMode(key as "login" | "register")}
        />

        <TextField value={apiBase} onChangeText={setApiBase} autoCapitalize="none" />

        {mode === "register" ? (
          <>
            <TextField
              placeholder="Nombre"
              value={form.firstName}
              onChangeText={(value) => setForm({ ...form, firstName: value })}
            />
            <TextField
              placeholder="Apellido 1"
              value={form.lastName1}
              onChangeText={(value) => setForm({ ...form, lastName1: value })}
            />
            <TextField
              placeholder="Apellido 2"
              value={form.lastName2}
              onChangeText={(value) => setForm({ ...form, lastName2: value })}
            />
            <TextField
              placeholder="Fecha nacimiento YYYY-MM-DD"
              value={form.birthDate}
              onChangeText={(value) => setForm({ ...form, birthDate: value })}
            />
            <View style={styles.row}>
              <TextField
                placeholder="Peso kg"
                keyboardType="numeric"
                value={form.currentWeightKg}
                onChangeText={(value) => setForm({ ...form, currentWeightKg: value })}
                style={styles.flex}
              />
              <TextField
                placeholder="Altura cm"
                keyboardType="numeric"
                value={form.currentHeightCm}
                onChangeText={(value) => setForm({ ...form, currentHeightCm: value })}
                style={styles.flex}
              />
            </View>
          </>
        ) : null}

        <TextField
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={form.email}
          onChangeText={(value) => setForm({ ...form, email: value })}
        />
        <TextField
          placeholder="Password"
          secureTextEntry
          value={form.password}
          onChangeText={(value) => setForm({ ...form, password: value })}
        />

        <Button
          disabled={loading}
          label={loading ? "Cargando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
          onPress={submit}
        />
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
    gap: 12,
    justifyContent: "center",
    padding: 24,
  },
  brandBlock: {
    gap: 6,
    marginBottom: 12,
  },
  eyebrow: {
    color: colors.lime,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  brand: {
    color: colors.text,
    fontSize: typography.display,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  flex: {
    flex: 1,
  },
});
