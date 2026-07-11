import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "aurora-theme";

function getStoredTheme() {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : null;
}

function getSystemTheme() {
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }) {
  // "explicit" = the user clicked the toggle at some point; only then does
  // their choice stick. Otherwise Aurora mirrors the OS/browser theme live.
  const [explicit, setExplicit] = useState(() => getStoredTheme() !== null);
  const [theme, setTheme] = useState(() => getStoredTheme() ?? getSystemTheme());

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Persist only explicit choices — an untouched app keeps following the OS.
  useEffect(() => {
    if (explicit) window.localStorage.setItem(STORAGE_KEY, theme);
  }, [explicit, theme]);

  // Live-follow the OS/browser theme until the user overrides it.
  useEffect(() => {
    if (explicit) return;
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const onChange = (e) => setTheme(e.matches ? "dark" : "light");
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [explicit]);

  const toggle = useCallback(() => {
    // Briefly flag the <html> so global.css can run the color sweep effect.
    document.documentElement.setAttribute("data-theme-anim", "1");
    window.clearTimeout(toggle._t);
    toggle._t = window.setTimeout(
      () => document.documentElement.removeAttribute("data-theme-anim"),
      650
    );
    setExplicit(true);
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  // Hand control back to the OS/browser theme (clears the saved override).
  const useSystem = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setExplicit(false);
    setTheme(getSystemTheme());
  }, []);

  const api = useMemo(
    () => ({
      theme,
      toggle,
      setTheme,
      useSystem,
      followsSystem: !explicit,
      isDark: theme === "dark",
    }),
    [theme, toggle, useSystem, explicit]
  );

  return (
    <ThemeContext.Provider value={api}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}