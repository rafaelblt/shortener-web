---
status: open
resolution:
labels: [bug, server]
---

# 0010: A short link answers JSON when the shortener can't be reached

Opened on 2026-10-24.

A `GET` of `/s/` and a slug, while the shortener can't be reached, gets `502` with `content-type: application/json` and `{"error":{"code":"back_end_failed","message":"A back end failed to answer."}}`, which is what a person who follows the short link sees in the browser.

To reproduce: run the handler of `server/app.ts` with a `SHORTENER_URL` where nothing answers, such as `http://127.0.0.1:9`, and send it `GET /s/abc123`.

`follow()`, in `server/shortener-routes.ts`, calls the shortener with `callBackEnd()`, which throws a `BackEndError` when it can't be reached, and `app.ts` answers that error as one of its API, in JSON. [Short links](../architecture/server.md#short-links) says that, when the shortener doesn't redirect, the server answers the page of the app, with `200` when it fails, but not what it answers when it can't be reached at all.

What a person who follows a short link sees then is still to be decided by the maintainer.
