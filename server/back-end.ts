export type Fetch = typeof fetch;

/** A back end couldn't be reached, or answered what the server can't use. */
export class BackEndError extends Error {
  override name = "BackEndError";
}

export interface BackEndRequest {
  method: string;
  body?: Uint8Array | string;
  headers?: Record<string, string>;
  /** Who the request is for, which the back ends count their rate limits by. */
  clientAddress: string;
}

/** Calls a back end. Throws a BackEndError when it can't be reached. */
export async function callBackEnd(
  fetchFunction: Fetch,
  url: string,
  { method, body, headers = {}, clientAddress }: BackEndRequest,
): Promise<Response> {
  try {
    return await fetchFunction(url, {
      method,
      body,
      headers: { ...headers, "x-forwarded-for": clientAddress },
      redirect: "manual",
    });
  } catch (error) {
    throw new BackEndError(`${method} ${url} failed`, { cause: error });
  }
}
