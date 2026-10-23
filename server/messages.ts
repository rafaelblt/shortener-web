// The largest body the server takes, the same as go-auth's limit.
const MAX_BODY_BYTES = 64 * 1024;

// The headers of a back end's answer that the app reads, such as where a new short URL is.
const PASSED_THROUGH_HEADERS = ["content-type", "location", "retry-after", "www-authenticate"];

/** A request, with what the server works out of it. */
export interface Incoming {
  request: Request;
  url: URL;
  /** Who the request is for, which the back ends count their rate limits by. */
  clientAddress: string;
}

/** The bytes of the body, or null when it is larger than the server takes. */
export async function bodyOf(request: Request): Promise<Uint8Array | null> {
  if (!request.body) return new Uint8Array();
  const body: AsyncIterable<Uint8Array> = request.body;
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of body) {
    size += chunk.byteLength;
    if (size > MAX_BODY_BYTES) return null;
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export function jsonAnswer(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** An error of the server itself, in the shape of go-auth's errors. */
export function errorAnswer(status: number, code: string, message: string): Response {
  return jsonAnswer(status, { error: { code, message } });
}

export function bodyTooLarge(): Response {
  return errorAnswer(413, "request_body_too_large", "The body is too large.");
}

export function notSignedIn(): Response {
  return errorAnswer(401, "not_signed_in", "Nobody is signed in.");
}

/** A back end's answer, with only the headers the app reads. */
export function passedThrough(answer: Response): Response {
  const headers = new Headers();
  for (const name of PASSED_THROUGH_HEADERS) {
    const value = answer.headers.get(name);
    if (value !== null) headers.set(name, value);
  }
  return new Response(answer.body, { status: answer.status, headers });
}

/** The answer, setting the cookie when there is one. */
export function withCookie(answer: Response, cookie: string | undefined): Response {
  if (cookie !== undefined) answer.headers.append("set-cookie", cookie);
  return answer;
}
