/** The outcome of an operation whose failures the caller is expected to handle. */
export type Result<Value, Error> = { ok: true; value: Value } | { ok: false; error: Error };

export function ok<Value>(value: Value): { ok: true; value: Value } {
  return { ok: true, value };
}

export function err<Error>(error: Error): { ok: false; error: Error } {
  return { ok: false, error };
}
