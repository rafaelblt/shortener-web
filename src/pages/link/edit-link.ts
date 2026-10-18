import { hasIssues } from "@/domain/issue";
import { slugIssue, targetUrlIssue } from "@/domain/short-url";
import type { ShortUrlChanges, ShortUrlService } from "@/services/short-url-service";

import { fieldMessages } from "../shared/field-messages";
import { formText } from "../shared/form-data";

export interface EditData {
  saved?: boolean;
  error?: string;
  fields?: { targetUrl?: string; slug?: string };
}

/**
 * Sends only the values that changed, so that a value accepted under older rules isn't checked
 * again when it stays the same.
 */
export async function editLink(
  shortUrls: ShortUrlService,
  id: string,
  formData: FormData,
): Promise<EditData> {
  const changes = changedValues(formData);
  if (changes.targetUrl === undefined && changes.slug === undefined) {
    return { error: "Nothing changed: edit the target URL or the slug first." };
  }
  const issues = {
    targetUrl: changes.targetUrl === undefined ? undefined : targetUrlIssue(changes.targetUrl),
    slug: changes.slug === undefined ? undefined : slugIssue(changes.slug),
  };
  if (hasIssues(issues)) return { fields: fieldMessages(issues) };

  const result = await shortUrls.update(id, changes);
  if (result.ok) return { saved: true };
  switch (result.error.code) {
    case "slug_taken":
      return { fields: { slug: "That slug is taken." } };
    case "invalid_input":
      return { fields: fieldMessages(result.error.fields) };
    case "nothing_to_update":
      return { error: "Nothing changed: edit the target URL or the slug first." };
    case "not_found":
      return { error: "This link doesn't exist anymore." };
  }
}

function changedValues(formData: FormData): ShortUrlChanges {
  const targetUrl = formText(formData, "targetUrl").trim();
  const slug = formText(formData, "slug").trim();
  return {
    targetUrl: targetUrl === formText(formData, "savedTargetUrl") ? undefined : targetUrl,
    slug: slug === formText(formData, "savedSlug") ? undefined : slug,
  };
}
