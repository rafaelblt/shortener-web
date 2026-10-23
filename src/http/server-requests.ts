export type Fetch = typeof fetch;

/** The server answered what no caller handles, such as a back end that failed. */
export class UnexpectedAnswerError extends Error {
  override name = "UnexpectedAnswerError";
}

/**
 * Sends a request to the server of the app, at the same address as the app, so the cookie of the
 * session goes with it. A request that changes something is JSON, as the server requires.
 */
export function send(fetchFunction: Fetch, method: string, path: string, body?: unknown) {
  return fetchFunction(path, {
    method,
    headers: method === "GET" ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** The body of an answer, as the contract types it. */
export async function bodyOf<Body>(answer: Response): Promise<Body> {
  return (await answer.json()) as Body;
}

/**
 * The body of an error a caller may handle, which the contract types. Throws for the failures no
 * caller handles: of the server or a back end, and too many requests.
 */
export async function errorBodyOf<Body>(answer: Response): Promise<Body> {
  if (answer.status >= 500 || answer.status === 429) throw unexpected(answer);
  return bodyOf<Body>(answer);
}

export function unexpected(answer: Response): UnexpectedAnswerError {
  return new UnexpectedAnswerError(`The server answered ${answer.status} to ${answer.url}`);
}
