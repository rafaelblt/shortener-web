---
status: open
resolution:
labels: [bug, pages]
---

# 0008: Signing in ends on an error when the address to go back to has a line break or a tab

Opened on 2026-10-24.

Signing in at `/sign-in?next=%2F%0A%2Fexample.com`, whose `next` is `/`, a line break, and `/example.com`, ends on the error page, _Something went wrong._ With a carriage return, `%0D`, it does the same. With a tab, `%09`, the page stays on Sign in, with no message. In each case the person is signed in, and nobody is sent to the other site.

To reproduce: `npm run dev`, open `/sign-in?next=%2F%0A%2Fexample.com`, and sign in with the demo account. It was seen in Chromium, on a build of the simulation; the action is the same outside it.

`pathAfterSignIn()`, in `src/pages/sign-in/SignInPage.tsx`, follows a `next` that starts with `/` and whose second character isn't `/` or `\`. The browser's URL parser drops tabs and line breaks, so `/`, a line break and `/example.com` is read as `//example.com`, another site. React Router refuses to go there, with `External navigation is not allowed`, and throws. The flow test of the other sites, `goes to the links instead of $case` in `tests/flows/auth.test.tsx`, has no such case.

[Sign in](../app/pages.md#sign-in) says that, once signed in, the person goes back to the page that sent them there, or to Links, and that only a path of the app is followed, never another site: for such a `next`, the person would go to Links.
