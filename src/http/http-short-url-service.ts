import type { components } from "@contracts/shortener";
import type { ShortUrl, ShortUrlStatus } from "@/domain/short-url";
import type { InvalidInput, NotFound } from "@/services/errors";
import { NotSignedInError } from "@/services/errors";
import type { Result } from "@/services/result";
import { err, ok } from "@/services/result";
import type {
  CreationError,
  NewShortUrl,
  PageRequest,
  ResolutionError,
  ShortUrlChanges,
  ShortUrlPage,
  ShortUrlService,
  UpdateError,
} from "@/services/short-url-service";

import { fieldIssuesOf } from "./field-issues";
import type { Fetch } from "./server-requests";
import { bodyOf, errorBodyOf, send, unexpected } from "./server-requests";

type Schemas = components["schemas"];
type ShortUrlDetails = Schemas["ShortURLDetails"];
type ShortenerError = Schemas["ErrorContent"];

const SHORT_URLS = "/api/v1/shorturls";
const NOT_FOUND: NotFound = { code: "not_found" };
const FIELD_NAMES = { target_url: "targetUrl", slug: "slug" } as const;

/**
 * The short URLs, through the server of the app, which passes the requests to the shortener as
 * they are. See docs/architecture/server.md#the-shortener
 */
export class HttpShortUrlService implements ShortUrlService {
  private readonly fetch: Fetch;

  constructor(fetchFunction: Fetch) {
    this.fetch = fetchFunction;
  }

  async list({ limit, cursor }: PageRequest): Promise<ShortUrlPage> {
    const query = new URLSearchParams({ limit: String(limit) });
    if (cursor !== undefined) query.set("cursor", cursor);
    const answer = await send(this.fetch, "GET", `${SHORT_URLS}?${query}`);
    if (answer.status === 401) throw new NotSignedInError();
    if (answer.status !== 200) throw unexpected(answer);

    const page = await bodyOf<Schemas["ShortURLPageContent"]>(answer);
    return { items: page.items.map(shortUrlOf), nextCursor: page.next_cursor };
  }

  get(id: string): Promise<Result<ShortUrl, NotFound>> {
    return this.ofId(id, "GET", "");
  }

  async create({ targetUrl, slug }: NewShortUrl): Promise<Result<ShortUrl, CreationError>> {
    const answer = await send(this.fetch, "POST", SHORT_URLS, { target_url: targetUrl, slug });
    if (answer.status === 201) return ok(shortUrlOf(await bodyOf<ShortUrlDetails>(answer)));

    const error = await this.error(answer);
    if (error.code === "slug_taken") return err({ code: "slug_taken" });
    if (error.code === "invalid_input") return err(invalidInput(error));
    throw unexpected(answer);
  }

  async update(id: string, changes: ShortUrlChanges): Promise<Result<ShortUrl, UpdateError>> {
    const body = { target_url: changes.targetUrl, slug: changes.slug };
    const answer = await send(this.fetch, "PATCH", `${SHORT_URLS}/${encodeURIComponent(id)}`, body);
    if (answer.status === 200) return ok(shortUrlOf(await bodyOf<ShortUrlDetails>(answer)));

    const error = await this.error(answer);
    if (isNotFound(error)) return err(NOT_FOUND);
    if (error.code === "slug_taken" || error.code === "nothing_to_update") {
      return err({ code: error.code });
    }
    if (error.code === "invalid_input") return err(invalidInput(error));
    throw unexpected(answer);
  }

  enable(id: string): Promise<Result<ShortUrl, NotFound>> {
    return this.ofId(id, "POST", "/enable");
  }

  disable(id: string): Promise<Result<ShortUrl, NotFound>> {
    return this.ofId(id, "POST", "/disable");
  }

  async delete(id: string): Promise<Result<void, NotFound>> {
    const answer = await send(this.fetch, "DELETE", `${SHORT_URLS}/${encodeURIComponent(id)}`);
    if (answer.status === 204) return ok(undefined);
    if (isNotFound(await this.error(answer))) return err(NOT_FOUND);
    throw unexpected(answer);
  }

  async resolve(slug: string): Promise<Result<string, ResolutionError>> {
    const answer = await send(this.fetch, "GET", `/api/v1/slugs/${encodeURIComponent(slug)}`);
    if (answer.status === 200)
      return ok((await bodyOf<Schemas["ResolvedSlug"]>(answer)).target_url);

    const error = await errorBodyOf<ShortenerError>(answer);
    if (error.code === "shorturl_not_found") return err(NOT_FOUND);
    if (error.code === "shorturl_deactivated") return err({ code: "deactivated" });
    throw unexpected(answer);
  }

  /** What an operation on one short URL answers: the short URL, or that there is none. */
  private async ofId(
    id: string,
    method: string,
    action: string,
  ): Promise<Result<ShortUrl, NotFound>> {
    const answer = await send(
      this.fetch,
      method,
      `${SHORT_URLS}/${encodeURIComponent(id)}${action}`,
    );
    if (answer.status === 200) return ok(shortUrlOf(await bodyOf<ShortUrlDetails>(answer)));
    if (isNotFound(await this.error(answer))) return err(NOT_FOUND);
    throw unexpected(answer);
  }

  /** The error of an operation that needs a signed-in user, which throws when there is none. */
  private async error(answer: Response): Promise<ShortenerError> {
    if (answer.status === 401) throw new NotSignedInError();
    return errorBodyOf<ShortenerError>(answer);
  }
}

function shortUrlOf(details: ShortUrlDetails): ShortUrl {
  return {
    id: details.id,
    slug: details.slug,
    targetUrl: details.target_url,
    ownerId: details.owner_id,
    // The schema says only that it is text; the shortener's API says it is one of these.
    status: details.status as ShortUrlStatus,
    resolutionCount: details.resolution_count,
    createdAt: new Date(details.created_at),
    lastResolvedAt: details.last_resolved_at === null ? null : new Date(details.last_resolved_at),
  };
}

/**
 * Whether the short URL wasn't found. An ID that isn't a UUID, which the shortener refuses as
 * invalid input, names no short URL either.
 */
function isNotFound(error: ShortenerError): boolean {
  if (error.code === "shorturl_not_found") return true;
  return error.code === "invalid_input" && (error.fields ?? []).some(({ field }) => field === "id");
}

function invalidInput(error: ShortenerError): InvalidInput<"targetUrl" | "slug"> {
  const issues = (error.fields ?? []).flatMap(({ field, issues }) =>
    issues.map(({ code }) => ({ field, code })),
  );
  return { code: "invalid_input", fields: fieldIssuesOf(issues, FIELD_NAMES) };
}
