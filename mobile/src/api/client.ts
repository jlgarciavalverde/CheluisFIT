import { Platform } from "react-native";

export const defaultApiBase =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === "android"
    ? "http://10.0.2.2:3000/api"
    : "http://127.0.0.1:3000/api");

export async function parseApiResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(body?.error ?? "Request failed");
  }

  return body as T;
}
