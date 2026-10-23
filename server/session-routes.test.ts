import { describe, expect, it, vi } from "vitest";

import {
  ALICE,
  createSignedInApp,
  createTestApp,
  TestBrowser,
} from "../tests/support/server/test-app.ts";

import type { FakeBackEnds } from "../tests/support/server/fake-back-ends.ts";

const MINUTE = 60_000;

/** Moves the clock to the moment the access token has the time left. */
function leaveOnTheAccessToken(backEnds: { now: number; accessTokenSeconds: number }, ms: number) {
  backEnds.now += backEnds.accessTokenSeconds * 1000 - ms;
}

describe("signing in", () => {
  it("answers the user, and keeps the session in a cookie the page can't read", async () => {
    const { backEnds, browser } = createTestApp();
    const { id } = backEnds.addUser(ALICE.username, ALICE.password);

    const answer = await browser.sendJson("POST", "/api/session", ALICE);

    expect(answer.status).toBe(200);
    expect(await answer.json()).toEqual({ user: { id, username: "alice" } });
    const [cookie = ""] = answer.headers.getSetCookie();
    expect(cookie).toMatch(/^__Host-session=[\w.-]+; Max-Age=604800; Path=\/;/);
    expect(cookie).toContain("HttpOnly; Secure; SameSite=Strict");
    expect(cookie).not.toContain("access-");
  });

  it("passes go-auth's refusal on, and sets no cookie", async () => {
    const { backEnds, browser } = createTestApp();
    backEnds.addUser(ALICE.username, ALICE.password);

    const answer = await browser.sendJson("POST", "/api/session", { ...ALICE, password: "wrong" });

    expect(answer.status).toBe(401);
    expect(await answer.json()).toMatchObject({ error: { code: "invalid_credentials" } });
    expect(answer.headers.getSetCookie()).toEqual([]);
  });

  it("refuses a body larger than 64 KiB, without asking go-auth", async () => {
    const { backEnds, browser } = createTestApp();

    const answer = await browser.sendJson("POST", "/api/session", { padding: "x".repeat(65_536) });

    expect(answer.status).toBe(413);
    expect(backEnds.received).toEqual([]);
  });
});

describe("the session", () => {
  it("answers the signed-in user", async () => {
    const { browser } = await createSignedInApp();

    const answer = await browser.send("/api/session");

    expect(answer.status).toBe(200);
    expect(await answer.json()).toMatchObject({ user: { username: "alice" } });
  });

  it("answers not_signed_in without a cookie", async () => {
    const { browser } = createTestApp();

    const answer = await browser.send("/api/session");

    expect(answer.status).toBe(401);
    expect(await answer.json()).toMatchObject({ error: { code: "not_signed_in" } });
    expect(answer.headers.getSetCookie()).toEqual([]);
  });

  it("forgets a cookie it didn't seal", async () => {
    const { browser } = await createSignedInApp();
    browser.cookie = `${browser.cookie ?? ""}x`;

    const answer = await browser.send("/api/session");

    expect(answer.status).toBe(401);
    expect(browser.cookie).toBeUndefined();
  });
});

