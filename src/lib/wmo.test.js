import { describe, it, expect } from "vitest";
import { describeWmo, windDirectionLabel, uvLabel, aqiLabel, weatherAlert } from "./wmo.js";

describe("describeWmo", () => {
  it("maps known codes to label, icon, and tint", () => {
    expect(describeWmo(0)).toEqual({ codes: [0], label: "Clear sky", icon: "sun", tint: "clear" });
    expect(describeWmo(95).icon).toBe("storm");
    expect(describeWmo(71).tint).toBe("snow");
  });

  it("falls back gracefully on unknown codes", () => {
    const unknown = describeWmo(1234);
    expect(unknown.label).toBe("Unknown conditions");
    expect(unknown.icon).toBe("cloud");
  });
});

describe("windDirectionLabel", () => {
  it("maps degrees to compass points", () => {
    expect(windDirectionLabel(0)).toBe("N");
    expect(windDirectionLabel(90)).toBe("E");
    expect(windDirectionLabel(180)).toBe("S");
    expect(windDirectionLabel(270)).toBe("W");
    expect(windDirectionLabel(45)).toBe("NE");
  });

  it("handles wraparound and negatives", () => {
    expect(windDirectionLabel(360)).toBe("N");
    expect(windDirectionLabel(-90)).toBe("W");
  });
});

describe("uvLabel", () => {
  it("bands UV values", () => {
    expect(uvLabel(1)).toBe("Low");
    expect(uvLabel(5)).toBe("Moderate");
    expect(uvLabel(7)).toBe("High");
    expect(uvLabel(9)).toBe("Very high");
    expect(uvLabel(12)).toBe("Extreme");
    expect(uvLabel(null)).toBe("—");
  });
});

describe("aqiLabel", () => {
  it("bands European AQI values with a tone", () => {
    expect(aqiLabel(10)).toEqual({ text: "Good", tone: "good" });
    expect(aqiLabel(50)).toEqual({ text: "Moderate", tone: "warn" });
    expect(aqiLabel(90)).toEqual({ text: "Very poor", tone: "bad" });
    expect(aqiLabel(null).text).toBe("—");
  });
});

describe("weatherAlert", () => {
  const calmHour = (t) => ({ time: t, code: 1, precip: 10 });

  it("returns null for friendly weather", () => {
    const hours = Array.from({ length: 24 }, (_, i) => calmHour(`2026-07-11T${String(i).padStart(2, "0")}:00`));
    expect(weatherAlert(hours, 4)).toBeNull();
  });

  it("flags thunderstorms as bad", () => {
    const hours = [calmHour("2026-07-11T10:00"), { time: "2026-07-11T15:00", code: 95, precip: 90 }];
    const alert = weatherAlert(hours, 4);
    expect(alert.tone).toBe("bad");
    expect(alert.text).toMatch(/Thunderstorms/);
  });

  it("flags extreme UV even on clear days", () => {
    const hours = [calmHour("2026-07-11T10:00")];
    expect(weatherAlert(hours, 11).tone).toBe("bad");
    expect(weatherAlert(hours, 8).tone).toBe("warn");
  });

  it("flags persistent heavy rain", () => {
    const hours = Array.from({ length: 8 }, (_, i) => ({
      time: `2026-07-11T${String(i).padStart(2, "0")}:00`,
      code: 61,
      precip: 85,
    }));
    expect(weatherAlert(hours, 3).text).toMatch(/umbrella/);
  });
});