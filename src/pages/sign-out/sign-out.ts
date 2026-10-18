import { redirect } from "react-router";
import type { ActionFunctionArgs } from "react-router";

import { withNotice } from "../shared/notices";
import { servicesContext } from "../shared/route-context";

/** The route of the forms that sign out, which has no page. */
export async function action({ context }: ActionFunctionArgs): Promise<never> {
  await context.get(servicesContext).auth.signOut();
  throw redirect(withNotice("/sign-in", "signed-out"));
}

/** Opening the address of the route, rather than posting a form to it, leads to the links. */
export function loader(): never {
  throw redirect("/");
}
