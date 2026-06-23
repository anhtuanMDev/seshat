import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "functions/**/*.test.{ts,tsx}"],
    server: {
      deps: {
        inline: ["@mui/material", "@mui/icons-material", "react-transition-group"],
      },
    },
  },
});
