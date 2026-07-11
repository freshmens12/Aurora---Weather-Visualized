import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["aurora.svg"],
      manifest: {
        name: "Aurora — Weather Visualized",
        short_name: "Aurora",
        description:
          "Live weather in color — forecasts, charts, and dark mode, beautifully visualized.",
        theme_color: "#6366f1",
        background_color: "#f5f6fd",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/aurora.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "/aurora.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // App shell is precached; live weather always needs the network.
        navigateFallback: "/index.html",
      },
    }),
  ],
  server: {
    port: 5173,
  },
});