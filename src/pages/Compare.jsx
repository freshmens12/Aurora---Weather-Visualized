import { useCallback, useEffect, useState } from "react";
import SearchBox from "../components/SearchBox.jsx";
import WeatherIcon from "../components/WeatherIcon.jsx";
import CompareChart from "../components/CompareChart.jsx";
import { fetchForecast, fetchAirQuality } from "../lib/openMeteo.js";
import { describeWmo, aqiLabel } from "../lib/wmo.js";
import { useToast } from "../context/ToastContext.jsx";
import { useUnit } from "../context/UnitContext.jsx";

const CITY_A = {
  id: "manila-ph",
  name: "Manila",
  region: "Metro Manila",
  country: "Philippines",
  latitude: 14.5995,
  longitude: 120.9842,
};
const CITY_B = {
  id: "singapore",
  name: "Singapore",
  region: "",
  country: "Singapore",
  latitude: 1.3521,
  longitude: 103.8198,
};

async function loadCity(city) {
  const [forecast, air] = await Promise.all([
    fetchForecast(city),
    fetchAirQuality(city).catch(() => null), // air quality is a bonus, not fatal
  ]);
  return { city, forecast, air };
}

function CityColumn({ slot, accent, delay }) {
  const unit = useUnit();
  if (!slot) return null;
  const { city, forecast, air } = slot;
  const cur = forecast.current;
  const wmo = describeWmo(cur.weather_code);
  const night = cur.is_day === 0;
  const aqi = air?.current?.european_aqi;
  const aqiInfo = aqiLabel(aqi);

  return (
    <div className={`compare-card card accent-${accent} reveal`} style={{ "--i": delay }}>
      <header>
        <h3>{city.name}</h3>
        <span>{[city.region, city.country].filter(Boolean).join(", ")}</span>
      </header>
      <div className="compare-current">
        <WeatherIcon variant={wmo.icon} night={night} size={68} lively />
        <div>
          <strong>{unit.temp(cur.temperature_2m)}°</strong>
          <span>{wmo.label}</span>
        </div>
      </div>
      <ul className="compare-stats">
        <li>
          <span>Feels like</span>
          <strong>{unit.temp(cur.apparent_temperature)}°</strong>
        </li>
        <li>
          <span>Humidity</span>
          <strong>{cur.relative_humidity_2m}%</strong>
        </li>
        <li>
          <span>Wind</span>
          <strong>{Math.round(cur.wind_speed_10m)} km/h</strong>
        </li>
        <li>
          <span>Air quality</span>
          <strong className={`aqi aqi-${aqiInfo.tone}`}>
            {aqi != null ? `${Math.round(aqi)} · ${aqiInfo.text}` : "—"}
          </strong>
        </li>
      </ul>
    </div>
  );
}

// Daily-series options for the comparison chart.
const COMPARE_METRICS = [
  { key: "temperature_2m_max", label: "High temp", convert: true, suffix: "°" },
  { key: "precipitation_probability_max", label: "Rain chance", suffix: "%" },
  { key: "wind_speed_10m_max", label: "Wind", suffix: " km/h" },
  { key: "uv_index_max", label: "UV", suffix: "" },
];

export default function Compare() {
  const toast = useToast();
  const unit = useUnit();
  const [slotA, setSlotA] = useState(null);
  const [slotB, setSlotB] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [metricKey, setMetricKey] = useState("temperature_2m_max");

  const pick = useCallback(
    async (city, side) => {
      const setter = side === "A" ? setSlotA : setSlotB;
      try {
        const slot = await loadCity(city);
        setter(slot);
        toast.success(`${city.name} added to the comparison.`, "City updated");
      } catch (err) {
        toast.error(err.message, "Could not load city");
      }
    },
    [toast]
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const [a, b] = await Promise.all([loadCity(CITY_A), loadCity(CITY_B)]);
      setSlotA(a);
      setSlotB(b);
    } catch (err) {
      toast.error(err.message, "Could not load the comparison");
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const ready = slotA && slotB;
  const metric = COMPARE_METRICS.find((m) => m.key === metricKey) ?? COMPARE_METRICS[0];
  const series = (slot) => {
    const arr = slot.forecast.daily[metric.key] ?? [];
    return metric.convert ? arr.map(unit.conv) : arr;
  };
  const fmt = (v) => `${Math.round(v)}${metric.suffix}`;

  return (
    <div className="compare">
      <div className="page-head">
        <div>
          <h1 className="page-title">Compare cities</h1>
          <p className="page-sub">
            Put two cities side by side — live conditions, air quality, and the
            week's temperature trend, all from Open-Meteo.
          </p>
        </div>
      </div>

      <div className="compare-pickers">
        <div className="picker">
          <label>City A</label>
          <SearchBox compact placeholder="Pick a city…" onSelect={(c) => pick(c, "A")} />
        </div>
        <span className="vs-badge" aria-hidden="true">vs</span>
        <div className="picker">
          <label>City B</label>
          <SearchBox compact placeholder="Pick a city…" onSelect={(c) => pick(c, "B")} />
        </div>
      </div>
      <p className="compare-hint">
        Search above to swap in any two cities — Manila and Singapore are just
        the starting pair.
      </p>

      {loading && (
        <div className="skeleton-wrap" aria-hidden="true">
          <div className="sk-compare">
            <div className="card sk-col sk-shimmer" />
            <div className="card sk-col sk-shimmer" />
          </div>
          <div className="card sk-panel sk-shimmer" />
        </div>
      )}

      {!loading && failed && (
        <div className="empty-block card reveal">
          <h2>Comparison unavailable</h2>
          <p>Neither city could be loaded. Check your connection and try again.</p>
          <button className="btn-primary" onClick={loadInitial}>
            Retry
          </button>
        </div>
      )}

      {!loading && ready && (
        <>
          <div className="compare-grid">
            <CityColumn slot={slotA} accent="a" delay={0} />
            <CityColumn slot={slotB} accent="b" delay={1} />
          </div>

          <section className="card panel reveal" style={{ "--i": 2 }}>
            <div className="panel-head">
              <h3>Daily {metric.label.toLowerCase()} — next 7 days</h3>
              <div className="metric-tabs" role="tablist" aria-label="Comparison metric">
                {COMPARE_METRICS.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    role="tab"
                    aria-selected={m.key === metricKey}
                    className={`metric-tab${m.key === metricKey ? " on" : ""}`}
                    onClick={() => setMetricKey(m.key)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <CompareChart
              days={slotA.forecast.daily.time}
              seriesA={series(slotA)}
              seriesB={series(slotB)}
              nameA={slotA.city.name}
              nameB={slotB.city.name}
              fmt={fmt}
            />
          </section>
        </>
      )}
    </div>
  );
}