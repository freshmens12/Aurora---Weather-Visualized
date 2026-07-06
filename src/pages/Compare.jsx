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

export default function Compare() {
  const toast = useToast();
  const unit = useUnit();
  const [slotA, setSlotA] = useState(null);
  const [slotB, setSlotB] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [a, b] = await Promise.all([loadCity(CITY_A), loadCity(CITY_B)]);
        if (!alive) return;
        setSlotA(a);
        setSlotB(b);
      } catch (err) {
        if (alive) toast.error(err.message, "Could not load the comparison");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [toast]);

  const ready = slotA && slotB;

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

      {loading && (
        <div className="skeleton-wrap" aria-hidden="true">
          <div className="sk-compare">
            <div className="card sk-col sk-shimmer" />
            <div className="card sk-col sk-shimmer" />
          </div>
          <div className="card sk-panel sk-shimmer" />
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
              <h3>Daily high temperature — next 7 days</h3>
              <span className="panel-note">Hover to compare day by day</span>
            </div>
            <CompareChart
              days={slotA.forecast.daily.time}
              seriesA={slotA.forecast.daily.temperature_2m_max}
              seriesB={slotB.forecast.daily.temperature_2m_max}
              nameA={slotA.city.name}
              nameB={slotB.city.name}
              convert={unit.temp}
            />
          </section>
        </>
      )}
    </div>
  );
}