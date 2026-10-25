import { fileURLToPath } from "node:url";

import { createApp, createSimulationApp } from "../../../server/app.ts";
import type { Handler } from "../../../server/app.ts";
import { FakeBackEnds, GO_AUTH_URL, SHORTENER_URL } from "./fake-back-ends.ts";

export const SESSION_KEY = Buffer.alloc(32, 7);
export const PEER_ADDRESS = "203.0.113.7";
export const ALICE = { username: "alice", password: "correct-horse" };

/** A build of the app with one page, one asset and a favicon. */
export const STATIC_DIRECTORY = fileURLToPath(new URL("static", import.meta.url));

/** The server, on fake back ends, and a browser that talks to it. */
export function createTestApp({ clientAddressHeader }: { clientAddressHeader?: string } = {}) {
  const backEnds = new FakeBackEnds();
  let lastId = 0;
  const app = createApp({
    settings: {
      goAuthUrl: GO_AUTH_URL,
      shortenerUrl: SHORTENER_URL,
      sessionKey: SESSION_KEY,
      clientAddressHeader,
    },
    staticDirectory: STATIC_DIRECTORY,
    fetch: backEnds.fetch,
    now: () => backEnds.now,
    newId: () => `id-${String(++lastId)}`,
  });
  return { app, backEnds, browser: new TestBrowser(app) };
}

/** The server of the simulation, on the build of the app, and a browser that talks to it. */
export function createSimulationTestApp() {
  return { browser: new TestBrowser(createSimulationApp(STATIC_DIRECTORY)) };
}

/** The server, with Alice signed in on its browser. */
export async function createSignedInApp() {
  const test = createTestApp();
  test.backEnds.addUser(ALICE.username, ALICE.password);
  const answer = await test.browser.sendJson("POST", "/api/session", ALICE);
  if (answer.status !== 200) throw new Error(`signing in answered ${String(answer.status)}`);
  return test;
}

/** Sends requests to the server as a browser does, keeping the cookie of the session. */
export class TestBrowser {
  /** The cookie the browser sends, as `name=value`. */
  cookie: string | undefined;
  private readonly app: Handler;

  constructor(app: Handler) {
    this.app = app;
  }

  async send(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    if (this.cookie !== undefined) headers.set("cookie", this.cookie);
    const request = new Request(`http://app.test${path}`, { ...init, headers });
    const answer = await this.app(request, PEER_ADDRESS);
    for (const cookie of answer.headers.getSetCookie()) this.keep(cookie);
    return answer;
  }

  /** Sends a request with a JSON body, as the app sends every one that changes something. */
  sendJson(method: string, path: string, body?: unknown): Promise<Response> {
    return this.send(path, {
      method,
      headers: { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  private keep(setCookie: string): void {
    const [pair = ""] = setCookie.split(";");
    this.cookie = /Max-Age=0(;|$)/.test(setCookie) ? undefined : pair;
  }
}
