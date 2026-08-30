import { Alert } from "react-native";

export function showError(error: unknown) {
  Alert.alert("Error", error instanceof Error ? error.message : "Algo ha fallado");
}
