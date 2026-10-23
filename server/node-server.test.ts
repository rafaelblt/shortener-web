import type { AddressInfo } from "node:net";

import { afterEach, describe, expect, it, vi } from "vitest";

import type { Handler } from "./app.ts";
import { serve } from "./node-server.ts";

let close: (() => void) | undefined;

afterEach(() => {
  close?.();
});

/** Serves the handler on a free port, and answers its address. */
async function listen(handler: Handler): Promise<string> {
  const server = serve(handler);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  close = () => server.close();
  return `http://127.0.0.1:${String((server.address() as AddressInfo).port)}`;
}

describe("the server of node:http", () => {
  it("gives the handler the request, with its body and the peer's address", async () => {
    const address = await listen(async (request, peer) => {
      const { pathname, search } = new URL(request.url);
      const body = await request.text();
      return new Response(`${request.method} ${pathname}${search} ${body} ${peer}`);
    });

    const answer = await fetch(`${address}/api/users?x=1`, { method: "POST", body: "{}" });

    expect(await answer.text()).toBe("POST /api/users?x=1 {} 127.0.0.1");
  });

  it("sends the handler's answer, with every cookie it sets", async () => {
    const address = await listen(() => {
      const headers = new Headers({ "content-type": "text/plain" });
      headers.append("set-cookie", "a=1");
      headers.append("set-cookie", "b=2");
      return Promise.resolve(new Response("answered", { status: 201, headers }));
    });

    const answer = await fetch(address);

    expect(answer.status).toBe(201);
    expect(answer.headers.get("content-type")).toBe("text/plain");
    expect(answer.headers.getSetCookie()).toEqual(["a=1", "b=2"]);
    expect(await answer.text()).toBe("answered");
  });

  it("sends no body to a HEAD", async () => {
    const address = await listen(() => Promise.resolve(new Response("answered")));

    const answer = await fetch(address, { method: "HEAD" });

    expect(answer.status).toBe(200);
    expect(await answer.text()).toBe("");
  });

  it("closes the connection when the handler fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const address = await listen(() => Promise.reject(new Error("a bug")));

    await expect(fetch(address)).rejects.toThrow();
  });
});
