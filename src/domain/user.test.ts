import { describe, expect, it } from "vitest";

import {
  newPasswordIssue,
  normalizeUsername,
  PASSWORD_MAX_BYTES,
  PASSWORD_MIN_LENGTH,
  passwordIssue,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  usernameIssue,
} from "./user";

describe("normalizeUsername", () => {
  it("lowercases the username", () => {
    expect(normalizeUsername("Alice.Smith")).toBe("alice.smith");
  });
});

describe("usernameIssue", () => {
  it.each([
    { case: "the shortest", username: "a".repeat(USERNAME_MIN_LENGTH) },
    { case: "the longest", username: "a".repeat(USERNAME_MAX_LENGTH) },
    { case: "every allowed character", username: "a.b_c-0" },
    { case: "uppercase, checked lowercased", username: "ALICE" },
  ])("accepts $case", ({ username }) => {
    expect(usernameIssue(username)).toBeUndefined();
  });

  it.each([
    { case: "an empty one", username: "", issue: "missing" },
    { case: "a shorter one", username: "a".repeat(USERNAME_MIN_LENGTH - 1), issue: "too_short" },
    { case: "a longer one", username: "a".repeat(USERNAME_MAX_LENGTH + 1), issue: "too_long" },
    { case: "a space", username: "alice smith", issue: "invalid_format" },
    { case: "a leading space", username: " alice", issue: "invalid_format" },
    { case: "a letter with an accent", username: "joão", issue: "invalid_format" },
  ])("rejects $case as $issue", ({ username, issue }) => {
    expect(usernameIssue(username)).toBe(issue);
  });
});

describe("passwordIssue", () => {
  it.each([
    { case: "the shortest", password: "a".repeat(PASSWORD_MIN_LENGTH) },
    { case: "the longest in bytes", password: "a".repeat(PASSWORD_MAX_BYTES) },
    { case: "spaces and any character", password: " senha çã 🔑 " },
  ])("accepts $case", ({ password }) => {
    expect(passwordIssue(password)).toBeUndefined();
  });

  it.each([
    { case: "an empty one", password: "", issue: "missing" },
    { case: "a shorter one", password: "a".repeat(PASSWORD_MIN_LENGTH - 1), issue: "too_short" },
    {
      case: "one counted in code points, not in UTF-16 units",
      password: "🔑".repeat(PASSWORD_MIN_LENGTH - 1),
      issue: "too_short",
    },
    { case: "one over the bytes", password: "a".repeat(PASSWORD_MAX_BYTES + 1), issue: "too_long" },
    {
      case: "one under the length but over the bytes",
      password: "ç".repeat(PASSWORD_MAX_BYTES / 2 + 1),
      issue: "too_long",
    },
  ])("rejects $case as $issue", ({ password, issue }) => {
    expect(passwordIssue(password)).toBe(issue);
  });
});

describe("newPasswordIssue", () => {
  it("accepts a valid password that differs from the current one", () => {
    expect(newPasswordIssue("battery-staple", "correct-horse")).toBeUndefined();
  });

  it("rejects the current password as same_as_current", () => {
    expect(newPasswordIssue("correct-horse", "correct-horse")).toBe("same_as_current");
  });

  it("reports the rules of a password before comparing", () => {
    expect(newPasswordIssue("short", "short")).toBe("too_short");
  });
});
