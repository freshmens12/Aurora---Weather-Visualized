# Aurora 🌈

**Live weather in color.** A clean, visual weather app built with React and
powered by the free public [Open-Meteo](https://open-meteo.com/) API — no API
key required.

## ✨ Features

- **Today** — live conditions for any city: current temperature, a smooth
  24-hour temperature chart (custom SVG with a hover crosshair + tooltip), and a
  7-day outlook. Search any city worldwide with autocomplete.
- **Compare** — put two cities side by side: live conditions, air quality
  (Open-Meteo Air Quality API), and a 7-day high-temperature trend chart.
- **Toasts** — friendly notifications for updates and errors.
- **Hand-drawn SVG weather icons** — no external icon assets.
- Fully responsive; light "aurora" theme with a sidebar layout.

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
- **Open-Meteo** Forecast, Geocoding & Air Quality APIs
- Hand-rolled CSS (light theme, Space Grotesk / Inter), custom SVG charts & icons

## 🗂 Structure

```
src/
  components/   Layout (sidebar), SearchBox, charts, weather icons
  pages/        Today, Compare, NotFound
  context/      Toast notifications
  lib/          Open-Meteo client + WMO weather-code helpers
  styles/       global.css
```

This is a frontend-only application — it talks directly to the public
Open-Meteo APIs, so an internet connection is required at runtime.