import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    // Dates are formatted in the local time zone, so the tests fix it.
    env: { TZ: "UTC" },
    setupFiles: ["tests/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "tests/flows/**/*.test.tsx", "tests/docs.test.ts"],
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: ["src/**"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/app/main.tsx"],
    },
  },
});
