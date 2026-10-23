import { describe, expect, it } from "vitest";

import { NotSignedInError } from "@/services/errors";
import { err, ok } from "@/services/result";
import { serverAnswering, shortenerError } from "@tests/support/server-answers";

import { HttpShortUrlService } from "./http-short-url-service";
import { UnexpectedAnswerError } from "./server-requests";

const ID = "0199b2c4-7a3e-7c1a-9b5e-3f2d4c6b8a20";
const DETAILS = {
  id: ID,
  slug: "my-slug",
  target_url: "https://example.com/a",
  owner_id: "0199b2c4-7a3e-7c1a-9b5e-3f2d4c6b8a10",
  status: "deactivated",
  resolution_count: 3,
  created_at: "2026-01-01T00:00:00Z",
  last_resolved_at: "2026-01-02T12:30:00Z",
};
const SHORT_URL = {
  id: ID,
  slug: "my-slug",
  targetUrl: "https://example.com/a",
  ownerId: "0199b2c4-7a3e-7c1a-9b5e-3f2d4c6b8a10",
  status: "deactivated",
  resolutionCount: 3,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  lastResolvedAt: new Date("2026-01-02T12:30:00Z"),
};

function serviceAnswering(answer: () => Response) {
  const server = serverAnswering(answer);
  return { shortUrls: new HttpShortUrlService(server.fetch), sent: server.sent };
}

const INVALID_ID = () =>
  shortenerError(422, "invalid_input", [{ field: "id", issues: [{ code: "invalid_format" }] }]);
const NOT_FOUND = () => shortenerError(404, "shorturl_not_found");
const NOT_AUTHENTICATED = () => shortenerError(401, "not_authenticated");
const UNAVAILABLE = () => shortenerError(503, "unavailable");

describe("list", () => {
  it("asks for a page, and answers its short URLs and the cursor of the next", async () => {
    const { shortUrls, sent } = serviceAnswering(() =>
      Response.json({
        items: [DETAILS, { ...DETAILS, last_resolved_at: null }],
        next_cursor: "c2",
      }),
    );

    const page = await shortUrls.list({ limit: 10, cursor: "c1" });

    expect(page).toEqual({
      items: [SHORT_URL, { ...SHORT_URL, lastResolvedAt: null }],
      nextCursor: "c2",
    });
    expect(sent()).toMatchObject([{ method: "GET", path: "/api/v1/shorturls?limit=10&cursor=c1" }]);
  });

  it("asks for the first page without a cursor", async () => {
    const { shortUrls, sent } = serviceAnswering(() =>
      Response.json({ items: [], next_cursor: null }),
    );

    expect(await shortUrls.list({ limit: 10 })).toEqual({ items: [], nextCursor: null });
    expect(sent()).toMatchObject([{ path: "/api/v1/shorturls?limit=10" }]);
  });

  it.each([
    { case: "nobody is signed in", answer: NOT_AUTHENTICATED, error: NotSignedInError },
    { case: "the shortener fails", answer: UNAVAILABLE, error: UnexpectedAnswerError },
  ])("throws when $case", async ({ answer, error }) => {
    const { shortUrls } = serviceAnswering(answer);

    await expect(shortUrls.list({ limit: 10 })).rejects.toThrow(error);
  });
});

