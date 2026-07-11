// WMO weather interpretation codes → human label + icon family + scene tint.
// https://open-meteo.com/en/docs (weather_code table)

const TABLE = [
  { codes: [0], label: "Clear sky", icon: "sun", tint: "clear" },
  { codes: [1], label: "Mainly clear", icon: "sun", tint: "clear" },
  { codes: [2], label: "Partly cloudy", icon: "partly", tint: "cloudy" },
  { codes: [3], label: "Overcast", icon: "cloud", tint: "cloudy" },
  { codes: [45, 48], label: "Foggy", icon: "fog", tint: "cloudy" },
  { codes: [51, 53, 55], label: "Drizzle", icon: "drizzle", tint: "rain" },
  { codes: [56, 57], label: "Freezing drizzle", icon: "drizzle", tint: "rain" },
  { codes: [61, 63, 65], label: "Rain", icon: "rain", tint: "rain" },
  { codes: [66, 67], label: "Freezing rain", icon: "rain", tint: "rain" },
  { codes: [71, 73, 75, 77], label: "Snowfall", icon: "snow", tint: "snow" },
  { codes: [80, 81, 82], label: "Rain showers", icon: "rain", tint: "rain" },
  { codes: [85, 86], label: "Snow showers", icon: "snow", tint: "snow" },
  { codes: [95], label: "Thunderstorm", icon: "storm", tint: "storm" },
  { codes: [96, 99], label: "Thunderstorm with hail", icon: "storm", tint: "storm" },
];

export function describeWmo(code) {
  const row = TABLE.find((r) => r.codes.includes(code));
  return row ?? { label: "Unknown conditions", icon: "cloud", tint: "cloudy" };
}

export function windDirectionLabel(deg) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
}

export function uvLabel(uv) {
  if (uv == null) return "—";
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very high";
  return "Extreme";
}

// Scan the next 24 hours + today's UV for conditions worth a heads-up.
// Returns { tone: "warn" | "bad", text } or null when the sky is friendly.
export function weatherAlert(hours, uvMax) {
  const storm = hours.find((h) => h.code >= 95);
  if (storm) {
    const at = new Date(storm.time).toLocaleTimeString("en", { hour: "numeric" });
    return {
      tone: "bad",
      text: `Thunderstorms expected around ${at} — plan indoor time.`,
    };
  }
  const freezing = hours.find((h) => [56, 57, 66, 67].includes(h.code));
  if (freezing) {
    return { tone: "bad", text: "Freezing rain in the next 24 hours — icy surfaces likely." };
  }
  const heavySnow = hours.find((h) => [75, 86].includes(h.code));
  if (heavySnow) {
    return { tone: "warn", text: "Heavy snowfall expected in the next 24 hours." };
  }
  if (uvMax != null && uvMax >= 11) {
    return { tone: "bad", text: `Extreme UV today (${Math.round(uvMax)}) — avoid midday sun.` };
  }
  if (uvMax != null && uvMax >= 8) {
    return { tone: "warn", text: `Very high UV today (${Math.round(uvMax)}) — sunscreen strongly advised.` };
  }
  const soaked = hours.filter((h) => h.precip >= 80).length;
  if (soaked >= 6) {
    return { tone: "warn", text: "Persistent heavy rain likely through the day — bring an umbrella." };
  }
  return null;
}

export function aqiLabel(aqi) {
  if (aqi == null) return { text: "—", tone: "neutral" };
  if (aqi <= 20) return { text: "Good", tone: "good" };
  if (aqi <= 40) return { text: "Fair", tone: "good" };
  if (aqi <= 60) return { text: "Moderate", tone: "warn" };
  if (aqi <= 80) return { text: "Poor", tone: "bad" };
  if (aqi <= 100) return { text: "Very poor", tone: "bad" };
  return { text: "Extremely poor", tone: "bad" };
}
