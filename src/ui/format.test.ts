import { describe, expect, it } from "vitest";

import { formatCount, formatDate, formatDateTime, formatRelativeTime } from "./format";

const NOW = new Date("2026-10-18T12:00:00Z");

function before(ms: number): Date {
  return new Date(NOW.getTime() - ms);
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("formatCount", () => {
  it("groups the thousands", () => {
    expect(formatCount(1284)).toBe("1,284");
  });
});

describe("formatDate and formatDateTime", () => {
  it("write the date, and the time", () => {
    expect(formatDate(NOW)).toBe("Oct 18, 2026");
    expect(formatDateTime(NOW)).toMatch(/^Oct 18, 2026, 12:00\sPM$/);
  });
});

describe("formatRelativeTime", () => {
  it.each([
    { case: "under a minute", date: before(59 * SECOND), expected: "just now" },
    { case: "minutes", date: before(4 * MINUTE + 59 * SECOND), expected: "4 minutes ago" },
    { case: "hours", date: before(2 * HOUR), expected: "2 hours ago" },
    { case: "a day", date: before(DAY), expected: "yesterday" },
    { case: "days", date: before(29 * DAY), expected: "29 days ago" },
    { case: "a month or more, as the date", date: before(30 * DAY), expected: "Sep 18, 2026" },
  ])("writes $case", ({ date, expected }) => {
    expect(formatRelativeTime(date, NOW)).toBe(expected);
  });
});
