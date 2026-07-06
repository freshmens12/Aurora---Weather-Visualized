import { useCallback, useEffect, useState } from "react";
import SearchBox from "../components/SearchBox.jsx";
import WeatherIcon from "../components/WeatherIcon.jsx";
import HourlyChart from "../components/HourlyChart.jsx";
import CountUp from "../components/CountUp.jsx";
import SunArc from "../components/SunArc.jsx";
import HeroFx from "../components/HeroFx.jsx";
import { fetchForecast, upcomingHours } from "../lib/openMeteo.js";
import { describeWmo, windDirectionLabel, uvLabel } from "../lib/wmo.js";
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

function dayName(iso, index) {
  if (index === 0) return "Today";
  return DAY_FMT.format(new Date(`${iso}T12:00:00`));
}

function timeOnly(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
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
  const [city, setCity] = useState(DEFAULT_CITY);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (target) => {
      setLoading(true);
      try {
        const data = await fetchForecast(target);
        setForecast(data);
      } catch (err) {
        toast.error(err.message, "Forecast unavailable");
        setForecast(null);
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    load(city);
  }, [city, load]);

  const current = forecast?.current;
  const daily = forecast?.daily;
  const wmo = current ? describeWmo(current.weather_code) : null;
  const night = current ? current.is_day === 0 : false;
  const hours = forecast ? upcomingHours(forecast, 24) : [];

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
    toast.info(
      `Showing weather for ${selected.name}, ${selected.country}.`,
      "Location updated"
    );
  };

  return (
    <div className="today">
      <div className="page-head">
        <div>
          <h1 className="page-title">Today's weather</h1>
          <p className="page-sub">
            Live conditions, the next 24 hours, and the week ahead.
          </p>
        </div>
        <SearchBox onSelect={handleSelect} />
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
          <section
            className={`hero-card card tint-${wmo.tint} reveal`}
            style={{ "--i": 0 }}
          >
            <HeroFx tint={wmo.tint} night={night} />
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
                  <small>{windDirectionLabel(current.wind_direction_10m)}</small>
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
              <span className="panel-note">Hover the curve for details</span>
            </div>
            <HourlyChart hours={hours} unit={unit.symbol} convert={unit.temp} />
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
        </>
      )}
    </div>
  );
}
