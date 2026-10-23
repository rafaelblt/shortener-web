import type { GoAuth, Tokens } from "./go-auth.ts";
import type { Incoming } from "./messages.ts";
import {
  bodyOf,
  bodyTooLarge,
  errorAnswer,
  jsonAnswer,
  notSignedIn,
  passedThrough,
  withCookie,
} from "./messages.ts";
import { endedSessionCookie } from "./session-cookie.ts";
import type { SessionCookies } from "./session-cookies.ts";
import type { Sessions } from "./sessions.ts";

export interface SessionRoutesDependencies {
  goAuth: GoAuth;
  sessions: Sessions;
  cookies: SessionCookies;
}

/** The routes of the session: who is signed in, signing in and out, and the password. */
export class SessionRoutes {
  private readonly goAuth: GoAuth;
  private readonly sessions: Sessions;
  private readonly cookies: SessionCookies;

  constructor({ goAuth, sessions, cookies }: SessionRoutesDependencies) {
    this.goAuth = goAuth;
    this.sessions = sessions;
    this.cookies = cookies;
  }

  async current({ request, clientAddress }: Incoming): Promise<Response> {
    const { session, cookie } = await this.cookies.freshOf(request, clientAddress);
    return withCookie(session ? jsonAnswer(200, { user: session.user }) : notSignedIn(), cookie);
  }

  async signIn({ request, clientAddress }: Incoming): Promise<Response> {
    const body = await bodyOf(request);
    if (!body) return bodyTooLarge();
    const answer = await this.goAuth.send("/v1/auth/login", body, clientAddress);
    if (answer.status !== 200) return passedThrough(answer);

    // The tokens name only the user's ID, so the username comes from go-auth.
    const tokens = (await answer.json()) as Tokens;
    const user = await this.goAuth.me(tokens.access_token.value, clientAddress);
    const session = this.sessions.start(tokens, user);
    return withCookie(jsonAnswer(200, { user: session.user }), this.cookies.cookieOf(session));
  }

  /** Signs out in this browser whatever go-auth answers, since the cookie is all it holds. */
  async signOut({ request, clientAddress }: Incoming): Promise<Response> {
    const session = this.cookies.of(request);
    if (session) {
      try {
        await this.sessions.end(session, clientAddress);
      } catch (error) {
        console.error("A session couldn't be ended at go-auth:", error);
      }
    }
    return withCookie(new Response(null, { status: 204 }), endedSessionCookie());
  }

  /** Changes the password of the signed-in user, which ends every session of the user. */
  async changePassword({ request, clientAddress }: Incoming): Promise<Response> {
    const session = this.cookies.of(request);
    if (!session) return notSignedIn();
    const body = await bodyOf(request);
    if (!body) return bodyTooLarge();
    const change = jsonObjectOf(body);
    if (!change) return errorAnswer(400, "invalid_json_body", "The body isn't a JSON object.");

    const withUsername = JSON.stringify({ ...change, username: session.user.username });
    const answer = await this.goAuth.send("/v1/auth/change-password", withUsername, clientAddress);
    if (answer.status !== 200) return passedThrough(answer);
    this.sessions.forget(session);
    return withCookie(new Response(null, { status: 204 }), endedSessionCookie());
  }

  async register({ request, clientAddress }: Incoming): Promise<Response> {
    const body = await bodyOf(request);
    if (!body) return bodyTooLarge();
    return passedThrough(await this.goAuth.send("/v1/auth/register", body, clientAddress));
  }
}

function jsonObjectOf(body: Uint8Array): Record<string, unknown> | null {
  try {
    // Invalid UTF-8 is refused rather than replaced, as go-auth does, so a password isn't changed.
    const value: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
