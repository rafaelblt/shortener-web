import { useId } from "react";
import type { ReactNode } from "react";

import { classNames } from "./class-names";
import styles from "./Panel.module.css";

interface PanelProps {
  title: string;
  description?: ReactNode;
  tone?: "default" | "danger";
  children: ReactNode;
}

/** A titled section with a border, such as a form on a page. */
export function Panel({ title, description, tone = "default", children }: PanelProps) {
  const titleId = useId();
  return (
    <section
      className={classNames(styles.panel, tone === "danger" && styles.danger)}
      aria-labelledby={titleId}
    >
      <header className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {description && <p className={styles.description}>{description}</p>}
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
