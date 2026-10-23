import type { Services } from "@/services/services";

import { HttpAuthService } from "./http-auth-service";
import { HttpShortUrlService } from "./http-short-url-service";
import type { Fetch } from "./server-requests";

/** Services that ask the server of the app, which asks go-auth and the shortener. */
export function createHttpServices(
  // The browser's fetch has to be called on the window, so it is wrapped rather than passed.
  fetchFunction: Fetch = (input, init) => fetch(input, init),
): Services {
  return {
    auth: new HttpAuthService(fetchFunction),
    shortUrls: new HttpShortUrlService(fetchFunction),
  };
}
