import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

import { createApp, createSimulationApp } from "./app.ts";
import { serve } from "./node-server.ts";
import { SettingsError, settingsFromEnvironment } from "./settings.ts";

// Where npm run build and npm run build:simulation write their builds. See vite.config.ts
const APP_BUILD = fileURLToPath(new URL("../dist/app", import.meta.url));
const SIMULATION_BUILD = fileURLToPath(new URL("../dist/simulation", import.meta.url));

try {
  const { port, backEnds } = settingsFromEnvironment(process.env);
  const app =
    backEnds === null
      ? createSimulationApp(SIMULATION_BUILD)
      : createApp({
          settings: backEnds,
          staticDirectory: APP_BUILD,
          fetch,
          now: Date.now,
          newId: randomUUID,
        });
  serve(app).listen(port, () => {
    const on = backEnds === null ? "the simulation" : "the back ends";
    console.log(`The server answers on port ${port}, on ${on}`);
  });
} catch (error) {
  if (!(error instanceof SettingsError)) throw error;
  console.error(`The server can't start: ${error.message}`);
  process.exitCode = 1;
}
