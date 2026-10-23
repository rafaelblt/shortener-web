import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
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
});
