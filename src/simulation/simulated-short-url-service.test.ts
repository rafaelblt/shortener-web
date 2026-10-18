import { describe, expect, it } from "vitest";

import type { Services } from "@/services/services";
import { NotSignedInError } from "@/services/errors";
import { err, ok } from "@/services/result";
import {
  ALICE,
  BOB,
  createTestServices,
  GENERATED_SLUG,
  NOW,
  registerAndSignIn,
  unwrap,
} from "@tests/support/simulation";

const TARGET_URL = "https://example.com/a/long/path";
const OTHER_TARGET_URL = "https://example.com/another/path";

async function aliceServices(settings: Parameters<typeof createTestServices>[0] = {}) {
  const services = createTestServices(settings);
  const alice = await registerAndSignIn(services, ALICE);
  return { services, alice };
}

/** Creates a short URL as Bob, and signs Alice in again. */
async function createAsBob(services: Services, slug: string) {
  await services.auth.signOut();
  await registerAndSignIn(services, BOB);
  const shortUrl = unwrap(await services.shortUrls.create({ targetUrl: TARGET_URL, slug }));
  await services.auth.signOut();
  unwrap(await services.auth.signIn(ALICE));
  return shortUrl;
}

describe("create", () => {
  it("creates an active short URL owned by the user, never resolved", async () => {
    const { services, alice } = await aliceServices();

    const shortUrl = unwrap(
      await services.shortUrls.create({ targetUrl: TARGET_URL, slug: "my-slug" }),
    );

    expect(shortUrl).toEqual({
      id: "id-2",
      slug: "my-slug",
      targetUrl: TARGET_URL,
      ownerId: alice.id,
      status: "active",
      resolutionCount: 0,
      createdAt: NOW,
      lastResolvedAt: null,
    });
  });

  it("generates the slug when none is given", async () => {
    const { services } = await aliceServices();

    const shortUrl = unwrap(await services.shortUrls.create({ targetUrl: TARGET_URL }));

    expect(shortUrl.slug).toBe(GENERATED_SLUG);
  });

  it("generates another slug while the generated one is taken", async () => {
    const generated = ["taken1", "taken1", "free01"];
    const { services } = await aliceServices({ newSlug: () => generated.shift() ?? "" });
    unwrap(await services.shortUrls.create({ targetUrl: TARGET_URL, slug: "taken1" }));

    const shortUrl = unwrap(await services.shortUrls.create({ targetUrl: TARGET_URL }));

    expect(shortUrl.slug).toBe("free01");
  });

  it("gives up when every generated slug is taken", async () => {
    const { services } = await aliceServices({ newSlug: () => "taken1" });
    unwrap(await services.shortUrls.create({ targetUrl: TARGET_URL, slug: "taken1" }));

    await expect(services.shortUrls.create({ targetUrl: TARGET_URL })).rejects.toThrow(
      "No unused slug",
    );
  });

  it("reports every value that breaks a rule", async () => {
    const { services } = await aliceServices();

    expect(await services.shortUrls.create({ targetUrl: "http://example.com", slug: "a" })).toEqual(
      err({ code: "invalid_input", fields: { targetUrl: "invalid_format", slug: "too_short" } }),
    );
  });

  it("refuses a slug another user has", async () => {
    const { services } = await aliceServices();
    await createAsBob(services, "bobs-slug");

    expect(await services.shortUrls.create({ targetUrl: TARGET_URL, slug: "bobs-slug" })).toEqual(
      err({ code: "slug_taken" }),
    );
  });

  it("tells slugs apart by their case", async () => {
    const { services } = await aliceServices();
    unwrap(await services.shortUrls.create({ targetUrl: TARGET_URL, slug: "abc" }));

    expect((await services.shortUrls.create({ targetUrl: TARGET_URL, slug: "ABC" })).ok).toBe(true);
  });
});

