import { createContext } from "react-router";

import type { User } from "@/domain/user";
import type { Services } from "@/services/services";

/** The services, which app/ gives every loader and action. */
export const servicesContext = createContext<Services>();

/** The signed-in user, which the routes for signed-in users set before their loaders run. */
export const signedInUserContext = createContext<User>();
