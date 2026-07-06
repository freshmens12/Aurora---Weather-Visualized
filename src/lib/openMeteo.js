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

// Browser geolocation → a city-shaped object. Reverse-geocodes the name via
// BigDataCloud's free client API (no key); falls back to "My location".
export function locateMe() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const base = {
          id: `geo-${coords.latitude.toFixed(3)}-${coords.longitude.toFixed(3)}`,
          name: "My location",
          region: "",
          country: "",
          latitude: coords.latitude,
          longitude: coords.longitude,
        };
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`
          );
          if (res.ok) {
            const geo = await res.json();
            resolve({
              ...base,
              name: geo.city || geo.locality || base.name,
              region: geo.principalSubdivision ?? "",
              country: geo.countryName ?? "",
            });
            return;
          }
        } catch {
          // name lookup is best-effort; coordinates are what matter
        }
        resolve(base);
      },
      (err) => {
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? "Location permission was denied. You can still search for a city."
              : "Could not determine your location."
          )
        );
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  });
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
