import { Link } from "react-router";

import styles from "../shared/MessagePage.module.css";

export function NotFoundPage() {
  return (
    <main className={styles.page}>
      <title>Page not found · shortener</title>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>There's no page at this address.</h1>
      <Link to="/">Go to your links</Link>
    </main>
  );
}
