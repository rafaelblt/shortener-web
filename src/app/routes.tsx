import type { RouteObject } from "react-router";

import * as account from "@/pages/account/AccountPage";
import { ErrorPage } from "@/pages/error/ErrorPage";
import * as link from "@/pages/link/LinkPage";
import * as links from "@/pages/links/LinksPage";
import { NotFoundPage } from "@/pages/not-found/NotFoundPage";
import * as register from "@/pages/register/RegisterPage";
import * as shortLink from "@/pages/short-link/ShortLinkPage";
import * as signIn from "@/pages/sign-in/SignInPage";
import * as signOut from "@/pages/sign-out/sign-out";

import { AuthLayout } from "./AuthLayout";
import { requireSignedInUser } from "./require-signed-in-user";
import { RootLayout } from "./RootLayout";
import * as signedIn from "./SignedInLayout";

/** Every page of the app, by its path. See docs/app/pages.md */
export const routes: RouteObject[] = [
  {
    path: "/",
    Component: RootLayout,
    ErrorBoundary: ErrorPage,
    children: [
      {
        Component: AuthLayout,
        children: [
          {
            path: "sign-in",
            loader: signIn.loader,
            action: signIn.action,
            Component: signIn.SignInPage,
          },
          {
            path: "register",
            loader: register.loader,
            action: register.action,
            Component: register.RegisterPage,
          },
        ],
      },
      {
        middleware: [requireSignedInUser],
        loader: signedIn.loader,
        Component: signedIn.SignedInLayout,
        children: [
          { index: true, loader: links.loader, action: links.action, Component: links.LinksPage },
          { path: "links/:id", loader: link.loader, action: link.action, Component: link.LinkPage },
          {
            path: "account",
            loader: account.loader,
            action: account.action,
            Component: account.AccountPage,
          },
        ],
      },
      { path: "sign-out", loader: signOut.loader, action: signOut.action },
      { path: "s/:slug", loader: shortLink.loader, Component: shortLink.ShortLinkPage },
      { path: "*", Component: NotFoundPage },
    ],
  },
];
