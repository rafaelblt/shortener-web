import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NotSignedInError } from "@/services/errors";
import { renderApp, renderSignedIn } from "@tests/support/render-app";
import { createTestServices } from "@tests/support/simulation";

describe("an unknown address", () => {
  it("shows the page not found", async () => {
    renderApp("/nowhere");

    expect(
      await screen.findByRole("heading", { name: "There's no page at this address." }),
    ).toBeInTheDocument();
  });
});

describe("a failure", () => {
  it("shows the error page", async () => {
    const services = createTestServices();
    services.shortUrls.list = () => Promise.reject(new Error("the back end failed"));
    await renderSignedIn("/", { services });

    expect(
      await screen.findByRole("heading", { name: "Something went wrong." }),
    ).toBeInTheDocument();
  });

  it("tries again", async () => {
    const services = createTestServices();
    const list = services.shortUrls.list.bind(services.shortUrls);
    services.shortUrls.list = () => Promise.reject(new Error("the back end failed"));
    const { user } = await renderSignedIn("/", { services });
    await screen.findByRole("heading", { name: "Something went wrong." });

    services.shortUrls.list = list;
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByRole("heading", { name: "Links" })).toBeInTheDocument();
  });

  it("sends to the sign-in page when the session ended", async () => {
    const services = createTestServices();
    // The session ends between the check of the route and the request, as when it expires.
    services.shortUrls.list = async () => {
      await services.auth.signOut();
      throw new NotSignedInError();
    };
    const { router } = await renderSignedIn("/?pages=2", { services });

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(router.state.location.search).toBe(`?next=${encodeURIComponent("/?pages=2")}`);
  });
});
