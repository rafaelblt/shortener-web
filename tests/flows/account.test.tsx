import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderSignedIn } from "@tests/support/render-app";
import { ALICE } from "@tests/support/simulation";

const NEW_PASSWORD = "battery-staple";

async function changePassword(currentPassword: string, newPassword: string) {
  const rendered = await renderSignedIn("/account");
  const { user } = rendered;
  await user.type(await screen.findByLabelText("Current password"), currentPassword);
  await user.type(screen.getByLabelText("New password"), newPassword);
  await user.click(screen.getByRole("button", { name: "Change password" }));
  return rendered;
}

describe("the account page", () => {
  it("shows the username and the ID of the user", async () => {
    const { services } = await renderSignedIn("/account");

    const user = await services.auth.currentUser();
    expect(await screen.findByText(ALICE.username, { selector: "dd" })).toBeInTheDocument();
    expect(screen.getByText(user?.id ?? "")).toBeInTheDocument();
  });
});

describe("changing the password", () => {
  it("changes it, and sends to the sign-in page, where only the new one works", async () => {
    const { services } = await changePassword(ALICE.password, NEW_PASSWORD);

    expect(await screen.findByRole("status")).toHaveTextContent("Your password was changed");
    expect((await services.auth.signIn(ALICE)).ok).toBe(false);
    expect((await services.auth.signIn({ ...ALICE, password: NEW_PASSWORD })).ok).toBe(true);
  });

  it("says that the current password is wrong", async () => {
    await changePassword("wrong-password", NEW_PASSWORD);

    expect(await screen.findByLabelText("Current password")).toHaveAccessibleDescription(
      "That isn't your current password.",
    );
  });

  it.each([
    { case: "the current one", newPassword: ALICE.password, message: "Choose a password other" },
    { case: "too short", newPassword: "short", message: "Use at least 8 characters." },
  ])("refuses a new password that is $case", async ({ newPassword, message }) => {
    await changePassword(ALICE.password, newPassword);

    expect(await screen.findByLabelText("New password")).toHaveAccessibleDescription(
      expect.stringContaining(message),
    );
  });
});
