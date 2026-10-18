import { classNames } from "./class-names";
import styles from "./PendingBar.module.css";

/** A thin bar at the top of the window while something loads. Shows only if it takes a while. */
export function PendingBar({ visible }: { visible: boolean }) {
  return <div className={classNames(styles.bar, visible && styles.visible)} aria-hidden="true" />;
}
