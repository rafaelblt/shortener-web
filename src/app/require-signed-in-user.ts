import { redirect } from "react-router";
import type { MiddlewareFunction } from "react-router";

import { servicesContext, signedInUserContext } from "@/pages/shared/route-context";

/**
 * Sends whoever isn't signed in to the sign-in page, which brings them back afterwards. Runs before
 * the loaders and actions of the routes for signed-in users, which read the user it sets.
 */
export const requireSignedInUser: MiddlewareFunction = async ({ request, context }) => {
  const user = await context.get(servicesContext).auth.currentUser();
  if (!user) {
    const { pathname, search } = new URL(request.url);
    throw redirect(`/sign-in?next=${encodeURIComponent(pathname + search)}`);
  }
  context.set(signedInUserContext, user);
};
