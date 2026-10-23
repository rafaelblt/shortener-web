import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

import { contextWith } from "@/app/router-context";
import { routes } from "@/app/routes";
import { SimulationBanner } from "@/app/SimulationBanner";
import type { Services } from "@/services/services";

import { ALICE, createTestServices, registerAndSignIn } from "./simulation";

/**
 * Renders the whole app at the path, on the services, with no latency, as src/app/main.tsx does.
 * The app runs as the simulation does, unless `simulated` is false, as it runs on the server.
 */
export function renderApp(
  path: string,
  services: Services = createTestServices(),
  { simulated = true } = {},
) {
  const router = createMemoryRouter(routes, {
    initialEntries: [path],
    getContext: contextWith(services, { simulated }),
  });
  const user = userEvent.setup();
  render(
    <>
      {simulated && <SimulationBanner />}
      <RouterProvider router={router} />
    </>,
  );
  return { router, services, user };
}

/** Renders the app at the path with the user signed in. */
export async function renderSignedIn(
  path: string,
  { credentials = ALICE, services = createTestServices() } = {},
) {
  await registerAndSignIn(services, credentials);
  return renderApp(path, services);
}
