import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderApp } from "@tests/support/render-app";
import { createShortUrls } from "@tests/support/short-urls";
import { ALICE, createTestServices, registerAndSignIn, unwrap } from "@tests/support/simulation";

async function servicesWithLink(status: "active" | "deactivated") {
  const services = createTestServices();
  await registerAndSignIn(services, ALICE);
  const [shortUrl] = await createShortUrls(services, ["my-link"]);
  if (status === "deactivated") unwrap(await services.shortUrls.disable(shortUrl?.id ?? ""));
  await services.auth.signOut();
  return services;
}

describe("following a short link", () => {
  it("shows where it leads, and counts the resolution", async () => {
    const services = await servicesWithLink("active");
    renderApp("/s/my-link", services);

    expect(
      await screen.findByRole("heading", { name: "https://example.com/my-link" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continue" })).toHaveAttribute(
      "href",
      "https://example.com/my-link",
    );
    unwrap(await services.auth.signIn(ALICE));
    const { items } = await services.shortUrls.list({ limit: 1 });
    expect(items[0]?.resolutionCount).toBe(1);
  });

  it("goes straight where it leads, counting the resolution, outside the simulation", async () => {
    const services = await servicesWithLink("active");
    renderApp("/s/my-link", services, { simulated: false });

    unwrap(await services.auth.signIn(ALICE));
    await waitFor(async () => {
      const { items } = await services.shortUrls.list({ limit: 1 });
      expect(items[0]?.resolutionCount).toBe(1);
    });
    // jsdom loads no other site, so the app is left showing nothing of its own.
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("says that a deactivated link is turned off", async () => {
    renderApp("/s/my-link", await servicesWithLink("deactivated"));

    expect(
      await screen.findByRole("heading", { name: "This link is turned off." }),
    ).toBeInTheDocument();
  });

  it("says that there is no link at an unknown slug", async () => {
    renderApp("/s/unknown");

    expect(
      await screen.findByRole("heading", { name: "There's no link here." }),
    ).toBeInTheDocument();
  });
});
