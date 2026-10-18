import { useState } from "react";
import { Form } from "react-router";

import { Button } from "@/ui/Button";
import { Panel } from "@/ui/Panel";

import { INTENT, useSubmitting } from "../shared/use-submitting";
import type { LinkIntent } from "./link-intent";
import styles from "./LinkPage.module.css";

const intent: LinkIntent = "delete";

/** Deleting asks for a second click, in place, since it can't be undone. */
export function DeleteLink({ slug }: { slug: string }) {
  const [confirming, setConfirming] = useState(false);
  const submitting = useSubmitting(intent);

  return (
    <Panel title="Delete" tone="danger">
      {confirming ? (
        <Form method="post" className={styles.row}>
          <input type="hidden" name={INTENT} value={intent} />
          <p className={styles.rowText}>
            Delete <strong className={styles.mono}>/{slug}</strong> for good? Its slug becomes free
            for anyone to take.
          </p>
          <div className={styles.rowActions}>
            <Button
              onClick={() => {
                setConfirming(false);
              }}
            >
              Keep it
            </Button>
            <Button type="submit" variant="danger" disabled={submitting} autoFocus>
              {submitting ? "Deleting…" : "Delete for good"}
            </Button>
          </div>
        </Form>
      ) : (
        <div className={styles.row}>
          <p className={styles.rowText}>Deleting can't be undone.</p>
          <Button
            onClick={() => {
              setConfirming(true);
            }}
          >
            Delete link
          </Button>
        </div>
      )}
    </Panel>
  );
}
