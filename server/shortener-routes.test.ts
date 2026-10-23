import { describe, expect, it } from "vitest";

import { createSignedInApp, createTestApp } from "../tests/support/server/test-app.ts";

/** The authorization the shortener received, which it echoes by default. */
async function authorizationOf(answer: Promise<Response>): Promise<unknown> {
  const { authorization } = (await (await answer).clone().json()) as { authorization: unknown };
  return authorization;
}

describe("the shortener's API", () => {
  it("gets the request as it came, with the access token of the session", async () => {
    const { browser } = await createSignedInApp();

    const answer = await browser.sendJson("PATCH", "/api/v1/shorturls/id-1?x=1", { slug: "new" });

    expect(answer.status).toBe(200);
    expect(await answer.json()).toEqual({
      method: "PATCH",
      path: "/api/v1/shorturls/id-1?x=1",
      authorization: expect.stringMatching(/^Bearer access-\d+$/) as unknown,
      body: '{"slug":"new"}',
    });
  });

  it("gets no access token without a session", async () => {
    const { browser } = createTestApp();

    const answer = await browser.send("/api/v1/shorturls");

    expect(await answer.json()).toMatchObject({ authorization: null });
  });

  it("gets the access token the session was refreshed to, once it was about to expire", async () => {
    const { backEnds, browser } = await createSignedInApp();
    const before = await authorizationOf(browser.send("/api/v1/shorturls"));
    backEnds.now += backEnds.accessTokenSeconds * 1000;

    const answer = browser.send("/api/v1/shorturls");

    expect(await authorizationOf(answer)).not.toBe(before);
    expect(backEnds.receivedAt("/v1/auth/refresh")).toHaveLength(1);
    expect(await authorizationOf(browser.send("/api/v1/shorturls"))).toBe(
      await authorizationOf(answer),
    );
  });

  it("answers as the shortener does, with the headers the app reads, and no others", async () => {
    const { backEnds, browser } = await createSignedInApp();
    backEnds.shortener = () =>
      Response.json(
        { id: "id-9" },
        { status: 201, headers: { location: "/api/v1/shorturls/id-9", server: "uvicorn" } },
      );

    const answer = await browser.sendJson("POST", "/api/v1/shorturls", { target_url: "https://a" });

    expect(answer.status).toBe(201);
    expect(answer.headers.get("location")).toBe("/api/v1/shorturls/id-9");
    expect(answer.headers.get("server")).toBeNull();
    expect(await answer.json()).toEqual({ id: "id-9" });
  });

  it("gets a request without a body, as enabling a link sends", async () => {
    const { browser } = await createSignedInApp();

    const answer = await browser.sendJson("POST", "/api/v1/shorturls/id-1/enable");

    expect(await answer.json()).toMatchObject({ method: "POST", body: "" });
  });

  it("refuses a body larger than 64 KiB, without asking the shortener", async () => {
    const { backEnds, browser } = await createSignedInApp();
    const before = backEnds.received.length;

    const answer = await browser.sendJson("POST", "/api/v1/shorturls", {
      target_url: `https://example.com/${"x".repeat(65_536)}`,
    });

    expect(answer.status).toBe(413);
    expect(backEnds.received).toHaveLength(before);
  });
});

describe("a short link", () => {
  it("redirects where the shortener redirects", async () => {
    const { backEnds, browser } = createTestApp();
    backEnds.shortener = () =>
      new Response(null, { status: 307, headers: { location: "https://example.com/a" } });

    const answer = await browser.send("/s/my-Link");

    expect(answer.status).toBe(307);
    expect(answer.headers.get("location")).toBe("https://example.com/a");
    expect(backEnds.received[0]?.url.pathname).toBe("/api/v1/slugs/my-Link/redirect");
  });

  it("shows the page of the app with 404 for a slug the shortener doesn't know", async () => {
    const { backEnds, browser } = createTestApp();
    backEnds.shortener = () => Response.json({ code: "shorturl_not_found" }, { status: 404 });

    const answer = await browser.send("/s/unknown");

    expect(answer.status).toBe(404);
    expect(await answer.text()).toContain("<title>The app</title>");
  });

  it("shows the page of the app when the shortener fails, for it to say so", async () => {
    const { backEnds, browser } = createTestApp();
    backEnds.shortener = () => Response.json({ code: "unavailable" }, { status: 503 });

    const answer = await browser.send("/s/my-link");

    expect(answer.status).toBe(200);
    expect(await answer.text()).toContain("<title>The app</title>");
  });

  it("isn't followed by a HEAD, which would count a resolution", async () => {
    const { backEnds, browser } = createTestApp();

    const answer = await browser.send("/s/my-link", { method: "HEAD" });

    expect(answer.status).toBe(200);
    expect(backEnds.received).toEqual([]);
  });
});
