import type { Issue } from "./issue";

export interface User {
  id: string;
  username: string;
}

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 32;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_BYTES = 72;

const USERNAME_CHARACTERS = /^[a-z0-9._-]+$/;

/** Usernames are case-insensitive: they are checked and stored in lowercase. */
export function normalizeUsername(username: string): string {
  return username.toLowerCase();
}

export function usernameIssue(username: string): Issue | undefined {
  const normalized = normalizeUsername(username);
  const length = codePointLength(normalized);
  if (length === 0) return "missing";
  if (!USERNAME_CHARACTERS.test(normalized)) return "invalid_format";
  if (length < USERNAME_MIN_LENGTH) return "too_short";
  if (length > USERNAME_MAX_LENGTH) return "too_long";
  return undefined;
}

export function passwordIssue(password: string): Issue | undefined {
  if (password.length === 0) return "missing";
  if (codePointLength(password) < PASSWORD_MIN_LENGTH) return "too_short";
  if (utf8ByteLength(password) > PASSWORD_MAX_BYTES) return "too_long";
  return undefined;
}

export function newPasswordIssue(newPassword: string, currentPassword: string): Issue | undefined {
  const issue = passwordIssue(newPassword);
  if (issue) return issue;
  if (newPassword === currentPassword) return "same_as_current";
  return undefined;
}

function codePointLength(text: string): number {
  // eslint-disable-next-line @typescript-eslint/no-misused-spread -- code points are what is counted
  return [...text].length;
}

function utf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}
