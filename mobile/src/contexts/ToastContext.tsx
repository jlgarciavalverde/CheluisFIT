import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Toast } from "../components/Toast";

type ShowToast = (message: string) => void;

const ToastContext = createContext<ShowToast>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");

  const showToast = useCallback((text: string) => {
    setMessage(text);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <Toast message={message} onDone={() => setMessage("")} />
    </ToastContext.Provider>
  );
}
