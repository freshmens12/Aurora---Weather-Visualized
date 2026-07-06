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

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // Follow the OS preference unless the user has made an explicit choice.
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const onChange = (e) => {
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        setTheme(e.matches ? "dark" : "light");
      }
    };
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const toggle = useCallback(() => {
    // Briefly flag the <html> so global.css can run the color sweep effect.
    document.documentElement.setAttribute("data-theme-anim", "1");
    window.clearTimeout(toggle._t);
    toggle._t = window.setTimeout(
      () => document.documentElement.removeAttribute("data-theme-anim"),
      650
    );
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  const api = useMemo(
    () => ({ theme, toggle, setTheme, isDark: theme === "dark" }),
    [theme, toggle]
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
