import styles from "./Wordmark.module.css";

export function Wordmark() {
  return (
    <span className={styles.wordmark}>
      <span className={styles.slash}>/</span>shortener
    </span>
  );
}
