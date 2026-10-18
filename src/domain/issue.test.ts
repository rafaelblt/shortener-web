import { describe, expect, it } from "vitest";

import { hasIssues } from "./issue";

describe("hasIssues", () => {
  it.each([
    { case: "no field", issues: {}, expected: false },
    { case: "only fields without an issue", issues: { slug: undefined }, expected: false },
    {
      case: "a field with an issue",
      issues: { slug: "too_short", url: undefined },
      expected: true,
    },
  ] as const)("is $expected for $case", ({ issues, expected }) => {
    expect(hasIssues(issues)).toBe(expected);
  });
});
