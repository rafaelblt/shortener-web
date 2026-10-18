import { describe, expect, it } from "vitest";

import { slugIssue } from "@/domain/short-url";

import { randomId, randomSlug } from "./random";

describe("randomSlug", () => {
  it("answers 6 ASCII letters and digits, a valid slug", () => {
    const slug = randomSlug();

    expect(slug).toMatch(/^[A-Za-z0-9]{6}$/);
    expect(slugIssue(slug)).toBeUndefined();
  });
});

describe("randomId", () => {
  it("answers a UUID", () => {
    expect(randomId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });
});
