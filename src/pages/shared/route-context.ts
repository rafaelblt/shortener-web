import { createContext } from "react-router";

import type { User } from "@/domain/user";
import type { Services } from "@/services/services";

/** The services, which app/ gives every loader and action. */
export const servicesContext = createContext<Services>();

/**
 * Whether the services are the simulation, which lives in the tab, so that leaving the app, or
 * loading it again, loses it. app/ sets it.
 */
export const simulatedContext = createContext<boolean>();

/** The signed-in user, which the routes for signed-in users set before their loaders run. */
export const signedInUserContext = createContext<User>();
