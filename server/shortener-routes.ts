import { callBackEnd } from "./back-end.ts";
import type { Fetch } from "./back-end.ts";
import type { Incoming } from "./messages.ts";
import { bodyOf, bodyTooLarge, passedThrough, withCookie } from "./messages.ts";
import type { SessionCookies } from "./session-cookies.ts";
import type { StaticFiles } from "./static-files.ts";

export interface ShortenerRoutesDependencies {
  url: string;
  fetch: Fetch;
  cookies: SessionCookies;
  staticFiles: StaticFiles;
}

/** The routes that reach the shortener: its API, and the short links. */
export class ShortenerRoutes {
  private readonly url: string;
  private readonly fetch: Fetch;
  private readonly cookies: SessionCookies;
  private readonly staticFiles: StaticFiles;

  constructor({ url, fetch, cookies, staticFiles }: ShortenerRoutesDependencies) {
    this.url = url;
    this.fetch = fetch;
    this.cookies = cookies;
    this.staticFiles = staticFiles;
  }

  /** Passes a request to the shortener's API as it came, with the access token of the session. */
  async forward({ request, url, clientAddress }: Incoming): Promise<Response> {
    const hasBody = request.method !== "GET" && request.method !== "HEAD";
    const body = hasBody ? await bodyOf(request) : undefined;
    if (body === null) return bodyTooLarge();
    const { session, cookie } = await this.cookies.freshOf(request, clientAddress);

    const headers: Record<string, string> = {};
    const contentType = request.headers.get("content-type");
    if (contentType !== null) headers["content-type"] = contentType;
    if (session) headers.authorization = `Bearer ${session.accessToken.value}`;
    const answer = await callBackEnd(this.fetch, this.url + url.pathname + url.search, {
      method: request.method,
      body,
      headers,
      clientAddress,
    });
    return withCookie(passedThrough(answer), cookie);
  }

  /**
   * Follows a short link to where it leads, as the shortener redirects. For a slug the shortener
   * doesn't redirect, the app's page of the short link says why.
   */
  async follow({ clientAddress }: Incoming, slug: string): Promise<Response> {
    const redirect = `${this.url}/api/v1/slugs/${slug}/redirect`;
    const answer = await callBackEnd(this.fetch, redirect, { method: "GET", clientAddress });
    if (answer.status === 307) return passedThrough(answer);
    await answer.body?.cancel();
    return this.staticFiles.app(answer.status === 404 ? 404 : 200);
  }
}
