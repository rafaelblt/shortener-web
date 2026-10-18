import { describe, expect, it } from "vitest";

import { NotSignedInError } from "@/services/errors";
import { err } from "@/services/result";
import { ALICE, createTestServices, registerAndSignIn, unwrap } from "@tests/support/simulation";

describe("register", () => {
  it("creates the account, with the username in lowercase, without signing in", async () => {
    const { auth } = createTestServices();

    const user = unwrap(await auth.register({ ...ALICE, username: "Alice" }));

    expect(user).toEqual({ id: "id-1", username: "alice" });
    expect(await auth.currentUser()).toBeNull();
  });

  it("reports every field that breaks a rule", async () => {
    const { auth } = createTestServices();

    expect(await auth.register({ username: "a", password: "short" })).toEqual(
      err({ code: "invalid_input", fields: { username: "too_short", password: "too_short" } }),
    );
  });

  it("refuses a username that is taken, whatever its case", async () => {
    const { auth } = createTestServices();
    unwrap(await auth.register(ALICE));

    expect(await auth.register({ ...ALICE, username: "ALICE" })).toEqual(
      err({ code: "username_taken" }),
    );
  });
});

describe("signIn", () => {
  it("signs in, whatever the case of the username", async () => {
    const { auth } = createTestServices();
    unwrap(await auth.register(ALICE));

    const user = unwrap(await auth.signIn({ ...ALICE, username: "ALICE" }));

    expect(user).toEqual({ id: "id-1", username: "alice" });
    expect(await auth.currentUser()).toEqual(user);
  });

  it.each([
    { case: "a wrong password", credentials: { ...ALICE, password: "wrong-password" } },
    { case: "an unknown username", credentials: { ...ALICE, username: "nobody" } },
    { case: "values that break the rules", credentials: { username: "", password: "" } },
  ])("answers invalid_credentials for $case", async ({ credentials }) => {
    const { auth } = createTestServices();
    unwrap(await auth.register(ALICE));

    expect(await auth.signIn(credentials)).toEqual(err({ code: "invalid_credentials" }));
    expect(await auth.currentUser()).toBeNull();
  });
});

describe("signOut", () => {
  it("ends the session", async () => {
    const services = createTestServices();
    await registerAndSignIn(services, ALICE);

    await services.auth.signOut();

    expect(await services.auth.currentUser()).toBeNull();
  });
});

describe("changePassword", () => {
  const newPassword = "battery-staple";

  it("replaces the password and ends the session", async () => {
    const services = createTestServices();
    await registerAndSignIn(services, ALICE);

    unwrap(await services.auth.changePassword({ currentPassword: ALICE.password, newPassword }));

    expect(await services.auth.currentUser()).toBeNull();
    expect((await services.auth.signIn(ALICE)).ok).toBe(false);
    expect((await services.auth.signIn({ ...ALICE, password: newPassword })).ok).toBe(true);
  });

  it("refuses a wrong current password, and keeps the session", async () => {
    const services = createTestServices();
    await registerAndSignIn(services, ALICE);

    expect(
      await services.auth.changePassword({ currentPassword: "wrong-password", newPassword }),
    ).toEqual(err({ code: "invalid_credentials" }));
    expect(await services.auth.currentUser()).not.toBeNull();
  });

  it.each([
    { case: "breaks a rule", newPassword: "short", issue: "too_short" },
    { case: "is the current one", newPassword: ALICE.password, issue: "same_as_current" },
  ])("reports a new password that $case", async ({ newPassword, issue }) => {
    const services = createTestServices();
    await registerAndSignIn(services, ALICE);

    expect(
      await services.auth.changePassword({ currentPassword: ALICE.password, newPassword }),
    ).toEqual(err({ code: "invalid_input", fields: { newPassword: issue } }));
  });

  it("reports the new password before checking the current one", async () => {
    const services = createTestServices();
    await registerAndSignIn(services, ALICE);

    expect(
      await services.auth.changePassword({ currentPassword: "wrong-password", newPassword: "x" }),
    ).toEqual(err({ code: "invalid_input", fields: { newPassword: "too_short" } }));
  });

  it("throws NotSignedInError when nobody is signed in", async () => {
    const { auth } = createTestServices();

    await expect(
      auth.changePassword({ currentPassword: ALICE.password, newPassword }),
    ).rejects.toThrow(NotSignedInError);
  });
});
