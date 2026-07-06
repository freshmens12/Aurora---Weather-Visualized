import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const UnitContext = createContext(null);
const STORAGE_KEY = "aurora-unit";

function getInitial() {
  if (typeof window === "undefined") return "c";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "f" ? "f" : "c";
}

export function UnitProvider({ children }) {
  const [unit, setUnit] = useState(getInitial);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, unit);
  }, [unit]);

  const toggle = useCallback(
    () => setUnit((u) => (u === "c" ? "f" : "c")),
    []
  );

  const api = useMemo(() => {
    const isF = unit === "f";
    // Convert a Celsius value to the active unit.
    const conv = (c) => (isF ? c * 1.8 + 32 : c);
    return {
      unit,
      isF,
      toggle,
      symbol: isF ? "°F" : "°C",
      // Rounded number in the active unit (for display).
      temp: (c) => (c == null ? c : Math.round(conv(c))),
      conv,
    };
  }, [unit, toggle]);

  return <UnitContext.Provider value={api}>{children}</UnitContext.Provider>;
}

export function useUnit() {
  const ctx = useContext(UnitContext);
  if (!ctx) throw new Error("useUnit must be used inside <UnitProvider>");
  return ctx;
}
