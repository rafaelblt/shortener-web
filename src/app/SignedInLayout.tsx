import { Form, Link, Outlet, useLoaderData, useLocation } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

import type { User } from "@/domain/user";
import { signedInUserContext } from "@/pages/shared/route-context";
import { Button } from "@/ui/Button";
import { classNames } from "@/ui/class-names";
import { Wordmark } from "@/ui/Wordmark";

import styles from "./SignedInLayout.module.css";

interface SignedInData {
  user: User;
}

export function loader({ context }: LoaderFunctionArgs): SignedInData {
  return { user: context.get(signedInUserContext) };
}

/** The layout of the pages for signed-in users: the header with the navigation, and the page. */
export function SignedInLayout() {
  const { user } = useLoaderData<SignedInData>();
  const { pathname } = useLocation();

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.bar}>
          <Link to="/" className={styles.brand}>
            <Wordmark />
          </Link>
          <nav className={styles.nav} aria-label="Main">
            <NavItem to="/" active={pathname === "/" || pathname.startsWith("/links/")}>
              Links
            </NavItem>
            <NavItem to="/account" active={pathname === "/account"}>
              Account
            </NavItem>
          </nav>
          <div className={styles.session}>
            <span className={styles.username}>{user.username}</span>
            <Form method="post" action="/sign-out">
              <Button type="submit" variant="quiet" size="small">
                Sign out
              </Button>
            </Form>
          </div>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, active, children }: { to: string; active: boolean; children: string }) {
  return (
    <Link
      to={to}
      className={classNames(styles.navItem, active && styles.active)}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}
