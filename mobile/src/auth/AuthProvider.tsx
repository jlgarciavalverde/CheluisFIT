import * as SecureStore from "expo-secure-store";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ApiError, createTimeoutSignal, defaultApiBase, parseApiResponse } from "../api/client";
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
const REFRESH_TOKEN_KEY = "cheluisfit.refreshToken";
const USER_KEY = "cheluisfit.user";
const AuthContext = createContext<AuthContextValue | null>(null);

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (typeof payload.exp !== "number") return false;
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [apiBase, setApiBase] = useState(defaultApiBase);
  const [booting, setBooting] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUserState] = useState<AuthUser | null>(null);
  const logoutRef = useRef<() => Promise<void>>(undefined);
  const refreshTokenRef = useRef<string | null>(null);
  const refreshPromiseRef = useRef<Promise<string> | null>(null);

  const clearAuth = useCallback(async () => {
    setToken(null);
    setUserState(null);
    refreshTokenRef.current = null;
    refreshPromiseRef.current = null;
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
  }, []);

  logoutRef.current = clearAuth;

  const persistAuth = useCallback(
    async (authToken: string, authRefreshToken: string, authUser: AuthUser) => {
      setToken(authToken);
      setUserState(authUser);
      refreshTokenRef.current = authRefreshToken;
      refreshPromiseRef.current = null;
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, authToken),
        SecureStore.setItemAsync(REFRESH_TOKEN_KEY, authRefreshToken),
        SecureStore.setItemAsync(USER_KEY, JSON.stringify(authUser)),
      ]);
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const [storedToken, storedRefreshToken, storedUser] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);

      if (!cancelled) {
        if (storedToken && !isTokenExpired(storedToken)) {
          setToken(storedToken);
          refreshTokenRef.current = storedRefreshToken;
          setUserState(storedUser ? (JSON.parse(storedUser) as AuthUser) : null);
        } else if (storedRefreshToken) {
          try {
            const response = await fetch(`${apiBase}/auth/refresh`, {
              method: "POST",
              signal: createTimeoutSignal(),
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken: storedRefreshToken }),
            });
            if (response.ok) {
              const result = await response.json();
              setToken(result.token);
              refreshTokenRef.current = result.refreshToken;
              setUserState(result.user);
              await Promise.all([
                SecureStore.setItemAsync(TOKEN_KEY, result.token),
                SecureStore.setItemAsync(REFRESH_TOKEN_KEY, result.refreshToken),
                SecureStore.setItemAsync(USER_KEY, JSON.stringify(result.user)),
              ]);
            } else {
              await SecureStore.deleteItemAsync(TOKEN_KEY);
              await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
              await SecureStore.deleteItemAsync(USER_KEY);
            }
          } catch {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
            await SecureStore.deleteItemAsync(USER_KEY);
          }
        } else if (storedToken) {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          await SecureStore.deleteItemAsync(USER_KEY);
        }
        setBooting(false);
      }
    }

    restoreSession().catch(() => {
      if (!cancelled) {
        setBooting(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  const refreshAccessToken = useCallback(async (): Promise<string> => {
    const stored = refreshTokenRef.current;
    if (!stored) throw new ApiError("No refresh token", 401);

    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    const promise = (async () => {
      const response = await fetch(`${apiBase}/auth/refresh`, {
        method: "POST",
        signal: createTimeoutSignal(),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: stored }),
      });

      if (!response.ok) {
        await logoutRef.current?.();
        throw new ApiError("Session expired", 401);
      }

      const result = await response.json();
      setToken(result.token);
      refreshTokenRef.current = result.refreshToken;
      refreshPromiseRef.current = null;
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, result.token),
        SecureStore.setItemAsync(REFRESH_TOKEN_KEY, result.refreshToken),
      ]);
      return result.token as string;
    })();

    refreshPromiseRef.current = promise;
    return promise;
  }, [apiBase]);

  const apiFetch = useCallback<ApiFetch>(
    async (path, options = {}) => {
      let currentToken = token;

      if (currentToken && isTokenExpired(currentToken)) {
        try {
          currentToken = await refreshAccessToken();
        } catch {
          await logoutRef.current?.();
          throw new ApiError("Session expired", 401);
        }
      }

      const response = await fetch(`${apiBase}${path}`, {
        ...options,
        signal: options.signal ?? createTimeoutSignal(),
        headers: {
          "Content-Type": "application/json",
          ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
          ...options.headers,
        },
      });

      if (response.status === 401) {
        try {
          const newToken = await refreshAccessToken();
          const retryResponse = await fetch(`${apiBase}${path}`, {
            ...options,
            signal: options.signal ?? createTimeoutSignal(),
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${newToken}`,
              ...options.headers,
            },
          });
          return parseApiResponse(retryResponse);
        } catch {
          await logoutRef.current?.();
          throw new ApiError("Session expired", 401);
        }
      }

      return parseApiResponse(response);
    },
    [apiBase, token, refreshAccessToken],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        signal: createTimeoutSignal(),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await parseApiResponse<{ token: string; refreshToken: string; user: AuthUser }>(response);
      await persistAuth(result.token, result.refreshToken, result.user);
    },
    [apiBase, persistAuth],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const response = await fetch(`${apiBase}/auth/register`, {
        method: "POST",
        signal: createTimeoutSignal(),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await parseApiResponse<{ token: string; refreshToken: string; user: AuthUser }>(response);
      await persistAuth(result.token, result.refreshToken, result.user);
    },
    [apiBase, persistAuth],
  );

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
      logout: clearAuth,
      register,
      setApiBase,
      setUser,
      token,
      user,
    }),
    [apiBase, apiFetch, booting, clearAuth, login, register, setUser, token, user],
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
