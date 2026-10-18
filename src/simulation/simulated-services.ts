import type { Services } from "@/services/services";

import { addDemoData } from "./demo-data";
import { NO_LATENCY } from "./latency";
import { randomId, randomSlug } from "./random";
import { SimulatedAuthService } from "./simulated-auth-service";
import { SimulatedShortUrlService } from "./simulated-short-url-service";
import type { SimulationOptions } from "./store";
import { SimulationStore } from "./store";

export interface SimulationSettings extends Partial<SimulationOptions> {
  withDemoData?: boolean;
}

/** Services that answer as go-auth and the shortener would, from memory. */
export function createSimulatedServices(settings: SimulationSettings = {}): Services {
  const { withDemoData = false, ...overrides } = settings;
  const options: SimulationOptions = {
    latency: NO_LATENCY,
    now: () => new Date(),
    newId: randomId,
    newSlug: randomSlug,
    ...overrides,
  };
  const store = new SimulationStore();
  if (withDemoData) addDemoData(store, options);
  return {
    auth: new SimulatedAuthService(store, options),
    shortUrls: new SimulatedShortUrlService(store, options),
  };
}
