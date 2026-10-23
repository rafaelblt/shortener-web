import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

import { createApp } from "./app.ts";
import { serve } from "./node-server.ts";
import { SettingsError, settingsFromEnvironment } from "./settings.ts";

try {
  const settings = settingsFromEnvironment(process.env);
  const app = createApp({
    settings,
    staticDirectory: fileURLToPath(new URL("../dist", import.meta.url)),
    fetch,
    now: Date.now,
    newId: randomUUID,
  });
  serve(app).listen(settings.port, () => {
    console.log(`The server answers on port ${settings.port}`);
  });
} catch (error) {
  if (!(error instanceof SettingsError)) throw error;
  console.error(`The server can't start: ${error.message}`);
  process.exitCode = 1;
}
