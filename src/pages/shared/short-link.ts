/**
 * Where short links live: under /s, where the server of the app follows them, unless
 * VITE_SHORT_LINK_BASE_URL names another address.
 */
const BASE_URL = import.meta.env.VITE_SHORT_LINK_BASE_URL ?? `${window.location.origin}/s`;

export function shortLinkUrl(slug: string): string {
  return `${BASE_URL}/${slug}`;
}

/** The short link without its scheme, as people read it. */
export function shortLinkText(slug: string): string {
  return withoutScheme(shortLinkUrl(slug));
}

/** What comes before the slug in a short link, without the scheme. */
export const SHORT_LINK_PREFIX = `${withoutScheme(BASE_URL)}/`;

export function withoutScheme(url: string): string {
  return url.replace(/^https?:\/\//i, "");
}
