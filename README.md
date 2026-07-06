# Aurora 🌈 — Weather Visualized

**Live weather in color.** Aurora turns live forecast data into something
beautiful: animated charts, hand-drawn SVG weather icons, a sunrise-to-sunset
arc, and a polished light/dark theme — powered by the free public
[Open-Meteo](https://open-meteo.com/) API, no API key required.

> 🔗 **Live demo:** _add your deployed URL here_

## ✨ Features

### Today
- 📍 **Use my location** — one tap to see the weather right where you are
- 🔎 **Search any city worldwide** with autocomplete, plus **recent-city chips**
  that remember your last picks
- 🌡️ Animated hero card with a **count-up temperature**, weather-reactive
  effects (falling rain, drifting snow, lightning flashes), and a background
  mood that shifts with **dawn, day, dusk, and night**
- 📈 **24-hour temperature curve** (custom SVG) that draws itself in, with rain-chance
  bars, a hover crosshair, and tooltips
- 🌅 **Sunrise → sunset arc** showing the sun's live position across the sky
- 📅 **7-day outlook** with per-day icons, highs/lows, and rain probability

### Compare
- 🆚 Any **two cities side by side** — live conditions, air quality
  (Open-Meteo Air Quality API), and a 7-day high-temperature trend chart

### Everywhere
- 🌗 **Light / dark mode** with a smooth animated toggle (remembers your choice,
  follows your OS preference)
- 🌡️ **°C / °F switch** applied across every temperature and chart
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
