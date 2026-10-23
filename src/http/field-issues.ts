import type { FieldIssues, Issue } from "@/domain/issue";

// The issues of a value, as go-auth and the shortener name them, and as the app does.
const ISSUES: Record<string, Issue> = {
  missing: "missing",
  too_short: "too_short",
  too_long: "too_long",
  invalid_format: "invalid_format",
  invalid_characters: "invalid_format",
  invalid_type: "invalid_format",
  same_as_current: "same_as_current",
};

/** An issue a back end found in a field of a request, named as in the request. */
export interface BackEndIssue {
  field: string;
  code: string;
}

/**
 * The first issue of each field, under the name the app gives the field. A field the app doesn't
 * name is left out, and an issue it doesn't know is read as a value of the wrong format.
 */
export function fieldIssuesOf<Field extends string>(
  issues: BackEndIssue[],
  fieldNames: Record<string, Field>,
): FieldIssues<Field> {
  const fields: FieldIssues<Field> = {};
  for (const { field, code } of issues) {
    const name = fieldNames[field];
    if (name !== undefined) fields[name] ??= ISSUES[code] ?? "invalid_format";
  }
  return fields;
}
