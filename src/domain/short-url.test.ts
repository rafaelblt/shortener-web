import { describe, expect, it } from "vitest";

import { SLUG_MAX_LENGTH, SLUG_MIN_LENGTH, slugIssue, targetUrlIssue } from "./short-url";

describe("slugIssue", () => {
  it.each([
    { case: "the shortest", slug: "a".repeat(SLUG_MIN_LENGTH) },
    { case: "the longest", slug: "a".repeat(SLUG_MAX_LENGTH) },
    { case: "every allowed character", slug: "Ab_9-z" },
  ])("accepts $case", ({ slug }) => {
    expect(slugIssue(slug)).toBeUndefined();
  });

  it.each([
    { case: "an empty one", slug: "", issue: "missing" },
    { case: "a shorter one", slug: "a".repeat(SLUG_MIN_LENGTH - 1), issue: "too_short" },
    { case: "a longer one", slug: "a".repeat(SLUG_MAX_LENGTH + 1), issue: "too_long" },
    { case: "a dot", slug: "my.slug", issue: "invalid_format" },
    { case: "a slash", slug: "my/slug", issue: "invalid_format" },
    { case: "a space", slug: "my slug", issue: "invalid_format" },
    { case: "a trailing line break", slug: "my-slug\n", issue: "invalid_format" },
    { case: "a letter with an accent", slug: "ação", issue: "invalid_format" },
  ])("rejects $case as $issue", ({ slug, issue }) => {
    expect(slugIssue(slug)).toBe(issue);
  });
});

describe("targetUrlIssue", () => {
  it.each([
    { case: "an https URL", url: "https://example.com" },
    { case: "a path, query and fragment", url: "https://example.com/a/b?c=d#e" },
    { case: "an uppercase scheme", url: "HTTPS://example.com" },
    { case: "letters of any script", url: "https://例え.jp/パス" },
    { case: "a host the rules don't check", url: "https://exa..mple.com" },
  ])("accepts $case", ({ url }) => {
    expect(targetUrlIssue(url)).toBeUndefined();
  });

  it.each([
    { case: "an empty one", url: "", issue: "missing" },
    { case: "http", url: "http://example.com", issue: "invalid_format" },
    { case: "no scheme", url: "example.com", issue: "invalid_format" },
    { case: "no host", url: "https://", issue: "invalid_format" },
    { case: "an empty host before the path", url: "https:///path", issue: "invalid_format" },
    { case: "one that doesn't parse", url: "https://[invalid", issue: "invalid_format" },
    { case: "a space", url: "https://exa mple.com", issue: "invalid_format" },
    { case: "a line break", url: "https://example.com/\r\n", issue: "invalid_format" },
    { case: "a zero width space", url: "https://example.com/​", issue: "invalid_format" },
    { case: "a right-to-left override", url: "https://example.com/‮", issue: "invalid_format" },
    { case: "a no-break space", url: "https://example.com/ ", issue: "invalid_format" },
  ])("rejects $case as $issue", ({ url, issue }) => {
    expect(targetUrlIssue(url)).toBe(issue);
  });
});
