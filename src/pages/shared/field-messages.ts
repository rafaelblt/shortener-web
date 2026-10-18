import type { Issue } from "@/domain/issue";
import { SLUG_MAX_LENGTH, SLUG_MIN_LENGTH } from "@/domain/short-url";
import {
  PASSWORD_MAX_BYTES,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from "@/domain/user";

export type Field =
  "username" | "password" | "currentPassword" | "newPassword" | "targetUrl" | "slug";

const PASSWORD_MESSAGES = {
  missing: "Enter a password.",
  too_short: `Use at least ${PASSWORD_MIN_LENGTH} characters.`,
  too_long: `Use at most ${PASSWORD_MAX_BYTES} bytes; accented letters and emoji take more than one.`,
};

const MESSAGES: Record<Field, Partial<Record<Issue, string>>> = {
  username: {
    missing: "Enter a username.",
    too_short: `Use at least ${USERNAME_MIN_LENGTH} characters.`,
    too_long: `Use at most ${USERNAME_MAX_LENGTH} characters.`,
    invalid_format: "Use only letters, digits, dots, dashes and underscores.",
  },
  password: PASSWORD_MESSAGES,
  currentPassword: { missing: "Enter your current password." },
  newPassword: {
    ...PASSWORD_MESSAGES,
    missing: "Enter a new password.",
    same_as_current: "Choose a password other than the current one.",
  },
  targetUrl: {
    missing: "Enter the address to shorten.",
    invalid_format: "Enter a full https:// address, such as https://example.com/page.",
  },
  slug: {
    missing: "Enter a slug.",
    too_short: `Use at least ${SLUG_MIN_LENGTH} characters.`,
    too_long: `Use at most ${SLUG_MAX_LENGTH} characters.`,
    invalid_format: "Use only letters, digits, dashes and underscores.",
  },
};

export function fieldMessage(field: Field, issue: Issue): string {
  return MESSAGES[field][issue] ?? "This value isn't valid.";
}

/** The message of each field that has an issue. */
export function fieldMessages<F extends Field>(
  issues: Partial<Record<F, Issue>>,
): Partial<Record<F, string>> {
  const messages: Partial<Record<F, string>> = {};
  for (const [field, issue] of Object.entries(issues) as [F, Issue | undefined][]) {
    if (issue) messages[field] = fieldMessage(field, issue);
  }
  return messages;
}
