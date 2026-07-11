import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SearchBox from "../components/SearchBox.jsx";
import WeatherIcon from "../components/WeatherIcon.jsx";
import HourlyChart from "../components/HourlyChart.jsx";
import CountUp from "../components/CountUp.jsx";
import SunArc from "../components/SunArc.jsx";
import HeroFx from "../components/HeroFx.jsx";
import WorldStrip from "../components/WorldStrip.jsx";
import { fetchForecast, upcomingHours, locateMe, yesterdayDelta } from "../lib/openMeteo.js";
import { describeWmo, windDirectionLabel, uvLabel, weatherAlert } from "../lib/wmo.js";
import { getRecentCities, rememberCity } from "../lib/recentCities.js";
import { useToast } from "../context/ToastContext.jsx";
import { useUnit } from "../context/UnitContext.jsx";

const DEFAULT_CITY = {
  id: "manila-ph",
  name: "Manila",
  region: "Metro Manila",
  country: "Philippines",
  latitude: 14.5995,
  longitude: 120.9842,
};

const DAY_FMT = new Intl.DateTimeFormat("en", { weekday: "short" });

// Hourly chart tabs. `convert` marks values that follow the °C/°F setting.
const METRICS = [
  { key: "temp", label: "Temperature", getValue: (h) => h.temp, convert: true, suffix: "°" },
  { key: "humidity", label: "Humidity", getValue: (h) => h.humidity, suffix: "%" },
  { key: "wind", label: "Wind", getValue: (h) => h.wind, suffix: " km/h" },
  { key: "uv", label: "UV", getValue: (h) => h.uv, suffix: "" },
];

function dayName(iso, index) {
  if (index === 0) return "Today";
  return DAY_FMT.format(new Date(`${iso}T12:00:00`));
}

function timeOnly(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
}

// Time-of-day mood for the hero: dawn/dusk near sunrise/sunset, else day/night.
function heroMood(nowIso, sunriseIso, sunsetIso) {
  const now = new Date(nowIso).getTime();
  const rise = new Date(sunriseIso).getTime();
  const set = new Date(sunsetIso).getTime();
  const window = 75 * 60 * 1000;
  if (Math.abs(now - rise) <= window) return "dawn";
  if (Math.abs(now - set) <= window) return "dusk";
  return now > rise && now < set ? "day" : "night";
}

// Restore a shared city from ?city=&lat=&lon= URL params.
function cityFromParams(sp) {
  const lat = Number.parseFloat(sp.get("lat"));
  const lon = Number.parseFloat(sp.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return {
    id: `url-${lat.toFixed(3)}-${lon.toFixed(3)}`,
    name: sp.get("city") || "Shared location",
    region: "",
    country: sp.get("country") || "",
    latitude: lat,
    longitude: lon,
  };
}

function TodaySkeleton() {
  return (
    <div className="skeleton-wrap" aria-hidden="true">
      <div className="card sk-hero sk-shimmer" />
      <div className="card sk-panel sk-shimmer" />
      <div className="sk-week">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="card sk-day sk-shimmer" />
        ))}
      </div>
    </div>
  );
}

