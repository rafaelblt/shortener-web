import type { FieldIssues } from "@/domain/issue";
import { hasIssues } from "@/domain/issue";
import type { ShortUrl } from "@/domain/short-url";
import { slugIssue, targetUrlIssue } from "@/domain/short-url";
import type { NotFound } from "@/services/errors";
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

import { wait } from "./latency";
import type { SimulationOptions, SimulationStore } from "./store";

const NOT_FOUND: NotFound = { code: "not_found" };

export class SimulatedShortUrlService implements ShortUrlService {
  private readonly store: SimulationStore;
  private readonly options: SimulationOptions;

  constructor(store: SimulationStore, options: SimulationOptions) {
    this.store = store;
    this.options = options;
  }

  async list({ limit, cursor }: PageRequest): Promise<ShortUrlPage> {
    await wait(this.options.latency);
    const ownerId = this.requireSignedInUserId();
    const owned = [...this.store.shortUrls.values()]
      .filter((shortUrl) => shortUrl.ownerId === ownerId)
      .sort(newestFirst);
    const remaining = cursor === undefined ? owned : owned.filter(sortsAfterCursor(cursor));
    const items = remaining.slice(0, limit);
    const last = items.at(-1);
    return {
      items: items.map(copy),
      nextCursor: remaining.length > limit && last ? cursorOf(last) : null,
    };
  }

  async get(id: string): Promise<Result<ShortUrl, NotFound>> {
    await wait(this.options.latency);
    const shortUrl = this.ownedShortUrl(id);
    return shortUrl ? ok(copy(shortUrl)) : err(NOT_FOUND);
  }

  async create({ targetUrl, slug }: NewShortUrl): Promise<Result<ShortUrl, CreationError>> {
    await wait(this.options.latency);
    const ownerId = this.requireSignedInUserId();
    const fields: FieldIssues<"targetUrl" | "slug"> = {
      targetUrl: targetUrlIssue(targetUrl),
      slug: slug === undefined ? undefined : slugIssue(slug),
    };
    if (hasIssues(fields)) return err({ code: "invalid_input", fields });
    if (slug !== undefined && this.store.shortUrlBySlug(slug)) return err({ code: "slug_taken" });

    const shortUrl: ShortUrl = {
      id: this.options.newId(),
      slug: slug ?? this.unusedSlug(),
      targetUrl,
      ownerId,
      status: "active",
      resolutionCount: 0,
      createdAt: this.options.now(),
      lastResolvedAt: null,
    };
    this.store.shortUrls.set(shortUrl.id, shortUrl);
    return ok(copy(shortUrl));
  }

  async update(id: string, changes: ShortUrlChanges): Promise<Result<ShortUrl, UpdateError>> {
    await wait(this.options.latency);
    this.requireSignedInUserId();
    const { targetUrl, slug } = changes;
    if (targetUrl === undefined && slug === undefined) return err({ code: "nothing_to_update" });
    const fields: FieldIssues<"targetUrl" | "slug"> = {
      targetUrl: targetUrl === undefined ? undefined : targetUrlIssue(targetUrl),
      slug: slug === undefined ? undefined : slugIssue(slug),
    };
    if (hasIssues(fields)) return err({ code: "invalid_input", fields });

    const shortUrl = this.ownedShortUrl(id);
    if (!shortUrl) return err(NOT_FOUND);
    const holder = slug === undefined ? undefined : this.store.shortUrlBySlug(slug);
    if (holder && holder.id !== id) return err({ code: "slug_taken" });

    shortUrl.targetUrl = targetUrl ?? shortUrl.targetUrl;
    shortUrl.slug = slug ?? shortUrl.slug;
    return ok(copy(shortUrl));
  }

  async enable(id: string): Promise<Result<ShortUrl, NotFound>> {
    return this.changeStatus(id, "active");
  }

  async disable(id: string): Promise<Result<ShortUrl, NotFound>> {
    return this.changeStatus(id, "deactivated");
  }

  async delete(id: string): Promise<Result<void, NotFound>> {
    await wait(this.options.latency);
    if (!this.ownedShortUrl(id)) return err(NOT_FOUND);
    this.store.shortUrls.delete(id);
    return ok(undefined);
  }

  async resolve(slug: string): Promise<Result<string, ResolutionError>> {
    await wait(this.options.latency);
    const shortUrl = this.store.shortUrlBySlug(slug);
    if (!shortUrl) return err(NOT_FOUND);
    if (shortUrl.status === "deactivated") return err({ code: "deactivated" });

    shortUrl.resolutionCount += 1;
    shortUrl.lastResolvedAt = this.options.now();
    return ok(shortUrl.targetUrl);
  }

  private async changeStatus(
    id: string,
    status: ShortUrl["status"],
  ): Promise<Result<ShortUrl, NotFound>> {
    await wait(this.options.latency);
    const shortUrl = this.ownedShortUrl(id);
    if (!shortUrl) return err(NOT_FOUND);
    shortUrl.status = status;
    return ok(copy(shortUrl));
  }

  private requireSignedInUserId(): string {
    const id = this.store.signedInUserId;
    if (id === null) throw new NotSignedInError();
    return id;
  }

  private ownedShortUrl(id: string): ShortUrl | undefined {
    const shortUrl = this.store.shortUrls.get(id);
    return shortUrl?.ownerId === this.requireSignedInUserId() ? shortUrl : undefined;
  }

  private unusedSlug(): string {
    let slug = this.options.newSlug();
    while (this.store.shortUrlBySlug(slug)) slug = this.options.newSlug();
    return slug;
  }
}

/** Callers get copies, so that nothing outside changes what is stored. */
function copy(shortUrl: ShortUrl): ShortUrl {
  return structuredClone(shortUrl);
}

interface SortKey {
  createdAt: Date;
  id: string;
}

function newestFirst(a: SortKey, b: SortKey): number {
  return b.createdAt.getTime() - a.createdAt.getTime() || compareText(b.id, a.id);
}

function compareText(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function cursorOf({ createdAt, id }: SortKey): string {
  return `${createdAt.getTime()}_${id}`;
}

function sortsAfterCursor(cursor: string): (shortUrl: ShortUrl) => boolean {
  const [time = "", id = ""] = cursor.split("_");
  const cursorKey: SortKey = { createdAt: new Date(Number(time)), id };
  return (shortUrl) => newestFirst(cursorKey, shortUrl) < 0;
}
