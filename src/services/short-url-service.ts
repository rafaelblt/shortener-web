import type { ShortUrl } from "@/domain/short-url";

import type { InvalidInput, NotFound } from "./errors";
import type { Result } from "./result";

export interface PageRequest {
  limit: number;
  /** The `nextCursor` of the previous page; none for the first one. */
  cursor?: string;
}

/** A page of the short URLs of the user, newest first. */
export interface ShortUrlPage {
  items: ShortUrl[];
  /** Null on the last page. */
  nextCursor: string | null;
}

export interface NewShortUrl {
  targetUrl: string;
  /** Generated when left out. */
  slug?: string;
}

/** What to change; a value left out doesn't change. */
export interface ShortUrlChanges {
  targetUrl?: string;
  slug?: string;
}

export type CreationError = { code: "slug_taken" } | InvalidInput<"targetUrl" | "slug">;

export type UpdateError =
  | { code: "slug_taken" }
  | { code: "nothing_to_update" }
  | NotFound
  | InvalidInput<"targetUrl" | "slug">;

export type ResolutionError = NotFound | { code: "deactivated" };

/**
 * The short URLs of the signed-in user. A short URL of another user is `not_found`, as one that
 * doesn't exist. Every operation but `resolve` throws NotSignedInError without a signed-in user.
 */
export interface ShortUrlService {
  list(request: PageRequest): Promise<ShortUrlPage>;
  get(id: string): Promise<Result<ShortUrl, NotFound>>;
  create(shortUrl: NewShortUrl): Promise<Result<ShortUrl, CreationError>>;
  update(id: string, changes: ShortUrlChanges): Promise<Result<ShortUrl, UpdateError>>;
  enable(id: string): Promise<Result<ShortUrl, NotFound>>;
  disable(id: string): Promise<Result<ShortUrl, NotFound>>;
  delete(id: string): Promise<Result<void, NotFound>>;
  /** Answers the target URL of a slug, for anyone, and counts the resolution. */
  resolve(slug: string): Promise<Result<string, ResolutionError>>;
}
