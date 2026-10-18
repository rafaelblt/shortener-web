import { Link, Outlet } from "react-router";

import { Wordmark } from "@/ui/Wordmark";

import styles from "./AuthLayout.module.css";

/** The layout of the pages for whoever isn't signed in: a narrow column under the wordmark. */
export function AuthLayout() {
  return (
    <div className={styles.layout}>
      <Link to="/" className={styles.brand}>
        <Wordmark />
      </Link>
      <main className={styles.column}>
        <Outlet />
      </main>
    </div>
  );
}
