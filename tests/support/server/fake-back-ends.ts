import type { Fetch } from "../../../server/back-end.ts";

export const GO_AUTH_URL = "http://go-auth.test";
export const SHORTENER_URL = "http://shortener.test";

export interface ReceivedRequest {
  method: string;
  url: URL;
  headers: Headers;
  body: string;
  /** The fields of a JSON body, as go-auth's are. */
  fields: Record<string, string>;
}

interface FakeUser {
  id: string;
  username: string;
  password: string;
}

interface FakeSession {
  userId: string;
  revoked: boolean;
}

interface FakeRefreshToken {
  sessionId: string;
  expiresAt: number;
  used: boolean;
}

interface FakeAccessToken {
  userId: string;
  expiresAt: number;
}

/**
 * go-auth and the shortener, in memory, as far as the server uses them, on a clock the tests move.
 * go-auth rotates refresh tokens, and revokes the session of one used twice, as the real one does.
 */
export class FakeBackEnds {
  /** The time, in milliseconds since the epoch. */
  now = Date.parse("2026-10-23T12:00:00Z");
  accessTokenSeconds = 1800;
  refreshTokenSeconds = 604_800;
  /** Whether the back ends can't be reached. */
  down = false;
  /** The paths of go-auth that fail, answering 500. */
  readonly failing = new Set<string>();
  /** Every request the back ends received, in order. */
  readonly received: ReceivedRequest[] = [];
  /** What the shortener answers: by default, what it received, as JSON. */
  shortener: (request: ReceivedRequest) => Response = echo;

  private readonly users = new Map<string, FakeUser>();
  private readonly sessions = new Map<string, FakeSession>();
  private readonly refreshTokens = new Map<string, FakeRefreshToken>();
  private readonly accessTokens = new Map<string, FakeAccessToken>();
  private lastId = 0;

  readonly fetch: Fetch = async (input, init) => {
    const request = new Request(input, init);
    if (this.down) throw new TypeError("fetch failed");
    const body = await request.text();
    const received = {
      method: request.method,
      url: new URL(request.url),
      headers: request.headers,
      body,
      fields: fieldsOf(body),
    };
    this.received.push(received);
    return received.url.origin === GO_AUTH_URL ? this.goAuth(received) : this.shortener(received);
  };

  addUser(username: string, password: string): FakeUser {
    const user = { id: `user-${this.newId()}`, username, password };
    this.users.set(username, user);
    return user;
  }

  /** The requests go-auth received at the path, such as `/v1/auth/refresh`. */
  receivedAt(path: string): ReceivedRequest[] {
    return this.received.filter((request) => request.url.pathname === path);
  }

  /** Whether the session of the refresh token was revoked. */
  isRevoked(refreshToken: string): boolean {
    const token = this.refreshTokens.get(refreshToken);
    return token === undefined || this.sessions.get(token.sessionId)?.revoked !== false;
  }

  /** Revokes every session of the user, as changing the password elsewhere does. */
  revokeSessionsOf(username: string): void {
    const user = this.users.get(username);
    for (const session of this.sessions.values()) {
      if (session.userId === user?.id) session.revoked = true;
    }
  }

  private goAuth({ url, fields }: ReceivedRequest): Response {
    if (this.failing.has(url.pathname)) return goAuthError(500, "internal_server_error");
    switch (url.pathname) {
      case "/v1/auth/register":
        return this.register(fields);
      case "/v1/auth/login":
        return this.login(fields);
      case "/v1/auth/me":
        return this.me(fields);
      case "/v1/auth/refresh":
        return this.refresh(fields);
      case "/v1/auth/logout":
        return this.logout(fields);
      case "/v1/auth/change-password":
        return this.changePassword(fields);
      default:
        return goAuthError(404, "route_not_found");
    }
  }

