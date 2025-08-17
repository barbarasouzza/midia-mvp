import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import "./toast.css";

type ToastVariant = "success" | "error" | "info";
type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number; // ms
};

type ToastContextType = {
  push: (opts: { message: string; variant?: ToastVariant; duration?: number }) => string;
  remove: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    ({ message, variant = "info", duration = 3000 }: { message: string; variant?: ToastVariant; duration?: number }) => {
      const id =
        (globalThis.crypto && "randomUUID" in globalThis.crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`) as string;

      const item: ToastItem = { id, message, variant, duration };
      setToasts((list) => [...list, item]);

      // auto-remove
      window.setTimeout(() => remove(id), duration);
      return id;
    },
    [remove]
  );

  const value = useMemo<ToastContextType>(() => ({ push, remove }), [push, remove]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onClose={remove} />
    </ToastContext.Provider>
  );
}

/** Hook de uso */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve ser usado dentro de <ToastProvider>");
  const success = (message: string, duration = 2800) => ctx.push({ message, variant: "success", duration });
  const error = (message: string, duration = 3800) => ctx.push({ message, variant: "error", duration });
  const info = (message: string, duration = 3000) => ctx.push({ message, variant: "info", duration });
  return { ...ctx, success, error, info };
}

/** Renderiza os toasts */
function Toaster({ toasts, onClose }: { toasts: ToastItem[]; onClose: (id: string) => void }) {
  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="true">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`toast ${t.variant === "success" ? "toast-success" : t.variant === "error" ? "toast-error" : "toast-info"}`}
        >
          <span className="toast-msg">{t.message}</span>
          <button className="toast-close" aria-label="Fechar" onClick={() => onClose(t.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