describe("list", () => {
  async function servicesWithShortUrls(count: number) {
    let time = NOW.getTime();
    const { services } = await aliceServices({ now: () => new Date((time += 1000)) });
    for (let index = 1; index <= count; index++) {
      unwrap(await services.shortUrls.create({ targetUrl: TARGET_URL, slug: `slug-${index}` }));
    }
    return services;
  }

  it("answers the short URLs newest first, a page at a time", async () => {
    const services = await servicesWithShortUrls(5);

    const first = await services.shortUrls.list({ limit: 2 });
    const second = await services.shortUrls.list({ limit: 2, cursor: first.nextCursor ?? "" });
    const last = await services.shortUrls.list({ limit: 2, cursor: second.nextCursor ?? "" });

    expect(first.items.map((shortUrl) => shortUrl.slug)).toEqual(["slug-5", "slug-4"]);
    expect(second.items.map((shortUrl) => shortUrl.slug)).toEqual(["slug-3", "slug-2"]);
    expect(last).toEqual({
      items: [expect.objectContaining({ slug: "slug-1" })],
      nextCursor: null,
    });
  });

  it("pages through short URLs created at the same moment without repeating one", async () => {
    const { services } = await aliceServices();
    for (const slug of ["first", "second", "third"]) {
      unwrap(await services.shortUrls.create({ targetUrl: TARGET_URL, slug }));
    }

    const slugs: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await services.shortUrls.list({ limit: 1, ...(cursor && { cursor }) });
      slugs.push(...page.items.map((shortUrl) => shortUrl.slug));
      cursor = page.nextCursor ?? undefined;
    } while (cursor);

    expect(slugs).toEqual(["third", "second", "first"]);
  });

  it("has no next page when the last page is full", async () => {
    const services = await servicesWithShortUrls(2);

    expect((await services.shortUrls.list({ limit: 2 })).nextCursor).toBeNull();
  });

  it("keeps a cursor working after its short URL is deleted", async () => {
    const services = await servicesWithShortUrls(3);
    const first = await services.shortUrls.list({ limit: 1 });
    unwrap(await services.shortUrls.delete(first.items[0]?.id ?? ""));

    const second = await services.shortUrls.list({ limit: 1, cursor: first.nextCursor ?? "" });

    expect(second.items.map((shortUrl) => shortUrl.slug)).toEqual(["slug-2"]);
  });

  it("answers only the short URLs of the user", async () => {
    const { services } = await aliceServices();
    await createAsBob(services, "bobs-slug");

    expect(await services.shortUrls.list({ limit: 10 })).toEqual({ items: [], nextCursor: null });
  });
});

describe("get", () => {
  it("answers a short URL of the user", async () => {
    const { services } = await aliceServices();
    const created = unwrap(await services.shortUrls.create({ targetUrl: TARGET_URL }));

    expect(await services.shortUrls.get(created.id)).toEqual(ok(created));
  });

  it("answers not_found for a short URL of another user, as for an unknown one", async () => {
    const { services } = await aliceServices();
    const bobs = await createAsBob(services, "bobs-slug");

    expect(await services.shortUrls.get(bobs.id)).toEqual(err({ code: "not_found" }));
    expect(await services.shortUrls.get("unknown")).toEqual(err({ code: "not_found" }));
  });

  it("answers a copy, which changing doesn't change the stored one", async () => {
    const { services } = await aliceServices();
    const created = unwrap(await services.shortUrls.create({ targetUrl: TARGET_URL }));

    created.slug = "changed";

    expect(unwrap(await services.shortUrls.get(created.id)).slug).toBe(GENERATED_SLUG);
  });
});

describe("update", () => {
  async function aliceWithShortUrl() {
    const { services } = await aliceServices();
    const shortUrl = unwrap(
      await services.shortUrls.create({ targetUrl: TARGET_URL, slug: "my-slug" }),
    );
    return { services, shortUrl };
  }

  it.each([
    { case: "the target URL", changes: { targetUrl: OTHER_TARGET_URL } },
    { case: "the slug", changes: { slug: "new-slug" } },
    { case: "both", changes: { targetUrl: OTHER_TARGET_URL, slug: "new-slug" } },
    { case: "the slug to the one it has", changes: { slug: "my-slug" } },
  ])("changes $case", async ({ changes }) => {
    const { services, shortUrl } = await aliceWithShortUrl();

    const updated = unwrap(await services.shortUrls.update(shortUrl.id, changes));

    expect(updated).toEqual({ ...shortUrl, ...changes });
    expect(await services.shortUrls.get(shortUrl.id)).toEqual(ok(updated));
  });

  it("frees the old slug", async () => {
    const { services, shortUrl } = await aliceWithShortUrl();
    unwrap(await services.shortUrls.update(shortUrl.id, { slug: "new-slug" }));

    expect((await services.shortUrls.create({ targetUrl: TARGET_URL, slug: "my-slug" })).ok).toBe(
      true,
    );
  });

  it("answers nothing_to_update without a value to change", async () => {
    const { services, shortUrl } = await aliceWithShortUrl();

    expect(await services.shortUrls.update(shortUrl.id, {})).toEqual(
      err({ code: "nothing_to_update" }),
    );
  });

  it("reports the values that break a rule, before looking the short URL up", async () => {
    const { services } = await aliceWithShortUrl();

    expect(
      await services.shortUrls.update("unknown", { targetUrl: "ftp://example.com", slug: "a b" }),
    ).toEqual(
      err({
        code: "invalid_input",
        fields: { targetUrl: "invalid_format", slug: "invalid_format" },
      }),
    );
  });

  it("answers not_found for a short URL of another user", async () => {
    const { services } = await aliceWithShortUrl();
    const bobs = await createAsBob(services, "bobs-slug");

    expect(await services.shortUrls.update(bobs.id, { slug: "stolen" })).toEqual(
      err({ code: "not_found" }),
    );
  });

  it("changes nothing when the new slug is taken", async () => {
    const { services, shortUrl } = await aliceWithShortUrl();
    unwrap(await services.shortUrls.create({ targetUrl: TARGET_URL, slug: "taken" }));

    expect(
      await services.shortUrls.update(shortUrl.id, { targetUrl: OTHER_TARGET_URL, slug: "taken" }),
    ).toEqual(err({ code: "slug_taken" }));
    expect(await services.shortUrls.get(shortUrl.id)).toEqual(ok(shortUrl));
  });
});

