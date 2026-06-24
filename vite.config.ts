import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
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