  private register({ username = "", password = "" }: Record<string, string>): Response {
    if (username.length < 3) {
      return Response.json(
        {
          error: {
            code: "validation_failed",
            message: "The input failed validation.",
            fields: [{ field: "username", code: "too_short", details: { min: 3 } }],
          },
        },
        { status: 422 },
      );
    }
    if (this.users.has(username)) return goAuthError(409, "username_already_exists");
    const { id } = this.addUser(username, password);
    return Response.json({ user: { id, username } }, { status: 201 });
  }

  private login({ username = "", password = "" }: Record<string, string>): Response {
    const user = this.users.get(username);
    if (user?.password !== password) return goAuthError(401, "invalid_credentials");
    const sessionId = `session-${this.newId()}`;
    this.sessions.set(sessionId, { userId: user.id, revoked: false });
    return this.tokens(sessionId, user.id);
  }

  private me({ access_token = "" }: Record<string, string>): Response {
    const token = this.accessTokens.get(access_token);
    const user = [...this.users.values()].find(({ id }) => id === token?.userId);
    if (!token || token.expiresAt <= this.now || !user) return goAuthError(401, "invalid_token");
    return Response.json({ user: { id: user.id, username: user.username } });
  }

  private refresh({ refresh_token = "" }: Record<string, string>): Response {
    const token = this.refreshTokens.get(refresh_token);
    const session = token && this.sessions.get(token.sessionId);
    if (!token || !session || session.revoked) return goAuthError(401, "invalid_token");
    if (token.used) {
      session.revoked = true;
      return goAuthError(401, "invalid_token");
    }
    if (token.expiresAt <= this.now) return goAuthError(401, "invalid_token");
    token.used = true;
    return this.tokens(token.sessionId, session.userId);
  }

  private logout({ refresh_token = "" }: Record<string, string>): Response {
    const token = this.refreshTokens.get(refresh_token);
    const session = token && this.sessions.get(token.sessionId);
    if (!session) return goAuthError(401, "invalid_token");
    session.revoked = true;
    return new Response(null, { status: 204 });
  }

  private changePassword(fields: Record<string, string>): Response {
    const { username = "", current_password = "", new_password = "" } = fields;
    if (new_password === current_password) {
      return Response.json(
        {
          error: {
            code: "validation_failed",
            message: "The input failed validation.",
            fields: [{ field: "new_password", code: "same_as_current", details: {} }],
          },
        },
        { status: 422 },
      );
    }
    const user = this.users.get(username);
    if (user?.password !== current_password) return goAuthError(401, "invalid_credentials");
    user.password = new_password;
    this.revokeSessionsOf(username);
    return Response.json({ user: { id: user.id, username } });
  }

  private tokens(sessionId: string, userId: string): Response {
    const access = `access-${this.newId()}`;
    const refresh = `refresh-${this.newId()}`;
    const accessExpiresAt = this.now + this.accessTokenSeconds * 1000;
    const refreshExpiresAt = this.now + this.refreshTokenSeconds * 1000;
    this.accessTokens.set(access, { userId, expiresAt: accessExpiresAt });
    this.refreshTokens.set(refresh, { sessionId, expiresAt: refreshExpiresAt, used: false });
    return Response.json({
      access_token: token(access, accessExpiresAt, this.accessTokenSeconds),
      refresh_token: token(refresh, refreshExpiresAt, this.refreshTokenSeconds),
    });
  }

  private newId(): number {
    return ++this.lastId;
  }
}

function fieldsOf(body: string): Record<string, string> {
  try {
    return JSON.parse(body) as Record<string, string>;
  } catch {
    return {};
  }
}

function token(value: string, expiresAt: number, expiresIn: number) {
  return { value, expires_at: new Date(expiresAt).toISOString(), expires_in: expiresIn };
}

function goAuthError(status: number, code: string): Response {
  return Response.json({ error: { code, message: "Not authorized." } }, { status });
}

function echo({ method, url, headers, body }: ReceivedRequest): Response {
  return Response.json({
    method,
    path: url.pathname + url.search,
    authorization: headers.get("authorization"),
    body,
  });
}
