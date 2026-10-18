import { useNavigation } from "react-router";

/** The name of the hidden field that tells a page's forms apart, when it has more than one. */
export const INTENT = "intent";

/** Whether a form of the page is being submitted: any form, or the one of the intent. */
export function useSubmitting(intent?: string): boolean {
  const navigation = useNavigation();
  if (navigation.state !== "submitting") return false;
  return intent === undefined || navigation.formData?.get(INTENT) === intent;
}
