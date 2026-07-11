import { useEffect, useState } from "react";
import WeatherIcon from "./WeatherIcon.jsx";
import { fetchWorldNow } from "../lib/openMeteo.js";
import { describeWmo } from "../lib/wmo.js";
import { useUnit } from "../context/UnitContext.jsx";

const WORLD_CITIES = [
  { id: "tokyo", name: "Tokyo", country: "Japan", latitude: 35.6762, longitude: 139.6503 },
  { id: "london", name: "London", country: "United Kingdom", latitude: 51.5072, longitude: -0.1276 },
  { id: "new-york", name: "New York", country: "United States", latitude: 40.7128, longitude: -74.006 },
  { id: "sydney", name: "Sydney", country: "Australia", latitude: -33.8688, longitude: 151.2093 },
  { id: "paris", name: "Paris", country: "France", latitude: 48.8566, longitude: 2.3522 },
  { id: "dubai", name: "Dubai", country: "United Arab Emirates", latitude: 25.2048, longitude: 55.2708 },
];

// "Right now, around the world" — compact live cards; click one to load it.
export default function WorldStrip({ onPick }) {
  const unit = useUnit();
  const [slots, setSlots] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchWorldNow(WORLD_CITIES, ctrl.signal)
      .then(setSlots)
      .catch(() => setSlots(null)); // strip is decorative — fail silently
    return () => ctrl.abort();
  }, []);

  if (!slots) return null;

  return (
    <section className="card panel reveal" style={{ "--i": 3 }}>
      <div className="panel-head">
        <h3>Right now, around the world</h3>
        <span className="panel-note">Tap a city to explore it</span>
      </div>
      <div className="world-strip">
        {slots.map(({ city, current }) => {
          if (!current) return null;
          const wmo = describeWmo(current.weather_code);
          return (
            <button
              key={city.id}
              type="button"
              className="world-card"
              onClick={() => onPick(city)}
            >
              <WeatherIcon variant={wmo.icon} night={current.is_day === 0} size={36} />
              <strong>{unit.temp(current.temperature_2m)}°</strong>
              <span className="world-name">{city.name}</span>
              <span className="world-cond">{wmo.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
