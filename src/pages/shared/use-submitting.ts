import { useFormAction, useNavigation } from "react-router";

/** The name of the hidden field that tells a page's forms apart, when it has more than one. */
export const INTENT = "intent";

/**
 * Whether a form of the page is being sent: any of them, or the one of the intent. A form that
 * posts elsewhere, such as Sign out in the header, isn't one of the page's.
 */
export function useSubmitting(intent?: string): boolean {
  const navigation = useNavigation();
  const pageAction = useFormAction();
  if (navigation.state !== "submitting" || navigation.formAction !== pageAction) return false;
  return intent === undefined || navigation.formData?.get(INTENT) === intent;
}
