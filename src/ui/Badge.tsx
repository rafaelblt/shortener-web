import type { ReactNode } from "react";

import styles from "./Badge.module.css";
import { classNames } from "./class-names";

export type BadgeTone = "positive" | "neutral";

/** A short state, with a filled dot when positive and a hollow one when neutral. */
export function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return <span className={classNames(styles.badge, styles[tone])}>{children}</span>;
}
