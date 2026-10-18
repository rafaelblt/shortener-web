import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderApp, renderSignedIn } from "@tests/support/render-app";
import { ALICE, createTestServices, unwrap } from "@tests/support/simulation";

async function servicesWithAlice() {
  const services = createTestServices();
  unwrap(await services.auth.register(ALICE));
  return services;
}

describe("signing in", () => {
  it("sends whoever isn't signed in to the sign-in page, and back afterwards", async () => {
    const { user, router } = renderApp("/account", await servicesWithAlice());

    await screen.findByRole("heading", { name: "Sign in" });
    await user.type(screen.getByLabelText("Username"), ALICE.username);
    await user.type(screen.getByLabelText("Password"), ALICE.password);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("heading", { name: "Account" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/account");
  });

  it("says that it's signing in while the request is pending", async () => {
    const services = await servicesWithAlice();
    const signIn = services.auth.signIn.bind(services.auth);
    const { promise: answered, resolve: answer } = Promise.withResolvers<undefined>();
    services.auth.signIn = async (credentials) => {
      await answered;
      return signIn(credentials);
    };
    const { user } = renderApp("/sign-in", services);

    await user.type(await screen.findByLabelText("Username"), ALICE.username);
    await user.type(screen.getByLabelText("Password"), ALICE.password);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("button", { name: "Signing in…" })).toBeDisabled();
    answer(undefined);
    expect(await screen.findByRole("heading", { name: "Links" })).toBeInTheDocument();
  });

  it("says that the credentials are wrong, keeping the username", async () => {
    const { user } = renderApp("/sign-in", await servicesWithAlice());

    await user.type(await screen.findByLabelText("Username"), ALICE.username);
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The username or the password is wrong.",
    );
    expect(screen.getByLabelText("Username")).toHaveValue(ALICE.username);
  });

  it("asks for the fields left empty", async () => {
    const { user } = renderApp("/sign-in");

    await user.click(await screen.findByRole("button", { name: "Sign in" }));

    expect(await screen.findByLabelText("Username")).toHaveAccessibleDescription(
      "Enter a username.",
    );
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription("Enter a password.");
  });

  it.each([
    { case: "another site", next: "//evil.example" },
    { case: "another site, with a backslash", next: "/\\evil.example" },
    { case: "an absolute URL", next: "https://evil.example" },
  ])("goes to the links instead of $case", async ({ next }) => {
    const { user, router } = renderApp(
      `/sign-in?next=${encodeURIComponent(next)}`,
      await servicesWithAlice(),
    );

    await user.type(await screen.findByLabelText("Username"), ALICE.username);
    await user.type(screen.getByLabelText("Password"), ALICE.password);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await screen.findByRole("heading", { name: "Links" });
    expect(router.state.location.pathname).toBe("/");
  });

  it("sends whoever is signed in from the sign-in page to the links", async () => {
    await renderSignedIn("/sign-in");

    expect(await screen.findByRole("heading", { name: "Links" })).toBeInTheDocument();
  });
});

describe("creating an account", () => {
  it("creates it, signs in, and welcomes the new user", async () => {
    const { user } = renderApp("/register");

    await user.type(await screen.findByLabelText("Username"), "Carol");
    await user.type(screen.getByLabelText("Password"), "a-long-password");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Your account is ready.");
    expect(screen.getByText("No links yet.")).toBeInTheDocument();
    expect(screen.getByText("carol")).toBeInTheDocument();
  });

  it("points out the values that break the rules", async () => {
    const { user } = renderApp("/register");

    await user.type(await screen.findByLabelText("Username"), "no spaces");
    await user.type(screen.getByLabelText("Password"), "short");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByLabelText("Username")).toHaveAccessibleDescription(
      "Use only letters, digits, dots, dashes and underscores.",
    );
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription(
      "Use at least 8 characters.",
    );
  });

  it("says that the username is taken", async () => {
    const { user } = renderApp("/register", await servicesWithAlice());

    await user.type(await screen.findByLabelText("Username"), ALICE.username);
    await user.type(screen.getByLabelText("Password"), "another-password");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByLabelText("Username")).toHaveAccessibleDescription(
      "That username is taken.",
    );
  });
});

describe("signing out", () => {
  it("ends the session, and the pages for signed-in users send to the sign-in page", async () => {
    const { user, router } = await renderSignedIn("/");

    await user.click(await screen.findByRole("button", { name: "Sign out" }));

    expect(await screen.findByRole("status")).toHaveTextContent("You're signed out.");
    await router.navigate("/");
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  });

  it("leads to the links when its address is opened instead of posting to it", async () => {
    await renderSignedIn("/sign-out");

    expect(await screen.findByRole("heading", { name: "Links" })).toBeInTheDocument();
  });
});
