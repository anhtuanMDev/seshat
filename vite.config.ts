import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { visualizer } from "rollup-plugin-visualizer";
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    cloudflare(),
    visualizer({
      open: true, // auto-opens the report after build
      filename: "stats.html",
      gzipSize: true,
      brotliSize: true,
      template: "treemap", // "treemap" | "sunburst" | "network"
    }),
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8788",
        changeOrigin: true,
      },
    },
  },
});
