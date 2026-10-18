/**
 * Where short links live. The simulation resolves them in this app, under /s; the real domain of
 * short links is set with VITE_SHORT_LINK_BASE_URL.
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
