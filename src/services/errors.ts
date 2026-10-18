import type { FieldIssues } from "@/domain/issue";

export interface InvalidInput<Field extends string> {
  code: "invalid_input";
  fields: FieldIssues<Field>;
}

export interface NotFound {
  code: "not_found";
}

/** The operation needs a signed-in user, and there is none, such as when the session ended. */
export class NotSignedInError extends Error {
  override name = "NotSignedInError";
}
