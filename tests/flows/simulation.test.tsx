import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderApp } from "@tests/support/render-app";

describe("the banner of the simulation", () => {
  it("says, on every page, that nothing reaches a server, with the demo account", async () => {
    renderApp("/sign-in");

    expect(await screen.findByText(/Nothing reaches a server/)).toHaveTextContent(
      "demo / demo-password",
    );
  });

  it("isn't shown when the app runs on the server", async () => {
    renderApp("/sign-in", undefined, { simulated: false });

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.queryByText(/Nothing reaches a server/)).not.toBeInTheDocument();
  });
});
