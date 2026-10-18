import type { Credentials } from "@/services/auth-service";
import type { Result } from "@/services/result";
import type { Services } from "@/services/services";
import type { SimulationSettings } from "@/simulation/simulated-services";
import { createSimulatedServices } from "@/simulation/simulated-services";

export const NOW = new Date("2026-10-18T12:00:00Z");
/** The first slug the test services generate; the next ones are gen002, gen003… */
export const GENERATED_SLUG = "gen001";
export const ALICE: Credentials = { username: "alice", password: "correct-horse" };
export const BOB: Credentials = { username: "bob", password: "battery-staple" };

/** Simulated services with a fixed clock, and numbered IDs and generated slugs. */
export function createTestServices(settings: SimulationSettings = {}): Services {
  let lastId = 0;
  let lastSlug = 0;
  return createSimulatedServices({
    now: () => NOW,
    newId: () => `id-${String(++lastId)}`,
    newSlug: () => `gen${String(++lastSlug).padStart(3, "0")}`,
    ...settings,
  });
}

export async function registerAndSignIn(services: Services, credentials: Credentials) {
  unwrap(await services.auth.register(credentials));
  return unwrap(await services.auth.signIn(credentials));
}

/** The value of a result that the test expects to be ok. */
export function unwrap<Value>(result: Result<Value, unknown>): Value {
  if (!result.ok) throw new Error(`expected ok, got ${JSON.stringify(result.error)}`);
  return result.value;
}
