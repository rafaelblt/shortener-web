/** Why a value a person typed breaks a rule. A field shows one issue at a time. */
export type Issue = "missing" | "too_short" | "too_long" | "invalid_format" | "same_as_current";

export type FieldIssues<Field extends string> = Partial<Record<Field, Issue>>;

export function hasIssues(issues: FieldIssues<string>): boolean {
  return Object.values(issues).some((issue) => issue !== undefined);
}
