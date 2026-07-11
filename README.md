# Aurora 🌈 — Weather Visualized

**Live weather in color.** Aurora turns live forecast data into something
beautiful: animated charts, hand-drawn SVG weather icons, a sunrise-to-sunset
arc, and a polished light/dark theme — powered by the free public
[Open-Meteo](https://open-meteo.com/) API, no API key required.

> 🔗 **Live demo:** _add your deployed URL here_

## 📸 Screenshots

<!-- Add screenshots to docs/screenshots/ and update the paths below -->
| Light | Dark |
|---|---|
| ![Today page, light theme](docs/screenshots/today-light.png) | ![Today page, dark theme](docs/screenshots/today-dark.png) |

## ✨ Features

### Today
- 📍 **Use my location** — one tap to see the weather right where you are
- 🔎 **Search any city worldwide** with autocomplete, plus **recent-city chips**
  that remember your last picks
- 🔗 **Shareable links** — the city lives in the URL, so a copied link opens
  the same forecast anywhere
- ⚠️ **Weather alerts** — a banner warns about incoming thunderstorms,
  freezing rain, heavy snow, persistent rain, and extreme UV
- 🌡️ Animated hero card with a **count-up temperature**, weather-reactive
  effects (falling rain, drifting snow, lightning flashes), a background
  mood that shifts with **dawn, day, dusk, and night**, and a
  **"warmer/cooler than yesterday"** comparison
- 📈 **24-hour chart with metric tabs** — temperature, humidity, wind, and UV
  on one self-drawing SVG curve, with rain-chance bars, a hover crosshair,
  and tooltips
- 🌅 **Sunrise → sunset arc** showing the sun's live position across the sky
- 📅 **7-day outlook** with per-day icons, highs/lows, and rain probability
- 🌏 **Right now, around the world** — live mini-cards for six global cities;
  tap one to explore it

### Compare
- 🆚 Any **two cities side by side** — live conditions, air quality
  (Open-Meteo Air Quality API), and a 7-day trend chart with
  **switchable metrics**: high temp, rain chance, wind, and UV

### Everywhere
- 🌗 **Light / dark mode** with a smooth animated toggle (remembers your choice,
  follows your OS preference)
- 🌡️ **°C / °F switch** applied across every temperature and chart
- 📲 **Installable PWA** — add it to your home screen like a native app
- 🖼️ **Hand-drawn SVG weather icons** with living micro-animations — no
  external icon assets
- ♿ Respects `prefers-reduced-motion`; keyboard-accessible search
- 📱 Fully responsive, from phones to widescreen

## 🚀 Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

### Production

```bash
npm run build
npm run preview
```

### Tests

```bash
npm test         # vitest — WMO helpers, hourly slicing, alert logic
```

## 🧱 Stack

- **React 18 + React Router 6 + Vite**
- **Open-Meteo** Forecast, Geocoding & Air Quality APIs (free, keyless)
- Hand-rolled CSS (design tokens for both themes, Space Grotesk / Inter),
  custom SVG charts & icons — **no UI or chart libraries**

## 🗂 Structure

```
src/
  components/   Layout, SearchBox, charts, weather icons, SunArc, toggles
  pages/        Today, Compare, NotFound
  context/      Theme, temperature unit, toast notifications
  lib/          Open-Meteo client, WMO code helpers, recent cities
  styles/       global.css (light + dark design tokens)
```

This is a frontend-only application — it talks directly to the public
Open-Meteo APIs, so an internet connection is required at runtime.

---

Developed by **Vincent Enimedez**
