/** The page of this app that resolves a short link, standing in for the domain of short links. */
export function shortLinkPath(slug: string): string {
  return `/s/${encodeURIComponent(slug)}`;
}
