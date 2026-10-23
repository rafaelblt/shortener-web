import { BackEndError } from "./back-end.ts";
import type { Fetch } from "./back-end.ts";
import { GoAuth } from "./go-auth.ts";
import type { Incoming } from "./messages.ts";
import { errorAnswer } from "./messages.ts";
import { SessionCookies } from "./session-cookies.ts";
import { SessionRoutes } from "./session-routes.ts";
import { Sessions } from "./sessions.ts";
import type { ServerSettings } from "./settings.ts";
import { ShortenerRoutes } from "./shortener-routes.ts";
import { StaticFiles } from "./static-files.ts";

export interface AppDependencies {
  settings: Omit<ServerSettings, "port">;
  /** Where the build of the app is. */
  staticDirectory: string;
  fetch: Fetch;
  now: () => number;
  newId: () => string;
}

/** Answers a request, given the address of the peer that sent it. */
export type Handler = (request: Request, peerAddress: string) => Promise<Response>;

const SHORTENER_API = "/api/v1/";
const SHORT_LINK = /^\/s\/([^/]+)$/;

/** The server of the app: its API, the shortener's, the short links, and the app's files. */
export function createApp({
  settings,
  staticDirectory,
  fetch,
  now,
  newId,
}: AppDependencies): Handler {
  const goAuth = new GoAuth(settings.goAuthUrl, fetch);
  const sessions = new Sessions({ goAuth, now, newId });
  const cookies = new SessionCookies({ key: settings.sessionKey, sessions, now });
  const session = new SessionRoutes({ goAuth, sessions, cookies });
  const staticFiles = new StaticFiles(staticDirectory);
  const shortener = new ShortenerRoutes({
    url: settings.shortenerUrl,
    fetch,
    cookies,
    staticFiles,
  });

  // The API of the server, by method and path. See docs/architecture/server.md#the-api
  const api = new Map<string, (incoming: Incoming) => Promise<Response>>([
    ["GET /api/session", (incoming) => session.current(incoming)],
    ["POST /api/session", (incoming) => session.signIn(incoming)],
    ["DELETE /api/session", (incoming) => session.signOut(incoming)],
    ["POST /api/session/password", (incoming) => session.changePassword(incoming)],
    ["POST /api/users", (incoming) => session.register(incoming)],
  ]);

  async function route(incoming: Incoming): Promise<Response> {
    const { method } = incoming.request;
    const path = incoming.url.pathname;
    if (path.startsWith("/api/")) {
      if (!isSafe(method) && !isJson(incoming.request)) {
        return errorAnswer(415, "unsupported_media_type", "The body has to be JSON.");
      }
      if (path.startsWith(SHORTENER_API)) return shortener.forward(incoming);
      const answer = api.get(`${method} ${path}`);
      return answer ? answer(incoming) : errorAnswer(404, "route_not_found", "No route here.");
    }
    if (!isSafe(method))
      return new Response(null, { status: 405, headers: { allow: "GET, HEAD" } });
    // Only a GET follows a short link, since following it counts a resolution.
    const slug = method === "GET" ? SHORT_LINK.exec(path)?.[1] : undefined;
    return slug === undefined ? staticFiles.answer(path) : shortener.follow(incoming, slug);
  }

  return async (request, peerAddress) => {
    const incoming = {
      request,
      url: new URL(request.url),
      clientAddress: clientAddressOf(request, peerAddress, settings.clientAddressHeader),
    };
    try {
      return await route(incoming);
    } catch (error) {
      console.error(`${request.method} ${incoming.url.pathname} failed:`, error);
      return error instanceof BackEndError
        ? errorAnswer(502, "back_end_failed", "A back end failed to answer.")
        : errorAnswer(500, "internal_error", "The server failed.");
    }
  };
}

function isSafe(method: string): boolean {
  return method === "GET" || method === "HEAD";
}

// A form of another site can't send JSON without the browser asking first, which this server never
// allows, so requiring it keeps other sites from acting for a signed-in person.
function isJson(request: Request): boolean {
  const type = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  return type === "application/json";
}

/** The client's address, as the proxy in front of the server gives it, or else the peer's. */
function clientAddressOf(request: Request, peerAddress: string, header: string | undefined) {
  const address = header === undefined ? undefined : request.headers.get(header)?.trim();
  return address === undefined || address === "" ? peerAddress : address;
}
