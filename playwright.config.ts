import { defineConfig, devices } from "@playwright/test";

const port = 4173;

// The tests run against a fresh build of the simulation, which needs no back end, served as its
// demo is deployed: by the server of the app, with SIMULATION=true.
export default defineConfig({
  testDir: "tests/e2e",
  forbidOnly: true,
  reporter: "list",
  use: { baseURL: `http://localhost:${port}`, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build:simulation && npm run start",
    env: { SIMULATION: "true", PORT: String(port) },
    port,
    reuseExistingServer: false,
  },
});
