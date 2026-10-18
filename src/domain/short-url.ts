import type { Issue } from "./issue";

export type ShortUrlStatus = "active" | "deactivated";

export interface ShortUrl {
  id: string;
  slug: string;
  targetUrl: string;
  ownerId: string;
  status: ShortUrlStatus;
  /** How many times the slug was resolved while the short URL was active. */
  resolutionCount: number;
  createdAt: Date;
  lastResolvedAt: Date | null;
}

export const SLUG_MIN_LENGTH = 3;
export const SLUG_MAX_LENGTH = 30;

const SLUG_CHARACTERS = /^[A-Za-z0-9_-]+$/;

// The Unicode categories Other and Separator: control and invisible characters, and every space,
// which could make a URL lead somewhere other than where it looks to.
const INVISIBLE_OR_SPACE = /[\p{C}\p{Z}]/u;
const HTTPS_WITH_HOST = /^https:\/\/[^/?#]+/i;

/** Slugs are case-sensitive: `abc` and `ABC` are different slugs. */
export function slugIssue(slug: string): Issue | undefined {
  if (slug.length === 0) return "missing";
  if (!SLUG_CHARACTERS.test(slug)) return "invalid_format";
  if (slug.length < SLUG_MIN_LENGTH) return "too_short";
  if (slug.length > SLUG_MAX_LENGTH) return "too_long";
  return undefined;
}

export function targetUrlIssue(targetUrl: string): Issue | undefined {
  if (targetUrl.length === 0) return "missing";
  const isWellFormed =
    !INVISIBLE_OR_SPACE.test(targetUrl) &&
    HTTPS_WITH_HOST.test(targetUrl) &&
    URL.canParse(targetUrl);
  return isWellFormed ? undefined : "invalid_format";
}
