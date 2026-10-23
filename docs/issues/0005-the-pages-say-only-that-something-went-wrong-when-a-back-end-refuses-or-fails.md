---
status: open
resolution:
labels: [question, pages, http]
---

# 0005: The pages say only that something went wrong when a back end refuses or fails

Opened on 2026-10-23.

Since the app runs on go-auth and the shortener (issue 0001), a page can get answers the simulation never gave, and the HTTP services (`src/http/`) throw an `UnexpectedAnswerError` for each, which the error page shows as _Something went wrong._, with **Try again**:

- **Too many requests**: go-auth, with `RATE_LIMIT` on, limits signing in, creating an account and changing the password per address, and the shortener limits every request, 60 a minute per address by default. Both answer `429` with `Retry-After`, the seconds to wait. With `RATE_LIMIT` at `normal`, the eleventh sign-in of a minute gets the error page instead of the message of the form.
- **A back end that can't answer**: the server answers `502`, and the shortener `503` when its database or go-auth's keys can't be reached.
- **An account created, but not signed in**: Create an account signs in right after creating it. When signing in fails for one of the reasons above, the account exists, but the person gets the error page, and creating it again says that the username is taken.

What the pages say in these cases, and whether the forms keep what was typed, is still to be decided by the maintainer.
