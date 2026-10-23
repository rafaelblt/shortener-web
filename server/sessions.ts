import type { GoAuth, GoAuthUser, Tokens } from "./go-auth.ts";
import type { Session, SessionToken } from "./session.ts";

// Refreshed a minute before the access token expires, so that a request on its way doesn't reach
// the shortener with one that has just expired.
const REFRESH_MARGIN_MS = 60_000;
// How long a refreshed session is kept, for the requests that still carry the cookie it replaced.
// See docs/architecture/server.md#refreshing
const REFRESHED_SESSION_KEPT_MS = 5 * 60_000;

export interface SessionsDependencies {
  goAuth: GoAuth;
  now: () => number;
  newId: () => string;
}

/** Starts, refreshes and ends the sessions, each one a request at a time. */
export class Sessions {
  private readonly goAuth: GoAuth;
  private readonly now: () => number;
  private readonly newId: () => string;
  private readonly queues = new Map<string, Promise<void>>();
  private readonly refreshed = new Map<string, { session: Session; keptUntil: number }>();

  constructor({ goAuth, now, newId }: SessionsDependencies) {
    this.goAuth = goAuth;
    this.now = now;
    this.newId = newId;
  }

  start(tokens: Tokens, user: GoAuthUser): Session {
    return {
      id: this.newId(),
      user: { id: user.id, username: user.username },
      ...this.from(tokens),
    };
  }

  /**
   * The session, with an access token that lasts a while yet: the one of the cookie, the one
   * another request refreshed it to, or a new one. Null when go-auth refuses to refresh it.
   */
  async fresh(session: Session, clientAddress: string): Promise<Session | null> {
    if (!this.expiresSoon(session.accessToken)) return session;
    return this.oneAtATime(session.id, async () => {
      const latest = this.latest(session);
      if (!this.expiresSoon(latest.accessToken)) return latest;

      const tokens = await this.goAuth.refresh(latest.refreshToken.value, clientAddress);
      if (!tokens) {
        this.forget(session);
        return null;
      }
      const refreshed = { ...latest, ...this.from(tokens) };
      this.keep(refreshed);
      return refreshed;
    });
  }

  /** Ends the session at go-auth, after any refresh of it that is running. */
  async end(session: Session, clientAddress: string): Promise<void> {
    await this.oneAtATime(session.id, async () => {
      const latest = this.latest(session);
      this.forget(session);
      await this.goAuth.logout(latest.refreshToken.value, clientAddress);
    });
  }

  /** Stops keeping the refreshed session, which ended. */
  forget(session: Session): void {
    this.refreshed.delete(session.id);
  }

  private async oneAtATime<Value>(id: string, task: () => Promise<Value>): Promise<Value> {
    const result = (this.queues.get(id) ?? Promise.resolve()).then(task);
    const done = result.then(
      () => undefined,
      () => undefined,
    );
    this.queues.set(id, done);
    try {
      return await result;
    } finally {
      if (this.queues.get(id) === done) this.queues.delete(id);
    }
  }

  /** The session as another request refreshed it, when it did, or else as it is. */
  private latest(session: Session): Session {
    const kept = this.refreshed.get(session.id);
    return kept && kept.keptUntil > this.now() ? kept.session : session;
  }

  private keep(session: Session): void {
    const now = this.now();
    for (const [id, kept] of this.refreshed) if (kept.keptUntil <= now) this.refreshed.delete(id);
    this.refreshed.set(session.id, { session, keptUntil: now + REFRESHED_SESSION_KEPT_MS });
  }

  private from(tokens: Tokens): Pick<Session, "accessToken" | "refreshToken"> {
    // From when the answer arrived, by this server's clock, which may differ from go-auth's.
    const now = this.now();
    const token = ({ value, expires_in }: Tokens["access_token"]): SessionToken => ({
      value,
      expiresAt: now + expires_in * 1000,
    });
    return { accessToken: token(tokens.access_token), refreshToken: token(tokens.refresh_token) };
  }

  private expiresSoon(token: SessionToken): boolean {
    return token.expiresAt - this.now() <= REFRESH_MARGIN_MS;
  }
}
