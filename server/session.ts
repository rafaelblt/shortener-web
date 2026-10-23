import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const CIPHER = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;

/**
 * The session of a signed-in user, which the browser keeps in a cookie, encrypted, so that it can
 * neither read it nor change it. See docs/architecture/server.md#sessions
 */
export interface Session {
  /** Tells the session apart, so that it is refreshed one request at a time. */
  id: string;
  user: SessionUser;
  accessToken: SessionToken;
  refreshToken: SessionToken;
}

export interface SessionUser {
  id: string;
  username: string;
}

export interface SessionToken {
  value: string;
  /** When it expires, in milliseconds since the epoch, by the clock of this server. */
  expiresAt: number;
}

/** The session, encrypted and authenticated with the key, as text a cookie can hold. */
export function sealSession(session: Session, key: Buffer): string {
  // A new IV every time: GCM must never use one twice with the same key.
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(CIPHER, key, iv, { authTagLength: TAG_BYTES });
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(session), "utf8"), cipher.final()]);
  return [iv, encrypted, cipher.getAuthTag()].map((part) => part.toString("base64url")).join(".");
}

/** The session that `sealSession` sealed, or null for a text that it didn't seal with this key. */
export function unsealSession(sealed: string, key: Buffer): Session | null {
  const [iv, encrypted, tag, ...rest] = sealed
    .split(".")
    .map((part) => Buffer.from(part, "base64url"));
  if (iv?.length !== IV_BYTES || tag?.length !== TAG_BYTES || !encrypted || rest.length > 0) {
    return null;
  }
  try {
    // The length of the tag is fixed, or else a shorter one, easier to forge, would be accepted.
    const decipher = createDecipheriv(CIPHER, key, iv, { authTagLength: TAG_BYTES });
    decipher.setAuthTag(tag);
    const json = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
    const value: unknown = JSON.parse(json);
    return isSession(value) ? value : null;
  } catch {
    return null;
  }
}

function isSession(value: unknown): value is Session {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isRecord(value.user) &&
    typeof value.user.id === "string" &&
    typeof value.user.username === "string" &&
    isToken(value.accessToken) &&
    isToken(value.refreshToken)
  );
}

function isToken(value: unknown): value is SessionToken {
  return isRecord(value) && typeof value.value === "string" && typeof value.expiresAt === "number";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
