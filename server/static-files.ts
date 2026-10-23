import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

// The build names the files of assets/ after their content, so they never change.
const ASSETS = "/assets/";
const FOREVER = "public, max-age=31536000, immutable";

// Every script, style, font and request is the app's own, so a script injected into a page can
// neither load another nor send what it reads elsewhere.
const SECURITY_HEADERS = {
  "content-security-policy":
    "default-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  "x-content-type-options": "nosniff",
  "referrer-policy": "same-origin",
};

/** The files the build of the app wrote, and the app itself for any path that isn't one. */
export class StaticFiles {
  private readonly directory: string;

  constructor(directory: string) {
    this.directory = resolve(directory);
  }

  /** The file of the path; the app, whose routes have no extension, for a path without one. */
  async answer(pathname: string): Promise<Response> {
    const path = this.pathOf(pathname);
    if (path && (await isFile(path))) {
      const cacheControl = pathname.startsWith(ASSETS) ? FOREVER : "no-cache";
      return this.file(path, 200, cacheControl);
    }
    if (extname(pathname) !== "") return new Response("Not found", { status: 404 });
    return this.app(200);
  }

  /** The page of the app, which shows what its routes do. */
  app(status: number): Promise<Response> {
    return this.file(join(this.directory, "index.html"), status, "no-cache");
  }

  private async file(path: string, status: number, cacheControl: string): Promise<Response> {
    return new Response(await readFile(path), {
      status,
      headers: {
        ...SECURITY_HEADERS,
        "content-type": CONTENT_TYPES[extname(path)] ?? "application/octet-stream",
        "cache-control": cacheControl,
      },
    });
  }

  /** Where the file of the path is, or null when the path leads out of the directory. */
  private pathOf(pathname: string): string | null {
    let decoded: string;
    try {
      decoded = decodeURIComponent(pathname);
    } catch {
      return null;
    }
    const path = resolve(this.directory, `.${decoded}`);
    return path.startsWith(this.directory + sep) ? path : null;
  }
}

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}
