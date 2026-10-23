/** The path of a short link in the app, whose page follows it, or says why it leads nowhere. */
export function shortLinkPath(slug: string): string {
  return `/s/${encodeURIComponent(slug)}`;
}
