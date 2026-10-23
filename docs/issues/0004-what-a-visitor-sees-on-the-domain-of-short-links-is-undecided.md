---
status: open
resolution:
labels: [question, pages, deploy]
---

# 0004: What a visitor sees on the domain of short links is undecided

Opened on 2026-10-18.

In the simulation, a short link is an address of the app, `/s/` and the slug, whose page (`src/pages/short-link/ShortLinkPage.tsx`) shows where the link leads, with **Continue**, instead of redirecting, since leaving the app would lose its memory. It also shows that a link is turned off, or doesn't exist (see `docs/app/pages.md#a-short-link`).

The shortener can either answer where a slug leads, for a page to decide what to show, or redirect at once. Still to be decided:

- Which domain the short links live on, which `VITE_SHORT_LINK_BASE_URL` will name.
- Whether that domain redirects at once, or passes through a page of the app.
- What a visitor sees for a link that is turned off, or doesn't exist, and whether the page of the app stays for that.

## 2026-10-23: An active link redirects at once

Decided by the maintainer: following a short link redirects at once, and the page of the app shows only for a link that is turned off or doesn't exist, with the texts it had. The server of the app answers `/s/` and the slug: it passes the shortener's redirect on, and serves the app for a slug the shortener doesn't redirect (see `docs/architecture/server.md`). The page of an active link, with **Continue**, stays for the simulation, which leaving the app would lose.

Still to be decided: which domain the short links live on. Until then, they are the app's own `/s/` addresses.
