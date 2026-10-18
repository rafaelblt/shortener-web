import type { Credentials } from "@/services/auth-service";
import type { Result } from "@/services/result";
import type { Services } from "@/services/services";
import type { SimulationSettings } from "@/simulation/simulated-services";
import { createSimulatedServices } from "@/simulation/simulated-services";

export const NOW = new Date("2026-10-18T12:00:00Z");
export const GENERATED_SLUG = "Gen123";
export const ALICE: Credentials = { username: "alice", password: "correct-horse" };
export const BOB: Credentials = { username: "bob", password: "battery-staple" };

/** Simulated services with a fixed clock, numbered IDs and a known generated slug. */
export function createTestServices(settings: SimulationSettings = {}): Services {
  let lastId = 0;
  return createSimulatedServices({
    now: () => NOW,
    newId: () => `id-${String(++lastId)}`,
    newSlug: () => GENERATED_SLUG,
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
