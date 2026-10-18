import type { Services } from "@/services/services";

import { unwrap } from "./simulation";

/** Creates short URLs for the signed-in user, the last one the newest, one second apart. */
export async function createShortUrls(services: Services, slugs: string[]) {
  const created = [];
  for (const slug of slugs) {
    created.push(
      unwrap(await services.shortUrls.create({ targetUrl: `https://example.com/${slug}`, slug })),
    );
  }
  return created;
}
