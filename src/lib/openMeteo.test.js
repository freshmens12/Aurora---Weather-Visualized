import { describe, it, expect } from "vitest";
import { upcomingHours, yesterdayDelta } from "./openMeteo.js";

// Build a fake forecast payload: 48 hourly slots (yesterday + today, as with
// past_days: 1) where "now" sits at index 24 + nowHour.
function makeForecast({ nowHour = 12, temps } = {}) {
  const time = [];
  for (const day of ["2026-07-10", "2026-07-11"]) {
    for (let h = 0; h < 24; h++) {
      time.push(`${day}T${String(h).padStart(2, "0")}:00`);
    }
  }
  const temperature_2m = temps ?? time.map((_, i) => 20 + (i % 24) * 0.5);
  return {
    current: {
      time: `2026-07-11T${String(nowHour).padStart(2, "0")}:00`,
      temperature_2m: temperature_2m[24 + nowHour],
    },
    hourly: {
      time,
      temperature_2m,
      precipitation_probability: time.map((_, i) => i % 100),
      weather_code: time.map(() => 1),
      is_day: time.map((_, i) => (i % 24 >= 6 && i % 24 < 18 ? 1 : 0)),
      relative_humidity_2m: time.map(() => 60),
      wind_speed_10m: time.map(() => 12),
      uv_index: time.map(() => 5),
    },
  };
}

describe("upcomingHours", () => {
  it("starts at the current hour and returns the requested count", () => {
    const fc = makeForecast({ nowHour: 12 });
    const hours = upcomingHours(fc, 12);
    expect(hours).toHaveLength(12);
    expect(hours[0].time).toBe("2026-07-11T12:00");
  });

  it("clamps at the end of the series", () => {
    const fc = makeForecast({ nowHour: 20 });
    const hours = upcomingHours(fc, 24);
    expect(hours).toHaveLength(4); // 20:00–23:00 is all that's left
  });

  it("exposes every metric per hour", () => {
    const [h] = upcomingHours(makeForecast(), 1);
    expect(h).toMatchObject({ humidity: 60, wind: 12, uv: 5 });
    expect(typeof h.temp).toBe("number");
    expect(typeof h.precip).toBe("number");
  });
});

describe("yesterdayDelta", () => {
  it("compares now against the same hour yesterday", () => {
    const temps = Array(48).fill(20);
    temps[12] = 20; // yesterday 12:00
    temps[36] = 25; // today 12:00
    const fc = makeForecast({ nowHour: 12, temps });
    fc.current.temperature_2m = 25;
    expect(yesterdayDelta(fc)).toBe(5);
  });

  it("returns null when yesterday is missing", () => {
    const fc = makeForecast({ nowHour: 12 });
    // strip yesterday: keep only today's 24 slots
    fc.hourly.time = fc.hourly.time.slice(24);
    fc.hourly.temperature_2m = fc.hourly.temperature_2m.slice(24);
    expect(yesterdayDelta(fc)).toBeNull();
  });
});