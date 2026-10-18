import { useSearchParams } from "react-router";

/**
 * Messages a page shows after a redirect, such as "You're signed out." The redirect names one in
 * the query string, since a redirect can't carry anything else.
 */
const NOTICES = {
  "signed-out": "You're signed out.",
  "password-changed":
    "Your password was changed, and every session ended. Sign in with the new one.",
  "account-created": "Your account is ready. Welcome.",
  "link-deleted": "The link was deleted, and its slug is free again.",
} as const;

export type NoticeName = keyof typeof NOTICES;

const PARAM = "notice";

export function withNotice(path: string, notice: NoticeName): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${PARAM}=${notice}`;
}

/** The message the URL names, if it names a known one. */
export function useNotice(): string | undefined {
  const [searchParams] = useSearchParams();
  const name = searchParams.get(PARAM);
  return name !== null && name in NOTICES ? NOTICES[name as NoticeName] : undefined;
}
