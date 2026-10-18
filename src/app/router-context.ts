import { RouterContextProvider } from "react-router";

import { servicesContext } from "@/pages/shared/route-context";
import type { Services } from "@/services/services";

/** Gives the services to every loader, action and middleware. */
export function contextWith(services: Services): () => RouterContextProvider {
  return () => {
    const context = new RouterContextProvider();
    context.set(servicesContext, services);
    return context;
  };
}
