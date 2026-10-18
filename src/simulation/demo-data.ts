import type { ShortUrl } from "@/domain/short-url";

import type { SimulationOptions, SimulationStore } from "./store";

export const DEMO_CREDENTIALS = { username: "demo", password: "demo-password" } as const;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

type DemoShortUrl = Pick<ShortUrl, "slug" | "targetUrl" | "status" | "resolutionCount"> & {
  createdAgo: number;
  lastResolvedAgo: number | null;
};

// More than one page of the links page, with each status, counts from none to many, and target
// URLs from short to very long, so that every state of the pages shows.
const DEMO_SHORT_URLS: DemoShortUrl[] = [
  {
    slug: "autumn-launch",
    targetUrl:
      "https://example.com/campaigns/2026/autumn?utm_source=newsletter&utm_medium=email&utm_campaign=launch-week&utm_content=hero-button",
    status: "active",
    resolutionCount: 0,
    createdAgo: 20 * MINUTE,
    lastResolvedAgo: null,
  },
  {
    slug: "Bv7nQ2",
    targetUrl: "https://react.dev/reference/react/useActionState",
    status: "active",
    resolutionCount: 3,
    createdAgo: 5 * HOUR,
    lastResolvedAgo: 2 * HOUR,
  },
  {
    slug: "http-semantics",
    targetUrl: "https://www.rfc-editor.org/rfc/rfc9110.html",
    status: "active",
    resolutionCount: 1284,
    createdAgo: 2 * DAY,
    lastResolvedAgo: 4 * MINUTE,
  },
  {
    slug: "pg-index",
    targetUrl: "https://www.postgresql.org/docs/17/sql-createindex.html",
    status: "active",
    resolutionCount: 57,
    createdAgo: 4 * DAY,
    lastResolvedAgo: 1 * DAY,
  },
  {
    slug: "url-shortening",
    targetUrl: "https://en.wikipedia.org/wiki/URL_shortening",
    status: "deactivated",
    resolutionCount: 212,
    createdAgo: 9 * DAY,
    lastResolvedAgo: 6 * DAY,
  },
  {
    slug: "307",
    targetUrl: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/307",
    status: "active",
    resolutionCount: 9,
    createdAgo: 12 * DAY,
    lastResolvedAgo: 3 * DAY,
  },
  {
    slug: "k3Xq9T",
    targetUrl:
      "https://www.openstreetmap.org/search?query=Recife%2C%20Pernambuco#map=12/-8.0476/-34.8770",
    status: "active",
    resolutionCount: 41,
    createdAgo: 15 * DAY,
    lastResolvedAgo: 9 * HOUR,
  },
  {
    slug: "effective-go",
    targetUrl: "https://go.dev/doc/effective_go",
    status: "active",
    resolutionCount: 760,
    createdAgo: 21 * DAY,
    lastResolvedAgo: 30 * MINUTE,
  },
  {
    slug: "asyncio-tasks",
    targetUrl: "https://docs.python.org/3/library/asyncio-task.html",
    status: "active",
    resolutionCount: 18,
    createdAgo: 33 * DAY,
    lastResolvedAgo: 11 * DAY,
  },
  {
    slug: "rabbit-tutorials",
    targetUrl: "https://www.rabbitmq.com/tutorials",
    status: "deactivated",
    resolutionCount: 0,
    createdAgo: 47 * DAY,
    lastResolvedAgo: null,
  },
  {
    slug: "unicode-target",
    targetUrl: "https://例え.jp/パス",
    status: "active",
    resolutionCount: 2,
    createdAgo: 60 * DAY,
    lastResolvedAgo: 58 * DAY,
  },
  {
    slug: "conventional-commits",
    targetUrl: "https://www.conventionalcommits.org/en/v1.0.0/",
    status: "active",
    resolutionCount: 133,
    createdAgo: 95 * DAY,
    lastResolvedAgo: 2 * DAY,
  },
];

/** Adds the demo account and its short URLs. */
export function addDemoData(store: SimulationStore, options: SimulationOptions): void {
  const owner = { id: options.newId(), ...DEMO_CREDENTIALS };
  store.users.set(owner.id, owner);

  const now = options.now().getTime();
  for (const { createdAgo, lastResolvedAgo, ...shortUrl } of DEMO_SHORT_URLS) {
    const id = options.newId();
    store.shortUrls.set(id, {
      ...shortUrl,
      id,
      ownerId: owner.id,
      createdAt: new Date(now - createdAgo),
      lastResolvedAt: lastResolvedAgo === null ? null : new Date(now - lastResolvedAgo),
    });
  }
}
