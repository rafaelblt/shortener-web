import { describe, expect, it, vi } from "vitest";

import { createApp } from "./app.ts";
import {
  createSignedInApp,
  createTestApp,
  PEER_ADDRESS,
  SESSION_KEY,
} from "../tests/support/server/test-app.ts";

describe("the API of the server", () => {
  it.each([
    { case: "no type", headers: {} },
    { case: "a form's type", headers: { "content-type": "application/x-www-form-urlencoded" } },
    { case: "text", headers: { "content-type": "text/plain" } },
  ])(
    "refuses a request that changes something with $case, as a form of another site sends",
    async ({ headers }) => {
      const { backEnds, browser } = await createSignedInApp();
      const before = backEnds.received.length;

      const answer = await browser.send("/api/v1/shorturls", {
        method: "POST",
        headers,
        body: "{}",
      });

      expect(answer.status).toBe(415);
      expect(backEnds.received).toHaveLength(before);
    },
  );

  it("takes JSON whatever the case and the parameters of its type", async () => {
    const { browser } = await createSignedInApp();

    const answer = await browser.send("/api/v1/shorturls", {
      method: "POST",
      headers: { "content-type": "Application/JSON; charset=utf-8" },
      body: "{}",
    });

    expect(answer.status).toBe(200);
  });

  it.each([
    { method: "GET", path: "/api/unknown" },
    { method: "PUT", path: "/api/session" },
  ])("answers route_not_found to $method $path", async ({ method, path }) => {
    const { browser } = createTestApp();

    const answer = await browser.sendJson(method, path);

    expect(answer.status).toBe(404);
    expect(await answer.json()).toMatchObject({ error: { code: "route_not_found" } });
  });

  it("answers back_end_failed when a back end can't be reached", async () => {
    const { backEnds, browser } = createTestApp();
    backEnds.down = true;
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const answer = await browser.send("/api/v1/shorturls");

    expect(answer.status).toBe(502);
    expect(await answer.json()).toMatchObject({ error: { code: "back_end_failed" } });
  });

  it("answers internal_error when it fails itself", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const app = createApp({
      settings: {
        goAuthUrl: "http://go-auth.test",
        shortenerUrl: "http://shortener.test",
        sessionKey: SESSION_KEY,
        clientAddressHeader: undefined,
      },
      staticDirectory: "/nonexistent",
      fetch,
      now: Date.now,
      newId: () => "id",
    });

    const answer = await app(new Request("http://app.test/links"), PEER_ADDRESS);

    expect(answer.status).toBe(500);
    expect(await answer.json()).toMatchObject({ error: { code: "internal_error" } });
  });
});

describe("the address of the client", () => {
  it("is the peer's, for the back ends to count their limits by", async () => {
    const { backEnds, browser } = createTestApp();

    await browser.send("/api/v1/shorturls", { headers: { "x-forwarded-for": "198.51.100.1" } });

    expect(backEnds.received[0]?.headers.get("x-forwarded-for")).toBe(PEER_ADDRESS);
  });

  it("is the one of the header the proxy in front of the server sets, when there is one", async () => {
    const { backEnds, browser } = createTestApp({ clientAddressHeader: "x-real-ip" });

    await browser.send("/api/v1/shorturls", { headers: { "x-real-ip": "198.51.100.1" } });
    await browser.send("/api/v1/shorturls");

    expect(backEnds.received.map(({ headers }) => headers.get("x-forwarded-for"))).toEqual([
      "198.51.100.1",
      PEER_ADDRESS,
    ]);
  });
});