export default function Today() {
  const toast = useToast();
  const unit = useUnit();
  const [searchParams, setSearchParams] = useSearchParams();
  const [city, setCity] = useState(() => cityFromParams(searchParams) ?? DEFAULT_CITY);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [recent, setRecent] = useState(getRecentCities);
  const [metricKey, setMetricKey] = useState("temp");
  const abortRef = useRef(null);

  const load = useCallback(
    async (target) => {
      abortRef.current?.abort(); // drop any in-flight request for an older city
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      try {
        const data = await fetchForecast(target, ctrl.signal);
        setForecast(data);
        setLoading(false);
      } catch (err) {
        if (err.name === "AbortError") return; // superseded — keep the spinner
        toast.error(err.message, "Forecast unavailable");
        setForecast(null);
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    load(city);
  }, [city, load]);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Keep the URL shareable: /today?city=Tokyo&lat=35.68&lon=139.69
  useEffect(() => {
    if (city.id === DEFAULT_CITY.id) {
      setSearchParams({}, { replace: true });
      return;
    }
    const params = { city: city.name, lat: String(city.latitude), lon: String(city.longitude) };
    if (city.country) params.country = city.country;
    setSearchParams(params, { replace: true });
  }, [city, setSearchParams]);

  const current = forecast?.current;
  const daily = forecast?.daily;
  const wmo = current ? describeWmo(current.weather_code) : null;
  const night = current ? current.is_day === 0 : false;
  const hours = forecast ? upcomingHours(forecast, 24) : [];
  const alert = forecast ? weatherAlert(hours, daily?.uv_index_max?.[0]) : null;
  const delta = forecast ? yesterdayDelta(forecast) : null;
  const metric = METRICS.find((m) => m.key === metricKey) ?? METRICS[0];

  // Values for the active chart tab (temperature respects °C/°F).
  const chartValue = metric.convert ? (h) => unit.conv(metric.getValue(h) ?? 0) : metric.getValue;
  const chartFmt = (v) => `${Math.round(v)}${metric.suffix}`;

  // Reflect the live temperature in the browser tab.
  useEffect(() => {
    if (current && wmo) {
      document.title = `${unit.temp(current.temperature_2m)}${unit.symbol} ${city.name} · Aurora`;
    } else {
      document.title = "Aurora · Live Weather in Color";
    }
    return () => {
      document.title = "Aurora · Live Weather in Color";
    };
  }, [current, wmo, city.name, unit]);

  const handleSelect = (selected) => {
    setCity(selected);
    setRecent(rememberCity(selected));
    toast.info(
      `Showing weather for ${selected.name}${selected.country ? `, ${selected.country}` : ""}.`,
      "Location updated"
    );
  };

  const handleLocate = async () => {
    setLocating(true);
    try {
      const here = await locateMe();
      setCity(here);
      setRecent(rememberCity(here));
      toast.success(`Showing weather for ${here.name}.`, "Location found");
    } catch (err) {
      toast.warning(err.message, "Location unavailable");
    } finally {
      setLocating(false);
    }
  };

  // "N° warmer/cooler than yesterday" in the active unit (delta scales, not offsets).
  const deltaLabel = (() => {
    if (delta == null) return null;
    const d = unit.isF ? delta * 1.8 : delta;
    if (Math.abs(d) < 1) return "About the same as yesterday";
    return `${Math.abs(Math.round(d))}° ${d > 0 ? "warmer" : "cooler"} than yesterday`;
  })();

  return (
    <div className="today">
      <div className="page-head">
        <div>
          <h1 className="page-title">Today's weather</h1>
          <p className="page-sub">
            Live conditions, the next 24 hours, and the week ahead.
          </p>
        </div>
        <div className="search-area">
          <div className="search-row">
            <SearchBox onSelect={handleSelect} />
            <button
              type="button"
              className="geo-btn"
              onClick={handleLocate}
              disabled={locating}
              title="Use my location"
              aria-label="Use my location"
            >
              {locating ? (
                <span className="btn-spinner geo-spinner" aria-hidden="true" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="8" />
                </svg>
              )}
            </button>
          </div>
          {recent.length > 0 && (
            <div className="recent-chips" aria-label="Recent cities">
              {recent.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`chip${c.id === city.id ? " on" : ""}`}
                  onClick={() => handleSelect(c)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading && <TodaySkeleton />}

      {!loading && !forecast && (
        <div className="empty-block card reveal">
          <h2>No forecast to show</h2>
          <p>The forecast could not be loaded. Try searching for another city.</p>
          <button className="btn-primary" onClick={() => load(city)}>
            Retry {city.name}
          </button>
        </div>
      )}

      {!loading && forecast && (
        <>
          {alert && (
            <div className={`alert-banner alert-${alert.tone} reveal`} role="alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" aria-hidden="true">
                <path d="M12 3.6 21.4 20H2.6L12 3.6Z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 10v4" strokeLinecap="round" />
                <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
              </svg>
              <span>{alert.text}</span>
            </div>
          )}

          <section
            className={`hero-card card tint-${wmo.tint} mood-${heroMood(current.time, daily.sunrise[0], daily.sunset[0])} reveal`}
            style={{ "--i": 0 }}
          >
            <HeroFx tint={wmo.tint} />
            <div className="hero-main">
              <div className="hero-loc">
                <span className="eyebrow">Now</span>
                <h2>
                  {city.name}
                  {city.country ? <span>, {city.country}</span> : null}
                </h2>
                <p>
                  {new Date().toLocaleDateString("en", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="hero-temp">
                <WeatherIcon variant={wmo.icon} night={night} size={112} className="hero-icon" lively />
                <div>
                  <span className="big-temp">
                    <CountUp value={unit.temp(current.temperature_2m)} />°
                  </span>
                  <p className="cond-label">{wmo.label}</p>
                  <p className="feels">
                    Feels like {unit.temp(current.apparent_temperature)}°
                  </p>
                  {deltaLabel && <p className="delta-note">{deltaLabel}</p>}
                </div>
              </div>
            </div>

            <div className="hero-stats">
              <div className="stat">
                <span className="stat-label">Humidity</span>
                <span className="stat-value">{current.relative_humidity_2m}%</span>
              </div>
              <div className="stat">
                <span className="stat-label">Wind</span>
                <span className="stat-value">
                  {Math.round(current.wind_speed_10m)} km/h{" "}
                  <small>
                    <svg
                      className="wind-arrow"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      style={{ transform: `rotate(${(current.wind_direction_10m + 180) % 360}deg)` }}
                      aria-hidden="true"
                    >
                      <path d="M12 19V5M12 5l-5 5M12 5l5 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {windDirectionLabel(current.wind_direction_10m)}
                  </small>
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Pressure</span>
                <span className="stat-value">
                  {Math.round(current.surface_pressure)} <small>hPa</small>
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">UV index</span>
                <span className="stat-value">
                  {Math.round(daily.uv_index_max[0])}{" "}
                  <small>{uvLabel(daily.uv_index_max[0])}</small>
                </span>
              </div>
            </div>

            <div className="hero-sun">
              <SunArc
                sunrise={daily.sunrise[0]}
                sunset={daily.sunset[0]}
                now={current.time}
              />
            </div>
          </section>

          <section className="card panel reveal" style={{ "--i": 1 }}>
            <div className="panel-head">
              <h3>Next 24 hours</h3>
              <div className="metric-tabs" role="tablist" aria-label="Chart metric">
                {METRICS.map((m) => (
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
            <HourlyChart
              hours={hours}
              getValue={chartValue}
              fmt={chartFmt}
              showPrecip={metric.key === "temp"}
              ariaLabel={`Hourly ${metric.label.toLowerCase()} for the next 24 hours`}
            />
          </section>

          <section className="card panel reveal" style={{ "--i": 2 }}>
            <div className="panel-head">
              <h3>7-day outlook</h3>
            </div>
            <div className="week-row">
              {daily.time.map((d, i) => {
                const dw = describeWmo(daily.weather_code[i]);
                return (
                  <div
                    className={`day-card${i === 0 ? " today" : ""}`}
                    key={d}
                    style={{ "--d": i }}
                  >
                    <span className="day-name">{dayName(d, i)}</span>
                    <WeatherIcon variant={dw.icon} size={44} />
                    <span className="day-cond">{dw.label}</span>
                    <div className="day-temps">
                      <strong>{unit.temp(daily.temperature_2m_max[i])}°</strong>
                      <span>{unit.temp(daily.temperature_2m_min[i])}°</span>
                    </div>
                    <span className="day-rain">
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">
                        <path d="M12 2.7C9 7 5.8 10.6 5.8 14.2a6.2 6.2 0 0 0 12.4 0C18.2 10.6 15 7 12 2.7Z" />
                      </svg>
                      {daily.precipitation_probability_max?.[i] ?? 0}%
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <WorldStrip onPick={handleSelect} />
        </>
      )}
    </div>
  );
}
