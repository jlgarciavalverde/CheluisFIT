import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as Haptics from "expo-haptics";
import type { WorkoutSession } from "../api/types";
import { useAuth } from "../auth/AuthProvider";

type WorkoutContextValue = {
  activeSession: WorkoutSession | null;
  restLeft: number;
  restTotal: number;
  loadActiveSession: () => Promise<void>;
  startRest: (seconds: number) => void;
  adjustRest: (seconds: number) => void;
  skipRest: () => void;
};

const WorkoutContext = createContext<WorkoutContextValue>({
  activeSession: null,
  restLeft: 0,
  restTotal: 0,
  loadActiveSession: async () => {},
  startRest: () => {},
  adjustRest: () => {},
  skipRest: () => {},
});

export function useWorkout() {
  return useContext(WorkoutContext);
}

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const { apiFetch, user } = useAuth();
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [restTotal, setRestTotal] = useState(0);
  const [restLeft, setRestLeft] = useState(0);
  const previousRestLeft = useRef(0);

  const loadActiveSession = useCallback(async () => {
    if (!user) return;
    const result = await apiFetch<{ data: WorkoutSession | null }>("/workout-sessions/active");
    setActiveSession(result.data);
  }, [apiFetch, user]);

  useEffect(() => {
    loadActiveSession().catch(() => undefined);
  }, [loadActiveSession]);

  useEffect(() => {
    if (restLeft <= 0) return;
    const timer = setInterval(() => {
      setRestLeft((current) => Math.max(current - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [restLeft]);

  useEffect(() => {
    if (previousRestLeft.current > 0 && restLeft === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    }

    previousRestLeft.current = restLeft;
  }, [restLeft]);

  const startRest = (seconds: number) => {
    setRestTotal(seconds);
    setRestLeft(seconds);
  };

  const adjustRest = (seconds: number) => {
    setRestLeft((current) => Math.max(current + seconds, 0));
    setRestTotal((current) => Math.max(current + seconds, restLeft + seconds, 0));
  };

  const skipRest = () => {
    setRestLeft(0);
  };

  return (
    <WorkoutContext.Provider
      value={{
        activeSession,
        restLeft,
        restTotal,
        loadActiveSession,
        startRest,
        adjustRest,
        skipRest,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}
