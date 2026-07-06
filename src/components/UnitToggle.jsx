import { useUnit } from "../context/UnitContext.jsx";

export default function UnitToggle() {
  const { isF, toggle } = useUnit();
  return (
    <button
      type="button"
      className="unit-toggle"
      onClick={toggle}
      role="switch"
      aria-checked={isF}
      aria-label={isF ? "Switch to Celsius" : "Switch to Fahrenheit"}
      title="Toggle temperature units"
    >
      <span className={`unit-opt${!isF ? " on" : ""}`}>°C</span>
      <span className={`unit-opt${isF ? " on" : ""}`}>°F</span>
    </button>
  );
}
