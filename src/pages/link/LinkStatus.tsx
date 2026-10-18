import { Form } from "react-router";

import type { ShortUrlStatus } from "@/domain/short-url";
import { Button } from "@/ui/Button";
import { Panel } from "@/ui/Panel";

import { INTENT, useSubmitting } from "../shared/use-submitting";
import type { LinkIntent } from "./link-intent";
import styles from "./LinkPage.module.css";

const COPY: Record<ShortUrlStatus, { description: string; intent: LinkIntent; button: string }> = {
  active: {
    description: "The link leads to its target, and each resolution is counted.",
    intent: "disable",
    button: "Deactivate",
  },
  deactivated: {
    description:
      "The link is turned off: it says so instead of leading anywhere, and nothing is counted. Its slug stays yours.",
    intent: "enable",
    button: "Activate",
  },
};

export function LinkStatus({ status }: { status: ShortUrlStatus }) {
  const { description, intent, button } = COPY[status];
  const submitting = useSubmitting(intent);

  return (
    <Panel title="Status">
      <Form method="post" className={styles.row}>
        <input type="hidden" name={INTENT} value={intent} />
        <p className={styles.rowText}>{description}</p>
        <Button type="submit" disabled={submitting}>
          {button}
        </Button>
      </Form>
    </Panel>
  );
}
