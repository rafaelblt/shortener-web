/** The forms of the link page, told apart by their intent. */
const LINK_INTENTS = ["edit", "enable", "disable", "delete"] as const;

export type LinkIntent = (typeof LINK_INTENTS)[number];

export function isLinkIntent(value: string): value is LinkIntent {
  return (LINK_INTENTS as readonly string[]).includes(value);
}
