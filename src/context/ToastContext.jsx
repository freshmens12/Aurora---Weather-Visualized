import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

const ToastContext = createContext(null);

const ICONS = {
  success: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path
        d="M12 3.6 21.4 20H2.6L12 3.6Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 10v4" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" strokeLinecap="round" />
      <circle cx="12" cy="7.8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  ),
};

const TITLES = {
  success: "Success",
  error: "Something went wrong",
  warning: "Heads up",
  info: "Info",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) =>
      list.map((t) => (t.id === id ? { ...t, leaving: true } : t))
    );
    setTimeout(
      () => setToasts((list) => list.filter((t) => t.id !== id)),
      260
    );
  }, []);

  const push = useCallback(
    (type, message, title) => {
      const id = ++idRef.current;
      const toast = {
        id,
        type,
        message,
        title: title ?? TITLES[type] ?? "Notice",
        leaving: false,
      };
      setToasts((list) => [...list.slice(-3), toast]);
      setTimeout(() => dismiss(id), 5000);
      return id;
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      push,
      dismiss,
      success: (msg, title) => push("success", msg, title),
      error: (msg, title) => push("error", msg, title),
      warning: (msg, title) => push("warning", msg, title),
      info: (msg, title) => push("info", msg, title),
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div className="toast-stack" role="region" aria-label="Notifications">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`toast toast-${t.type}${t.leaving ? " toast-leaving" : ""}`}
              role={t.type === "error" ? "alert" : "status"}
            >
              <span className="toast-icon">{ICONS[t.type]}</span>
              <div className="toast-body">
                <strong>{t.title}</strong>
                <p>{t.message}</p>
              </div>
              <button
                className="toast-close"
                aria-label="Dismiss notification"
                onClick={() => dismiss(t.id)}
              >
                ×
              </button>
              <span className="toast-progress" />
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
