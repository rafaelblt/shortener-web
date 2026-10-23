import { describe, expect, it, vi } from "vitest";

import { NotSignedInError } from "@/services/errors";
import { err, ok } from "@/services/result";
import { goAuthError, serverAnswering } from "@tests/support/server-answers";

import { HttpAuthService } from "./http-auth-service";
import { createHttpServices } from "./http-services";
import { UnexpectedAnswerError } from "./server-requests";

const ALICE = { id: "0f1c2e5a-7b3d-4c8e-9a1f-2b6d4e8c0a37", username: "alice" };
const CREDENTIALS = { username: "Alice", password: "correct-horse" };

function serviceAnswering(answer: () => Response) {
  const server = serverAnswering(answer);
  return { auth: new HttpAuthService(server.fetch), sent: server.sent };
}

describe("currentUser", () => {
  it("asks the server who is signed in", async () => {
    const { auth, sent } = serviceAnswering(() => Response.json({ user: ALICE }));

    expect(await auth.currentUser()).toEqual(ALICE);
    expect(sent()).toEqual([
      { method: "GET", path: "/api/session", contentType: null, body: undefined },
    ]);
  });

  it("answers null when nobody is signed in", async () => {
    const { auth } = serviceAnswering(() => goAuthError(401, "not_signed_in"));

    expect(await auth.currentUser()).toBeNull();
  });

  it("throws when the server fails", async () => {
    const { auth } = serviceAnswering(() => goAuthError(502, "back_end_failed"));

    await expect(auth.currentUser()).rejects.toThrow(UnexpectedAnswerError);
  });
});

describe("register", () => {
  it("creates the account, with the username as it was typed", async () => {
    const { auth, sent } = serviceAnswering(() => Response.json({ user: ALICE }, { status: 201 }));

    expect(await auth.register(CREDENTIALS)).toEqual(ok(ALICE));
    expect(sent()).toEqual([
      { method: "POST", path: "/api/users", contentType: "application/json", body: CREDENTIALS },
    ]);
  });

  it("answers username_taken for a username that exists", async () => {
    const { auth } = serviceAnswering(() => goAuthError(409, "username_already_exists"));

    expect(await auth.register(CREDENTIALS)).toEqual(err({ code: "username_taken" }));
  });

  it("answers the first issue go-auth found in each field", async () => {
    const { auth } = serviceAnswering(() =>
      goAuthError(422, "validation_failed", [
        { field: "username", code: "invalid_characters", details: {} },
        { field: "username", code: "too_long", details: { max: 32 } },
        { field: "password", code: "too_short", details: { min: 8 } },
      ]),
    );

    expect(await auth.register(CREDENTIALS)).toEqual(
      err({
        code: "invalid_input",
        fields: { username: "invalid_format", password: "too_short" },
      }),
    );
  });

  it.each([
    { case: "too many requests", answer: () => goAuthError(429, "too_many_requests") },
    { case: "a refusal it doesn't know", answer: () => goAuthError(400, "invalid_json_body") },
  ])("throws for $case", async ({ answer }) => {
    const { auth } = serviceAnswering(answer);

    await expect(auth.register(CREDENTIALS)).rejects.toThrow(UnexpectedAnswerError);
  });
});

describe("signIn", () => {
  it("signs in", async () => {
    const { auth, sent } = serviceAnswering(() => Response.json({ user: ALICE }));

    expect(await auth.signIn(CREDENTIALS)).toEqual(ok(ALICE));
    expect(sent()).toMatchObject([{ method: "POST", path: "/api/session", body: CREDENTIALS }]);
  });

  it("answers invalid_credentials for any credential go-auth refuses", async () => {
    const { auth } = serviceAnswering(() => goAuthError(401, "invalid_credentials"));

    expect(await auth.signIn(CREDENTIALS)).toEqual(err({ code: "invalid_credentials" }));
  });

  it.each([
    { case: "too many requests", answer: () => goAuthError(429, "too_many_requests") },
    { case: "a refusal it doesn't know", answer: () => goAuthError(400, "invalid_json_body") },
  ])("throws for $case", async ({ answer }) => {
    const { auth } = serviceAnswering(answer);

    await expect(auth.signIn(CREDENTIALS)).rejects.toThrow(UnexpectedAnswerError);
  });
});

describe("signOut", () => {
  it("ends the session", async () => {
    const { auth, sent } = serviceAnswering(() => new Response(null, { status: 204 }));

    await auth.signOut();

    expect(sent()).toEqual([
      { method: "DELETE", path: "/api/session", contentType: "application/json", body: undefined },
    ]);
  });

  it("throws when the server fails", async () => {
    const { auth } = serviceAnswering(() => goAuthError(500, "internal_error"));

    await expect(auth.signOut()).rejects.toThrow(UnexpectedAnswerError);
  });
});

describe("changePassword", () => {
  const CHANGE = { currentPassword: "correct-horse", newPassword: "battery-staple" };

  it("changes the password, as go-auth names the fields", async () => {
    const { auth, sent } = serviceAnswering(() => new Response(null, { status: 204 }));

    expect(await auth.changePassword(CHANGE)).toEqual(ok(undefined));
    expect(sent()).toMatchObject([
      {
        method: "POST",
        path: "/api/session/password",
        body: { current_password: "correct-horse", new_password: "battery-staple" },
      },
    ]);
  });

  it("answers invalid_credentials for a wrong current password", async () => {
    const { auth } = serviceAnswering(() => goAuthError(401, "invalid_credentials"));

    expect(await auth.changePassword(CHANGE)).toEqual(err({ code: "invalid_credentials" }));
  });

  it("answers the issue of the new password", async () => {
    const { auth } = serviceAnswering(() =>
      goAuthError(422, "validation_failed", [
        { field: "new_password", code: "same_as_current", details: {} },
      ]),
    );

    expect(await auth.changePassword(CHANGE)).toEqual(
      err({ code: "invalid_input", fields: { newPassword: "same_as_current" } }),
    );
  });

  it("throws NotSignedInError when the session ended", async () => {
    const { auth } = serviceAnswering(() => goAuthError(401, "not_signed_in"));

    await expect(auth.changePassword(CHANGE)).rejects.toThrow(NotSignedInError);
  });

  it("throws for a refusal it doesn't know", async () => {
    const { auth } = serviceAnswering(() => goAuthError(400, "invalid_json_body"));

    await expect(auth.changePassword(CHANGE)).rejects.toThrow(UnexpectedAnswerError);
  });
});

describe("createHttpServices", () => {
  it("asks with the browser's fetch", async () => {
    const browserFetch = vi.fn(() => Promise.resolve(Response.json({ user: ALICE })));
    vi.stubGlobal("fetch", browserFetch);

    expect(await createHttpServices().auth.currentUser()).toEqual(ALICE);
    expect(browserFetch).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });
});
