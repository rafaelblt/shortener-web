// The prefix makes the browser keep the cookie to this host, over https, on every path.
const NAME = "__Host-session";
const ATTRIBUTES = "Path=/; HttpOnly; Secure; SameSite=Strict";

/** The sealed session the request's cookie holds, if any. */
export function sealedSessionOf(request: Request): string | undefined {
  for (const pair of (request.headers.get("cookie") ?? "").split(";")) {
    const separator = pair.indexOf("=");
    if (separator !== -1 && pair.slice(0, separator).trim() === NAME) {
      return pair.slice(separator + 1).trim();
    }
  }
  return undefined;
}

/** The cookie that keeps the sealed session, for as long as its refresh token lasts. */
export function sessionCookie(sealed: string, maxAgeSeconds: number): string {
  return `${NAME}=${sealed}; Max-Age=${maxAgeSeconds}; ${ATTRIBUTES}`;
}

/** The cookie that makes the browser forget the session. */
export function endedSessionCookie(): string {
  return `${NAME}=; Max-Age=0; ${ATTRIBUTES}`;
}