describe.each([
  { operation: "get", method: "GET", action: "" },
  { operation: "enable", method: "POST", action: "/enable" },
  { operation: "disable", method: "POST", action: "/disable" },
] as const)("$operation", ({ operation, method, action }) => {
  it("answers the short URL", async () => {
    const { shortUrls, sent } = serviceAnswering(() => Response.json(DETAILS));

    expect(await shortUrls[operation](ID)).toEqual(ok(SHORT_URL));
    expect(sent()).toMatchObject([{ method, path: `/api/v1/shorturls/${ID}${action}` }]);
  });

  it.each([
    { case: "doesn't exist", answer: NOT_FOUND },
    { case: "has an ID that isn't a UUID", answer: INVALID_ID },
  ])("answers not_found for a short URL that $case", async ({ answer }) => {
    const { shortUrls } = serviceAnswering(answer);

    expect(await shortUrls[operation]("an-id")).toEqual(err({ code: "not_found" }));
  });

  it.each([
    { case: "nobody is signed in", answer: NOT_AUTHENTICATED, error: NotSignedInError },
    { case: "the shortener fails", answer: UNAVAILABLE, error: UnexpectedAnswerError },
    {
      case: "of a refusal it doesn't know",
      answer: () => shortenerError(405, "method_not_allowed"),
      error: UnexpectedAnswerError,
    },
  ])("throws when $case", async ({ answer, error }) => {
    const { shortUrls } = serviceAnswering(answer);

    await expect(shortUrls[operation](ID)).rejects.toThrow(error);
  });
});

describe("create", () => {
  it("creates the short URL, as the shortener names the fields", async () => {
    const { shortUrls, sent } = serviceAnswering(() => Response.json(DETAILS, { status: 201 }));

    const created = await shortUrls.create({ targetUrl: "https://example.com/a", slug: "my-slug" });

    expect(created).toEqual(ok(SHORT_URL));
    expect(sent()).toEqual([
      {
        method: "POST",
        path: "/api/v1/shorturls",
        contentType: "application/json",
        body: { target_url: "https://example.com/a", slug: "my-slug" },
      },
    ]);
  });

  it("sends no slug when none is given, for the shortener to generate it", async () => {
    const { shortUrls, sent } = serviceAnswering(() => Response.json(DETAILS, { status: 201 }));

    await shortUrls.create({ targetUrl: "https://example.com/a" });

    expect(sent()[0]?.body).toEqual({ target_url: "https://example.com/a" });
  });

  it("answers slug_taken", async () => {
    const { shortUrls } = serviceAnswering(() => shortenerError(409, "slug_taken"));

    expect(await shortUrls.create({ targetUrl: "https://a.b", slug: "x" })).toEqual(
      err({ code: "slug_taken" }),
    );
  });

  it("answers the first issue the shortener found in each field", async () => {
    const { shortUrls } = serviceAnswering(() =>
      shortenerError(422, "invalid_input", [
        { field: "target_url", issues: [{ code: "invalid_type" }] },
        { field: "slug", issues: [{ code: "too_short" }, { code: "invalid_format" }] },
      ]),
    );

    expect(await shortUrls.create({ targetUrl: "x", slug: "a b" })).toEqual(
      err({ code: "invalid_input", fields: { targetUrl: "invalid_format", slug: "too_short" } }),
    );
  });

  it("reads an issue it doesn't know as a value of the wrong format", async () => {
    const { shortUrls } = serviceAnswering(() =>
      shortenerError(422, "invalid_input", [{ field: "slug", issues: [{ code: "reserved" }] }]),
    );

    expect(await shortUrls.create({ targetUrl: "https://a.b", slug: "admin" })).toEqual(
      err({ code: "invalid_input", fields: { slug: "invalid_format" } }),
    );
  });

  it.each([
    { case: "nobody is signed in", answer: NOT_AUTHENTICATED, error: NotSignedInError },
    { case: "the shortener fails", answer: UNAVAILABLE, error: UnexpectedAnswerError },
    {
      case: "of a refusal it doesn't know",
      answer: () => shortenerError(400, "malformed_body"),
      error: UnexpectedAnswerError,
    },
  ])("throws when $case", async ({ answer, error }) => {
    const { shortUrls } = serviceAnswering(answer);

    await expect(shortUrls.create({ targetUrl: "https://a.b" })).rejects.toThrow(error);
  });
});