describe("refreshing", () => {
  it("doesn't happen while the access token lasts more than a minute", async () => {
    const { backEnds, browser } = await createSignedInApp();
    leaveOnTheAccessToken(backEnds, MINUTE + 1000);

    const answer = await browser.send("/api/session");

    expect(answer.headers.getSetCookie()).toEqual([]);
    expect(backEnds.receivedAt("/v1/auth/refresh")).toEqual([]);
  });

  it("renews the cookie a minute before the access token expires", async () => {
    const { backEnds, browser } = await createSignedInApp();
    const before = browser.cookie;
    leaveOnTheAccessToken(backEnds, MINUTE);

    const answer = await browser.send("/api/session");

    expect(answer.status).toBe(200);
    expect(backEnds.receivedAt("/v1/auth/refresh")).toHaveLength(1);
    expect(browser.cookie).not.toBe(before);
  });

  it("happens once for requests that arrive together", async () => {
    const { backEnds, browser } = await createSignedInApp();
    leaveOnTheAccessToken(backEnds, 0);

    const answers = await Promise.all([
      browser.send("/api/session"),
      browser.send("/api/v1/shorturls"),
      browser.send("/api/session"),
    ]);

    expect(answers.map(({ status }) => status)).toEqual([200, 200, 200]);
    expect(backEnds.receivedAt("/v1/auth/refresh")).toHaveLength(1);
    expect((await browser.send("/api/session")).status).toBe(200);
  });

  it("answers a request with the cookie a refresh replaced, as the refresh left the session", async () => {
    const { backEnds, browser } = await createSignedInApp();
    const replaced = browser.cookie;
    leaveOnTheAccessToken(backEnds, 0);
    await browser.send("/api/session");
    const refreshed = browser.cookie;

    browser.cookie = replaced;
    const answer = await browser.send("/api/session");

    expect(answer.status).toBe(200);
    expect(backEnds.receivedAt("/v1/auth/refresh")).toHaveLength(1);
    expect(browser.cookie).not.toBe(replaced);
    browser.cookie = refreshed;
    expect((await browser.send("/api/session")).status).toBe(200);
  });

  it("ends the session when a replaced cookie comes back after five minutes", async () => {
    const { app, backEnds, browser } = await createSignedInApp();
    const replaced = browser.cookie;
    leaveOnTheAccessToken(backEnds, 0);
    await browser.send("/api/session");
    backEnds.now += 5 * MINUTE;
    // Another session refreshed meanwhile, as the server forgets the refreshes it no longer needs.
    const bob = new TestBrowser(app);
    backEnds.addUser("bob", "battery-staple");
    await bob.sendJson("POST", "/api/session", { username: "bob", password: "battery-staple" });
    leaveOnTheAccessToken(backEnds, 0);
    await bob.send("/api/session");

    browser.cookie = replaced;
    const answer = await browser.send("/api/session");

    expect(answer.status).toBe(401);
    expect(browser.cookie).toBeUndefined();
    expect((await bob.send("/api/session")).status).toBe(200);
  });

  it("keeps the session when go-auth fails to refresh it", async () => {
    const { backEnds, browser } = await createSignedInApp();
    const cookie = browser.cookie;
    backEnds.failing.add("/v1/auth/refresh");
    leaveOnTheAccessToken(backEnds, 0);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const answer = await browser.send("/api/session");

    expect(answer.status).toBe(502);
    expect(browser.cookie).toBe(cookie);
  });

  it("ends the session when go-auth refuses the refresh token", async () => {
    const { backEnds, browser } = await createSignedInApp();
    backEnds.revokeSessionsOf("alice");
    leaveOnTheAccessToken(backEnds, 0);

    const answer = await browser.send("/api/session");

    expect(answer.status).toBe(401);
    expect(await answer.json()).toMatchObject({ error: { code: "not_signed_in" } });
    expect(browser.cookie).toBeUndefined();
  });
});

describe("signing out", () => {
  it("ends the session at go-auth, and forgets the cookie", async () => {
    const { backEnds, browser } = await createSignedInApp();

    const answer = await browser.sendJson("DELETE", "/api/session");

    expect(answer.status).toBe(204);
    expect(browser.cookie).toBeUndefined();
    const [logout] = backEnds.receivedAt("/v1/auth/logout");
    expect(backEnds.isRevoked(logout?.fields.refresh_token ?? "")).toBe(true);
  });

  it("ends the session with the latest refresh token, after a refresh replaced the cookie", async () => {
    const { backEnds, browser } = await createSignedInApp();
    const replaced = browser.cookie;
    leaveOnTheAccessToken(backEnds, 0);
    await browser.send("/api/session");

    browser.cookie = replaced;
    await browser.sendJson("DELETE", "/api/session");

    const [refresh] = backEnds.receivedAt("/v1/auth/refresh");
    const [logout] = backEnds.receivedAt("/v1/auth/logout");
    expect(logout?.fields.refresh_token).toBeDefined();
    expect(logout?.fields.refresh_token).not.toBe(refresh?.fields.refresh_token);
  });

  it.each([
    { case: "can't be reached", fail: (backEnds: FakeBackEnds) => (backEnds.down = true) },
    { case: "fails", fail: (backEnds: FakeBackEnds) => backEnds.failing.add("/v1/auth/logout") },
  ])("forgets the cookie even when go-auth $case", async ({ fail }) => {
    const { backEnds, browser } = await createSignedInApp();
    fail(backEnds);
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const answer = await browser.sendJson("DELETE", "/api/session");

    expect(answer.status).toBe(204);
    expect(browser.cookie).toBeUndefined();
    expect(logged).toHaveBeenCalled();
  });

  it("answers 204 without a session", async () => {
    const { backEnds, browser } = createTestApp();

    expect((await browser.sendJson("DELETE", "/api/session")).status).toBe(204);
    expect(backEnds.received).toEqual([]);
  });
});

