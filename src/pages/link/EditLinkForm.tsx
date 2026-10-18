import { useState } from "react";
import type { ChangeEvent } from "react";
import { Form, useActionData } from "react-router";

import type { ShortUrl } from "@/domain/short-url";
import { Button } from "@/ui/Button";
import { Notice } from "@/ui/Notice";
import { Panel } from "@/ui/Panel";
import { TextField } from "@/ui/TextField";

import forms from "../shared/forms.module.css";
import { SHORT_LINK_PREFIX } from "../shared/short-link";
import { INTENT, useSubmitting } from "../shared/use-submitting";
import type { EditData } from "./edit-link";
import type { LinkIntent } from "./link-intent";

const intent: LinkIntent = "edit";

export function EditLinkForm({ shortUrl }: { shortUrl: ShortUrl }) {
  const data = useActionData<EditData | null>();
  const submitting = useSubmitting(intent);
  const [changed, setChanged] = useState(false);

  function compareWithSaved(event: ChangeEvent<HTMLFormElement>) {
    const form = new FormData(event.currentTarget);
    setChanged(form.get("targetUrl") !== shortUrl.targetUrl || form.get("slug") !== shortUrl.slug);
  }

  return (
    <Panel title="Edit" description="Changing the slug frees the old one for anyone to take.">
      <Form method="post" className={forms.form} onChange={compareWithSaved} noValidate>
        <input type="hidden" name={INTENT} value={intent} />
        <input type="hidden" name="savedTargetUrl" value={shortUrl.targetUrl} />
        <input type="hidden" name="savedSlug" value={shortUrl.slug} />
        {data?.saved && !changed && <Notice tone="success">Saved.</Notice>}
        {data?.error && <Notice tone="error">{data.error}</Notice>}
        <TextField
          label="Target URL"
          name="targetUrl"
          type="url"
          inputMode="url"
          defaultValue={shortUrl.targetUrl}
          autoComplete="off"
          spellCheck={false}
          monospace
          error={data?.fields?.targetUrl}
        />
        <TextField
          label="Slug"
          name="slug"
          prefix={SHORT_LINK_PREFIX}
          defaultValue={shortUrl.slug}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          monospace
          error={data?.fields?.slug}
        />
        <div className={forms.actions}>
          <Button type="submit" variant="primary" disabled={!changed || submitting}>
            {submitting ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </Form>
    </Panel>
  );
}
