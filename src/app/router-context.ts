import { RouterContextProvider } from "react-router";

import { servicesContext, simulatedContext } from "@/pages/shared/route-context";
import type { Services } from "@/services/services";

/** Gives the services, and whether they are the simulation, to every loader, action and middleware. */
export function contextWith(
  services: Services,
  { simulated }: { simulated: boolean },
): () => RouterContextProvider {
  return () => {
    const context = new RouterContextProvider();
    context.set(servicesContext, services);
    context.set(simulatedContext, simulated);
    return context;
  };
}
