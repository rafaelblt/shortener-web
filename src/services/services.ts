import type { AuthService } from "./auth-service";
import type { ShortUrlService } from "./short-url-service";

/** Everything the pages ask of the back ends. */
export interface Services {
  auth: AuthService;
  shortUrls: ShortUrlService;
}
