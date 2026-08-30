import * as SecureStore from "expo-secure-store";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { defaultApiBase, parseApiResponse } from "../api/client";
import type { ApiFetch, AuthUser, RegisterPayload } from "../api/types";

type AuthContextValue = {
  apiBase: string;
  apiFetch: ApiFetch;
  booting: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  setApiBase: (value: string) => void;
  setUser: (user: AuthUser) => void;
  token: string | null;
  user: AuthUser | null;
};

const TOKEN_KEY = "cheluisfit.jwt";
const USER_KEY = "cheluisfit.user";
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [apiBase, setApiBase] = useState(defaultApiBase);
  const [booting, setBooting] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUserState] = useState<AuthUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const [storedToken, storedUser] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);

      if (cancelled) return;

      let nextUser: AuthUser | null = null;

      if (storedUser) {
        try {
          nextUser = JSON.parse(storedUser) as AuthUser;
        } catch {
          await Promise.all([
            SecureStore.deleteItemAsync(TOKEN_KEY),
            SecureStore.deleteItemAsync(USER_KEY),
          ]);
        }
      }

      setToken(storedToken);
      setUserState(nextUser);
      setBooting(false);
    }

    restoreSession().catch(() => {
      if (!cancelled) {
        setBooting(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const persistAuth = useCallback(async (authToken: string, authUser: AuthUser) => {
    setToken(authToken);
    setUserState(authUser);
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, authToken),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(authUser)),
    ]);
  }, []);

  const apiFetch = useCallback<ApiFetch>(
    async (path, options = {}) => {
      try {
        const hasBody = typeof options.body !== "undefined";

        const response = await fetch(`${apiBase}${path}`, {
          ...options,
          headers: {
            ...(hasBody ? { "Content-Type": "application/json" } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
          },
        });

        return parseApiResponse(response);
      } catch (error) {
        if (error instanceof Error && error.message.toLowerCase().includes("cancelled")) {
          throw new Error("La conexión se canceló. Comprueba tu red y vuelve a intentarlo.");
        }

        if (error instanceof Error) {
          throw error;
        }

        throw new Error("No se pudo completar la solicitud.");
      }
    },
    [apiBase, token],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await apiFetch<{ token: string; user: AuthUser }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await persistAuth(result.token, result.user);
    },
    [apiFetch, persistAuth],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const result = await apiFetch<{ token: string; user: AuthUser }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await persistAuth(result.token, result.user);
    },
    [apiFetch, persistAuth],
  );

  const logout = useCallback(async () => {
    setToken(null);
    setUserState(null);
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
  }, []);

  const setUser = useCallback((nextUser: AuthUser) => {
    setUserState(nextUser);
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(nextUser)).catch(() => undefined);
  }, []);

  const value = useMemo(
    () => ({
      apiBase,
      apiFetch,
      booting,
      login,
      logout,
      register,
      setApiBase,
      setUser,
      token,
      user,
    }),
    [apiBase, apiFetch, booting, login, logout, register, setUser, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
