import { Navigate, useLocation, useRevalidator, useRouteError } from "react-router";

import { NotSignedInError } from "@/services/errors";
import { Button } from "@/ui/Button";

import styles from "../shared/MessagePage.module.css";

/** What a route shows when its loader, its action or its page throws. */
export function ErrorPage() {
  const error = useRouteError();
  const location = useLocation();
  const revalidator = useRevalidator();

  // The session ended while the person was on a page, such as when it expired.
  if (error instanceof NotSignedInError) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/sign-in?next=${next}`} replace />;
  }

  return (
    <main className={styles.page}>
      <title>Something went wrong · shortener</title>
      <p className={styles.code}>Error</p>
      <h1 className={styles.title}>Something went wrong.</h1>
      <p>Trying again may work.</p>
      <Button
        onClick={() => {
          void revalidator.revalidate();
        }}
        disabled={revalidator.state === "loading"}
      >
        Try again
      </Button>
    </main>
  );
}
