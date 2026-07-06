// Thin client for the public Open-Meteo APIs (no API key required).
// https://open-meteo.com/

async function getJson(url, label) {
  let res;
  try {
    res = await fetch(url);
  } catch {
    throw new Error(`Network error while loading ${label}. Are you online?`);
  }
  if (!res.ok) {
    throw new Error(`Open-Meteo returned ${res.status} while loading ${label}.`);
  }
  return res.json();
}

export async function searchCities(query, count = 6) {
  const url =
    "https://geocoding-api.open-meteo.com/v1/search?name=" +
    encodeURIComponent(query) +
    `&count=${count}&language=en&format=json`;
  const data = await getJson(url, "city search results");
  return (data.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    region: r.admin1 ?? "",
    country: r.country ?? "",
    countryCode: r.country_code ?? "",
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone ?? "auto",
  }));
}

export async function fetchForecast(city) {
  const params = new URLSearchParams({
    latitude: city.latitude,
    longitude: city.longitude,
    timezone: "auto",
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "precipitation",
      "weather_code",
      "surface_pressure",
      "wind_speed_10m",
      "wind_direction_10m",
    ].join(","),
    hourly: [
      "temperature_2m",
      "precipitation_probability",
      "weather_code",
      "is_day",
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "sunrise",
      "sunset",
      "uv_index_max",
      "precipitation_probability_max",
      "wind_speed_10m_max",
    ].join(","),
    forecast_days: "7",
  });
  return getJson(
    `https://api.open-meteo.com/v1/forecast?${params}`,
    `the forecast for ${city.name}`
  );
}

export async function fetchAirQuality(city) {
  const params = new URLSearchParams({
    latitude: city.latitude,
    longitude: city.longitude,
    timezone: "auto",
    current: ["european_aqi", "pm2_5", "pm10", "uv_index"].join(","),
  });
  return getJson(
    `https://air-quality-api.open-meteo.com/v1/air-quality?${params}`,
    `air quality for ${city.name}`
  );
}

// Slice the hourly series to the next `hours` hours starting from "now"
// in the city's local timezone (Open-Meteo returns local ISO stamps).
export function upcomingHours(forecast, hours = 24) {
  const { time, temperature_2m, precipitation_probability, weather_code, is_day } =
    forecast.hourly;
  const nowIso = forecast.current.time; // e.g. "2026-07-05T14:00"
  let start = time.findIndex((t) => t >= nowIso);
  if (start === -1) start = 0;
  const end = Math.min(start + hours, time.length);
  const out = [];
  for (let i = start; i < end; i++) {
    out.push({
      time: time[i],
      temp: temperature_2m[i],
      precip: precipitation_probability?.[i] ?? 0,
      code: weather_code[i],
      isDay: is_day?.[i] === 1,
    });
  }
  return out;
}
