import { useEffect, useRef } from "react";
import { Form } from "react-router";

import { Button } from "@/ui/Button";
import { Panel } from "@/ui/Panel";
import { TextField } from "@/ui/TextField";

import { SHORT_LINK_PREFIX } from "../shared/short-link";
import { useSubmitting } from "../shared/use-submitting";
import styles from "./CreateLinkForm.module.css";

export interface CreateLinkFields {
  targetUrl?: string;
  slug?: string;
}

interface CreateLinkFormProps {
  fields?: CreateLinkFields | undefined;
  /** The link just created, if any: the form empties for the next one. */
  createdId?: string | undefined;
}

export function CreateLinkForm({ fields, createdId }: CreateLinkFormProps) {
  const submitting = useSubmitting();
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (createdId) form.current?.reset();
  }, [createdId]);

  return (
    <Panel title="Shorten a link">
      <Form ref={form} method="post" className={styles.form} noValidate>
        <TextField
          className={styles.targetUrl}
          label="Target URL"
          name="targetUrl"
          type="url"
          inputMode="url"
          placeholder="https://"
          autoComplete="off"
          spellCheck={false}
          monospace
          error={fields?.targetUrl}
        />
        <TextField
          className={styles.slug}
          label="Slug"
          name="slug"
          optional
          prefix={SHORT_LINK_PREFIX}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          monospace
          hint="Leave it empty for a random one."
          error={fields?.slug}
        />
        <Button type="submit" variant="primary" className={styles.submit} disabled={submitting}>
          {submitting ? "Shortening…" : "Shorten"}
        </Button>
      </Form>
    </Panel>
  );
}
