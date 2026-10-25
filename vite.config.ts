import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Where npm run dev:real finds the server of the app, which npm run server starts.
const SERVER = "http://localhost:3000";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  // Each mode builds into a directory of its own, where the server finds it, so that building one
  // never replaces the other. See docs/architecture/server.md#settings
  build: { outDir: mode === "simulation" ? "dist/simulation" : "dist/app" },
  // The app that reaches the server asks it at its own address, so the server of development
  // passes those requests on. The simulation asks nothing.
  server: { proxy: { "/api": SERVER } },
  test: {
    // Dates are formatted in the local time zone, so the tests fix it.
    env: { TZ: "UTC" },
    restoreMocks: true,
    projects: [
      {
        extends: true,
        test: {
          name: "app",
          environment: "jsdom",
          setupFiles: ["tests/setup.ts"],
          include: ["src/**/*.test.{ts,tsx}", "tests/flows/**/*.test.tsx", "tests/docs.test.ts"],
        },
      },
      {
        extends: true,
        test: { name: "server", environment: "node", include: ["server/**/*.test.ts"] },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["src/**", "server/**"],
      exclude: ["**/*.test.{ts,tsx}", "src/app/main.tsx", "server/main.ts"],
      // Raised as coverage grows, never lowered. See CONTRIBUTING.md#checks
      thresholds: { lines: 100, functions: 100, statements: 99, branches: 90 },
    },
  },
}));