describe("enable and disable", () => {
  it("deactivate and activate the short URL again", async () => {
    const { services } = await aliceServices();
    const { id } = unwrap(await services.shortUrls.create({ targetUrl: TARGET_URL }));

    expect(unwrap(await services.shortUrls.disable(id)).status).toBe("deactivated");
    expect(unwrap(await services.shortUrls.enable(id)).status).toBe("active");
  });

  it("answer not_found for a short URL of another user", async () => {
    const { services } = await aliceServices();
    const bobs = await createAsBob(services, "bobs-slug");

    expect(await services.shortUrls.disable(bobs.id)).toEqual(err({ code: "not_found" }));
    expect(await services.shortUrls.enable(bobs.id)).toEqual(err({ code: "not_found" }));
  });
});

describe("delete", () => {
  it("deletes the short URL, and frees its slug", async () => {
    const { services } = await aliceServices();
    const { id } = unwrap(await services.shortUrls.create({ targetUrl: TARGET_URL, slug: "gone" }));

    expect(await services.shortUrls.delete(id)).toEqual(ok(undefined));

    expect(await services.shortUrls.get(id)).toEqual(err({ code: "not_found" }));
    expect((await services.shortUrls.create({ targetUrl: TARGET_URL, slug: "gone" })).ok).toBe(
      true,
    );
  });

  it("answers not_found for a short URL of another user", async () => {
    const { services } = await aliceServices();
    const bobs = await createAsBob(services, "bobs-slug");

    expect(await services.shortUrls.delete(bobs.id)).toEqual(err({ code: "not_found" }));
  });
});

describe("resolve", () => {
  it("answers the target URL, and counts the resolution, for anyone", async () => {
    const resolvedAt = new Date("2026-10-19T08:30:00Z");
    let now = NOW;
    const { services } = await aliceServices({ now: () => now });
    const { id } = unwrap(
      await services.shortUrls.create({ targetUrl: TARGET_URL, slug: "go-to" }),
    );
    await services.auth.signOut();
    now = resolvedAt;

    expect(await services.shortUrls.resolve("go-to")).toEqual(ok(TARGET_URL));

    unwrap(await services.auth.signIn(ALICE));
    expect(unwrap(await services.shortUrls.get(id))).toMatchObject({
      resolutionCount: 1,
      lastResolvedAt: resolvedAt,
    });
  });

  it("answers deactivated for a deactivated short URL, and counts nothing", async () => {
    const { services } = await aliceServices();
    const { id } = unwrap(await services.shortUrls.create({ targetUrl: TARGET_URL, slug: "off" }));
    unwrap(await services.shortUrls.disable(id));

    expect(await services.shortUrls.resolve("off")).toEqual(err({ code: "deactivated" }));
    expect(unwrap(await services.shortUrls.get(id)).resolutionCount).toBe(0);
  });

  it("answers not_found for an unknown slug, matching its case", async () => {
    const { services } = await aliceServices();
    unwrap(await services.shortUrls.create({ targetUrl: TARGET_URL, slug: "abc" }));

    expect(await services.shortUrls.resolve("ABC")).toEqual(err({ code: "not_found" }));
  });
});

describe("without a signed-in user", () => {
  it.each([
    { operation: "list", call: (services: Services) => services.shortUrls.list({ limit: 1 }) },
    { operation: "get", call: (services: Services) => services.shortUrls.get("id") },
    {
      operation: "create",
      call: (services: Services) => services.shortUrls.create({ targetUrl: TARGET_URL }),
    },
    {
      operation: "update",
      call: (services: Services) => services.shortUrls.update("id", { slug: "slug" }),
    },
    { operation: "enable", call: (services: Services) => services.shortUrls.enable("id") },
    { operation: "disable", call: (services: Services) => services.shortUrls.disable("id") },
    { operation: "delete", call: (services: Services) => services.shortUrls.delete("id") },
  ])("$operation throws NotSignedInError", async ({ call }) => {
    await expect(call(createTestServices())).rejects.toThrow(NotSignedInError);
  });
});
