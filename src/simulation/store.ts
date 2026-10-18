import type { ShortUrl } from "@/domain/short-url";
import type { User } from "@/domain/user";

import type { Latency } from "./latency";

export interface StoredUser extends User {
  password: string;
}

/** What the simulated back ends keep, in memory only: a reload starts over. */
export class SimulationStore {
  readonly users = new Map<string, StoredUser>();
  readonly shortUrls = new Map<string, ShortUrl>();
  signedInUserId: string | null = null;

  userByUsername(username: string): StoredUser | undefined {
    return [...this.users.values()].find((user) => user.username === username);
  }

  shortUrlBySlug(slug: string): ShortUrl | undefined {
    return [...this.shortUrls.values()].find((shortUrl) => shortUrl.slug === slug);
  }
}

/** What the simulation reads from outside, so that tests can control it. */
export interface SimulationOptions {
  latency: Latency;
  now: () => Date;
  newId: () => string;
  newSlug: () => string;
}