describe("changing the password", () => {
  it("changes it for the signed-in user, and ends the session", async () => {
    const { backEnds, browser } = await createSignedInApp();

    const answer = await browser.sendJson("POST", "/api/session/password", {
      current_password: ALICE.password,
      new_password: "battery-staple",
      username: "mallory",
    });

    expect(answer.status).toBe(204);
    expect(browser.cookie).toBeUndefined();
    const [change] = backEnds.receivedAt("/v1/auth/change-password");
    expect(change?.fields).toMatchObject({ username: "alice" });
  });

  it.each([
    { case: "a wrong current password", current: "wrong", status: 401 },
    { case: "a new password that is the current one", current: ALICE.password, status: 422 },
  ])("passes go-auth's refusal of $case on, and keeps the session", async ({ current, status }) => {
    const { browser } = await createSignedInApp();

    const answer = await browser.sendJson("POST", "/api/session/password", {
      current_password: current,
      new_password: ALICE.password,
    });

    expect(answer.status).toBe(status);
    expect(browser.cookie).toBeDefined();
  });

  it("answers not_signed_in without a session", async () => {
    const { browser } = createTestApp();

    const answer = await browser.sendJson("POST", "/api/session/password", {});

    expect(answer.status).toBe(401);
    expect(await answer.json()).toMatchObject({ error: { code: "not_signed_in" } });
  });

  it.each([
    { case: "isn't JSON", body: "{" },
    { case: "is a list", body: "[]" },
    { case: "isn't UTF-8", body: new Uint8Array([0x7b, 0x22, 0xff, 0x22, 0x7d]) },
  ])("refuses a body that $case", async ({ body }) => {
    const { backEnds, browser } = await createSignedInApp();

    const answer = await browser.send("/api/session/password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    });

    expect(answer.status).toBe(400);
    expect(await answer.json()).toMatchObject({ error: { code: "invalid_json_body" } });
    expect(backEnds.receivedAt("/v1/auth/change-password")).toEqual([]);
  });

  it("refuses a body larger than 64 KiB", async () => {
    const { browser } = await createSignedInApp();

    const answer = await browser.sendJson("POST", "/api/session/password", {
      padding: "x".repeat(65_536),
    });

    expect(answer.status).toBe(413);
  });
});

describe("creating an account", () => {
  it("passes the request to go-auth, and its answer back", async () => {
    const { browser } = createTestApp();

    const answer = await browser.sendJson("POST", "/api/users", ALICE);

    expect(answer.status).toBe(201);
    expect(await answer.json()).toMatchObject({ user: { username: "alice" } });
    expect(browser.cookie).toBeUndefined();
  });

  it("passes go-auth's refusal on", async () => {
    const { browser } = createTestApp();

    const answer = await browser.sendJson("POST", "/api/users", { ...ALICE, username: "al" });

    expect(answer.status).toBe(422);
    expect(await answer.json()).toMatchObject({ error: { code: "validation_failed" } });
  });

  it("refuses a body larger than 64 KiB", async () => {
    const { browser } = createTestApp();

    const answer = await browser.sendJson("POST", "/api/users", { padding: "x".repeat(65_536) });

    expect(answer.status).toBe(413);
  });
});
