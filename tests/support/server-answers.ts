import { vi } from "vitest";

import type { Fetch } from "@/http/server-requests";

/** What the app sent to the server. */
export interface SentRequest {
  method: string;
  path: string;
  contentType: string | null;
  body: unknown;
}

/** A fetch on which the server answers each request with the answer, and what the app sent it. */
export function serverAnswering(answer: () => Response) {
  const fetchFunction = vi.fn<Fetch>(() => Promise.resolve(answer()));
  const sent = (): SentRequest[] =>
    fetchFunction.mock.calls.map(([input, init = {}]) => ({
      method: init.method ?? "GET",
      path: typeof input === "string" ? input : input instanceof URL ? input.href : input.url,
      contentType: new Headers(init.headers).get("content-type"),
      body: typeof init.body === "string" ? (JSON.parse(init.body) as unknown) : undefined,
    }));
  return { fetch: fetchFunction, sent };
}

/** An error of go-auth, or of the server, which shares its shape. */
export function goAuthError(status: number, code: string, fields?: unknown[]): Response {
  return Response.json({ error: { code, message: "A message.", fields } }, { status });
}

/** An error of the shortener. */
export function shortenerError(status: number, code: string, fields?: unknown[]): Response {
  return Response.json({ code, message: "A message.", fields }, { status });
}