describe("update", () => {
  it("sends only the values that change", async () => {
    const { shortUrls, sent } = serviceAnswering(() => Response.json(DETAILS));

    expect(await shortUrls.update(ID, { slug: "my-slug" })).toEqual(ok(SHORT_URL));
    expect(sent()).toMatchObject([
      { method: "PATCH", path: `/api/v1/shorturls/${ID}`, body: { slug: "my-slug" } },
    ]);
  });

  it.each([
    {
      case: "a slug that is taken",
      answer: () => shortenerError(409, "slug_taken"),
      code: "slug_taken",
    },
    {
      case: "nothing to change",
      answer: () => shortenerError(422, "nothing_to_update"),
      code: "nothing_to_update",
    },
    { case: "a short URL that doesn't exist", answer: NOT_FOUND, code: "not_found" },
    { case: "an ID that isn't a UUID", answer: INVALID_ID, code: "not_found" },
  ])("answers $code for $case", async ({ answer, code }) => {
    const { shortUrls } = serviceAnswering(answer);

    expect(await shortUrls.update(ID, { slug: "x" })).toEqual(err({ code }));
  });

  it("answers the issues of the values", async () => {
    const { shortUrls } = serviceAnswering(() =>
      shortenerError(422, "invalid_input", [{ field: "slug", issues: [{ code: "too_long" }] }]),
    );

    expect(await shortUrls.update(ID, { slug: "x".repeat(31) })).toEqual(
      err({ code: "invalid_input", fields: { slug: "too_long" } }),
    );
  });

  it.each([
    { case: "nobody is signed in", answer: NOT_AUTHENTICATED, error: NotSignedInError },
    {
      case: "of a refusal it doesn't know",
      answer: () => shortenerError(400, "malformed_body"),
      error: UnexpectedAnswerError,
    },
  ])("throws when $case", async ({ answer, error }) => {
    const { shortUrls } = serviceAnswering(answer);

    await expect(shortUrls.update(ID, { slug: "x" })).rejects.toThrow(error);
  });
});

describe("delete", () => {
  it("deletes the short URL", async () => {
    const { shortUrls, sent } = serviceAnswering(() => new Response(null, { status: 204 }));

    expect(await shortUrls.delete(ID)).toEqual(ok(undefined));
    expect(sent()).toMatchObject([{ method: "DELETE", path: `/api/v1/shorturls/${ID}` }]);
  });

  it("answers not_found for a short URL that doesn't exist", async () => {
    const { shortUrls } = serviceAnswering(NOT_FOUND);

    expect(await shortUrls.delete(ID)).toEqual(err({ code: "not_found" }));
  });

  it.each([
    { case: "the shortener fails", answer: UNAVAILABLE },
    {
      case: "of a refusal it doesn't know",
      answer: () => shortenerError(405, "method_not_allowed"),
    },
  ])("throws when $case", async ({ answer }) => {
    const { shortUrls } = serviceAnswering(answer);

    await expect(shortUrls.delete(ID)).rejects.toThrow(UnexpectedAnswerError);
  });
});

describe("resolve", () => {
  it("answers where the slug leads, for anyone", async () => {
    const { shortUrls, sent } = serviceAnswering(() =>
      Response.json({ target_url: "https://example.com/a" }),
    );

    expect(await shortUrls.resolve("my slug")).toEqual(ok("https://example.com/a"));
    expect(sent()).toMatchObject([{ method: "GET", path: "/api/v1/slugs/my%20slug" }]);
  });

  it.each([
    { code: "shorturl_not_found", error: "not_found" },
    { code: "shorturl_deactivated", error: "deactivated" },
  ])("answers $error for $code", async ({ code, error }) => {
    const { shortUrls } = serviceAnswering(() => shortenerError(404, code));

    expect(await shortUrls.resolve("my-slug")).toEqual(err({ code: error }));
  });

  it.each([
    { case: "the shortener fails", answer: UNAVAILABLE },
    { case: "of a refusal it doesn't know", answer: () => shortenerError(404, "not_found") },
  ])("throws when $case", async ({ answer }) => {
    const { shortUrls } = serviceAnswering(answer);

    await expect(shortUrls.resolve("my-slug")).rejects.toThrow(UnexpectedAnswerError);
  });
});
