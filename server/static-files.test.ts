import { describe, expect, it } from "vitest";

import { createTestApp } from "../tests/support/server/test-app.ts";

describe("the files of the app", () => {
  it("are served with their type", async () => {
    const { browser } = createTestApp();

    const answer = await browser.send("/favicon.svg");

    expect(answer.status).toBe(200);
    expect(answer.headers.get("content-type")).toBe("image/svg+xml");
    expect(answer.headers.get("cache-control")).toBe("no-cache");
  });

  it("are kept by the browser for good under /assets, where their names change with them", async () => {
    const { browser } = createTestApp();

    const answer = await browser.send("/assets/app-0123abcd.js");

    expect(answer.headers.get("content-type")).toBe("text/javascript; charset=utf-8");
    expect(answer.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    expect(await answer.text()).toContain("the app");
  });

  it.each(["/", "/links/id-1", "/sign-in?next=%2F"])(
    "answer the app's page at %s, a route of the app",
    async (path) => {
      const { browser } = createTestApp();

      const answer = await browser.send(path);

      expect(answer.status).toBe(200);
      expect(answer.headers.get("content-type")).toBe("text/html; charset=utf-8");
      expect(answer.headers.get("cache-control")).toBe("no-cache");
      expect(await answer.text()).toContain("<title>The app</title>");
    },
  );

  it("come with a policy that only lets the page load and send what is the app's own", async () => {
    const { browser } = createTestApp();

    const answer = await browser.send("/");

    expect(answer.headers.get("content-security-policy")).toContain("default-src 'self'");
    expect(answer.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it.each(["/assets/app-old.js", "/robots.txt"])(
    "aren't found at %s, a missing file",
    async (path) => {
      const { browser } = createTestApp();

      expect((await browser.send(path)).status).toBe(404);
    },
  );

  it.each([
    { path: "/..%2ffake-back-ends.ts", outside: "FakeBackEnds" },
    { path: `/${"..%2f".repeat(4)}package.json`, outside: '"name": "shortener-web"' },
  ])("aren't served from out of their directory, as at $path", async ({ path, outside }) => {
    const { browser } = createTestApp();

    const answer = await browser.send(path);

    expect(answer.status).toBe(404);
    expect(await answer.text()).not.toContain(outside);
  });

  it("answer the app's page at a path that can't be decoded", async () => {
    const { browser } = createTestApp();

    const answer = await browser.send("/%E0%A4%A");

    expect(await answer.text()).toContain("<title>The app</title>");
  });

  it("are only read", async () => {
    const { browser } = createTestApp();

    const answer = await browser.send("/links", { method: "POST" });

    expect(answer.status).toBe(405);
    expect(answer.headers.get("allow")).toBe("GET, HEAD");
  });
});
