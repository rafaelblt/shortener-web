/** Joins the class names that are set, skipping the empty and missing ones. */
export function classNames(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}
