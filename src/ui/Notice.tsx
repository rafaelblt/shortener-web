import type { ReactNode } from "react";

import { classNames } from "./class-names";
import styles from "./Notice.module.css";

export type NoticeTone = "info" | "success" | "error";

interface NoticeProps {
  tone?: NoticeTone;
  children: ReactNode;
  actions?: ReactNode;
}

/** A message about what just happened. Errors are announced at once, the others politely. */
export function Notice({ tone = "info", children, actions }: NoticeProps) {
  return (
    <div
      className={classNames(styles.notice, styles[tone])}
      role={tone === "error" ? "alert" : "status"}
    >
      <div>{children}</div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
