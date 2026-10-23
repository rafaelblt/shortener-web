import type { Session } from "./session.ts";
import { sealSession, unsealSession } from "./session.ts";
import { endedSessionCookie, sealedSessionOf, sessionCookie } from "./session-cookie.ts";
import type { Sessions } from "./sessions.ts";

/** The session of a request, and the cookie that tells the browser how it changed, if it did. */
export interface RequestSession {
  session: Session | null;
  cookie: string | undefined;
}

export interface SessionCookiesDependencies {
  key: Buffer;
  sessions: Sessions;
  now: () => number;
}

/** Reads the sessions from the cookies of the requests, and writes them into the answers'. */
export class SessionCookies {
  private readonly key: Buffer;
  private readonly sessions: Sessions;
  private readonly now: () => number;

  constructor({ key, sessions, now }: SessionCookiesDependencies) {
    this.key = key;
    this.sessions = sessions;
    this.now = now;
  }

  /** The session of the cookie, as it is, which may have ended since. */
  of(request: Request): Session | null {
    const sealed = sealedSessionOf(request);
    return sealed === undefined ? null : unsealSession(sealed, this.key);
  }

  /** The session of the cookie, refreshed if need be, or none, forgetting a cookie that ended. */
  async freshOf(request: Request, clientAddress: string): Promise<RequestSession> {
    if (sealedSessionOf(request) === undefined) return { session: null, cookie: undefined };
    const session = this.of(request);
    const fresh = session && (await this.sessions.fresh(session, clientAddress));
    if (!fresh) return { session: null, cookie: endedSessionCookie() };
    return { session: fresh, cookie: fresh === session ? undefined : this.cookieOf(fresh) };
  }

  cookieOf(session: Session): string {
    const maxAgeSeconds = Math.floor((session.refreshToken.expiresAt - this.now()) / 1000);
    return sessionCookie(sealSession(session, this.key), maxAgeSeconds);
  }
}
