import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { err } from "@/services/result";
import { renderApp, renderSignedIn } from "@tests/support/render-app";
import { createShortUrls } from "@tests/support/short-urls";
import { createTestServices } from "@tests/support/simulation";

// The back ends check their own rules, which may change before the app learns them: a value the
// app accepts can still come back as invalid, and the form has to say so.
describe("a value only the back end refuses", () => {
  it("is pointed out when creating an account", async () => {
    const services = createTestServices();
    services.auth.register = () =>
      Promise.resolve(err({ code: "invalid_input", fields: { username: "too_long" } }));
    const { user } = renderApp("/register", services);

    await user.type(await screen.findByLabelText("Username"), "alice");
    await user.type(screen.getByLabelText("Password"), "correct-horse");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByLabelText("Username")).toHaveAccessibleDescription(
      "Use at most 32 characters.",
    );
  });

  it("is pointed out when shortening a link", async () => {
    const services = createTestServices();
    services.shortUrls.create = () =>
      Promise.resolve(err({ code: "invalid_input", fields: { targetUrl: "invalid_format" } }));
    const { user } = await renderSignedIn("/", { services });

    await user.type(await screen.findByLabelText("Target URL"), "https://example.com");
    await user.click(screen.getByRole("button", { name: "Shorten" }));

    expect(await screen.findByLabelText("Target URL")).toHaveAccessibleDescription(
      "Enter a full https:// address, such as https://example.com/page.",
    );
  });

  it("is pointed out when editing a link", async () => {
    const services = createTestServices();
    const { user, router } = await renderSignedIn("/", { services });
    const [shortUrl] = await createShortUrls(services, ["my-link"]);
    services.shortUrls.update = () =>
      Promise.resolve(err({ code: "invalid_input", fields: { slug: "too_long" } }));
    await router.navigate(`/links/${shortUrl?.id ?? ""}`);

    await user.type(await screen.findByLabelText("Slug"), "-2");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByLabelText("Slug")).toHaveAccessibleDescription(
      "Use at most 30 characters.",
    );
  });

  it("is pointed out when changing the password", async () => {
    const services = createTestServices();
    services.auth.changePassword = () =>
      Promise.resolve(err({ code: "invalid_input", fields: { newPassword: "too_long" } }));
    const { user } = await renderSignedIn("/account", { services });

    await user.type(await screen.findByLabelText("Current password"), "correct-horse");
    await user.type(screen.getByLabelText("New password"), "battery-staple");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(await screen.findByLabelText("New password")).toHaveAccessibleDescription(
      expect.stringContaining("Use at most 72 bytes"),
    );
  });
});
