# Server

`server/`: the server of the app, which the browser reaches, and which reaches go-auth and the shortener for it. It serves the files of the app, keeps the session of each browser in a cookie, and passes the app's requests on to the back ends. Node runs its TypeScript as it is, with no build and no package: it imports only Node's own modules, and the types of the [contracts](contracts.md).

It holds the tokens of go-auth, so that no script of the page can read them: an injected one could act for the user only while the page is open, and couldn't take the session elsewhere.

## Settings

`settings.ts`: `settingsFromEnvironment(environment)` reads them, and throws a `SettingsError` that names what is wrong, which `main.ts` writes before it stops.

| Variable                | Required | Value                                                                                                                                                                                                                    |
| ----------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GO_AUTH_URL`           | Yes      | Where go-auth answers, such as `http://go-auth.railway.internal:8080`                                                                                                                                                    |
| `SHORTENER_URL`         | Yes      | Where the shortener's API answers                                                                                                                                                                                        |
| `SESSION_KEY`           | Yes      | The key that encrypts the sessions: 32 random bytes in base64, such as `openssl rand -base64 32` writes. Changing it signs everyone out.                                                                                 |
| `PORT`                  | No       | The port it listens on, 3000 by default                                                                                                                                                                                  |
| `CLIENT_ADDRESS_HEADER` | No       | The header in which the proxy in front of the server gives the client's address, such as `X-Real-IP`. Without it, the client is the peer of the connection. See [The address of the client](#the-address-of-the-client). |

`npm run start` runs it, and `npm run server` too, with the variables of a `.env` file, which `.env.example` lists. It serves the build of the app from `dist/`, which `npm run build` writes.

## The API

What the app asks of the server, by method and path. The table of `app.ts` routes them.

| Route                        | What                                                                                                                                                                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/session`           | The signed-in user, `{ "user": { "id", "username" } }`, or `401` with `not_signed_in`                                                                                                                                                     |
| `POST /api/session`          | Signs in: takes go-auth's body of a login, keeps the session in the cookie, and answers the user. A refusal of go-auth is passed on, with no cookie.                                                                                      |
| `DELETE /api/session`        | Signs out: ends the session at go-auth and forgets the cookie, and answers `204`, even when go-auth fails, which is logged                                                                                                                |
| `POST /api/session/password` | Changes the password of the signed-in user: takes go-auth's body without `username`, which comes from the session. Answers `204` and forgets the cookie, since go-auth ends every session of the user; a refusal of go-auth is passed on. |
| `POST /api/users`            | Creates an account, passing go-auth's request and answer on as they are                                                                                                                                                                   |
| `/api/v1/…`, any method      | The shortener's API, as it is: see [The shortener](#the-shortener)                                                                                                                                                                        |
| `GET /s/:slug`               | Follows a short link: see [Short links](#short-links)                                                                                                                                                                                     |
| `GET` of any other path      | A file of the app: see [The files of the app](#the-files-of-the-app)                                                                                                                                                                      |

Its errors have the shape of go-auth's, `{ "error": { "code", "message" } }`:

| Status | `code`                   | When                                                                                                                                                                                                                                      |
| ------ | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `400`  | `invalid_json_body`      | The body of a change of the password isn't a JSON object, in UTF-8                                                                                                                                                                        |
| `401`  | `not_signed_in`          | The route needs a session, and the request has none, or one that ended                                                                                                                                                                    |
| `404`  | `route_not_found`        | No route under `/api/` has the method and the path                                                                                                                                                                                        |
| `413`  | `request_body_too_large` | The body is larger than 64 KiB, go-auth's limit                                                                                                                                                                                           |
| `415`  | `unsupported_media_type` | A request under `/api/` other than a `GET` or a `HEAD` isn't JSON. A form of another site can't send JSON without the browser asking first, which this server never allows, so this keeps other sites from acting for a signed-in person. |
| `500`  | `internal_error`         | The server failed, which it logs                                                                                                                                                                                                          |
| `502`  | `back_end_failed`        | A back end couldn't be reached, or answered what the server can't use, which it logs                                                                                                                                                      |

## Sessions

`session.ts` and `session-cookie.ts`.

A `Session` is an `id`, the `user`, with its `id` and `username`, and the `accessToken` and the `refreshToken`, each a `value` and when it expires, `expiresAt`, by the clock of this server, counted from the `expires_in` of go-auth's answer. The `id` is a new UUID at each sign-in, and tells the session apart, so that it is [refreshed](#refreshing) one request at a time. The username comes from go-auth's `/v1/auth/me` at sign-in, since the tokens name only the user's ID.

- `sealSession(session, key)` encrypts and authenticates it with AES-256-GCM, with a new IV each time, into three parts of base64url: the IV, the encrypted session and the tag. `unsealSession(sealed, key)` answers the session, or null for a text that isn't one sealed with the key, such as one changed by a single character.
- The cookie is `__Host-session`, with `HttpOnly`, so no script reads it, `Secure`, `SameSite=Strict`, so no request of another site carries it, and `Path=/`. The prefix makes the browser keep it to this host. It lasts as long as the refresh token, which every refresh renews. `sealedSessionOf(request)`, `sessionCookie(sealed, maxAgeSeconds)` and `endedSessionCookie()`, which makes the browser forget it.
- `session-cookies.ts`: `SessionCookies` reads the session of a request, `of(request)`, as it is, or `freshOf(request, clientAddress)`, refreshed if need be, with the cookie that tells the browser of a change: a new one after a refresh, or the ended one for a cookie that isn't a session, or whose session ended. `cookieOf(session)` writes one.

The server keeps nothing of a session but what the next section says, so a deploy or a restart signs nobody out. It can't end a session by itself either: a copy of a cookie works until the session ends at go-auth, and then only while its access token lasts.

## Refreshing

`sessions.ts`: `Sessions` starts a session from go-auth's tokens, refreshes it, and ends it. The refresh token of go-auth works once, and a second use ends its session, so the refreshes of a session happen one at a time:

- A session is refreshed a minute before its access token expires, so that a request on its way doesn't reach the shortener with one that just expired.
- The requests of a session wait for each other to refresh it, in a queue by its `id`. The first refreshes it, and the others find it refreshed.
- The refreshed session is kept for five minutes, for the requests that still carry the cookie it replaced: the ones that were on their way, and the next ones when the answer with the new cookie got lost. A request with the replaced cookie gets the refreshed session, and the new cookie. After five minutes, the replaced cookie refreshes with a refresh token already used, and go-auth ends the session.
- When go-auth refuses the refresh token, the session ended, and the request is answered as one without a session. When go-auth fails, the request is answered `502`, and the cookie stays as it was.
- Signing out waits for a refresh of the session that is running, and ends it with its latest refresh token.

The queue and the kept sessions live in the memory of the process, so the server runs as a single process.

## The shortener

`shortener-routes.ts`: `ShortenerRoutes`.

- `forward(incoming)` passes a request under `/api/v1/` to the shortener as it came: the method, the path, the query, the body and its type, with the access token of the session, refreshed if need be, as `Authorization: Bearer`. Without a session, it goes without one, and the shortener answers `401`. The answer comes back with its status, its body, and only the headers the app reads: `Content-Type`, `Location`, `Retry-After` and `WWW-Authenticate`.
- `follow(incoming, slug)` is [Short links](#short-links).

### Short links

A `GET` of `/s/` and a slug asks the shortener to redirect it, at `/api/v1/slugs/{slug}/redirect`, and passes its `307` on, so the visitor goes straight to where the link leads, and the shortener counts the resolution. When the shortener doesn't redirect, the server answers the page of the app, with `404` for a slug the shortener doesn't find, deactivated or unknown, and `200` when it fails, and the [page of the short link](../app/pages.md#a-short-link) says why. A `HEAD` gets the page of the app, since following the link counts a resolution.

## The files of the app

`static-files.ts`: `StaticFiles` serves the build of the app.

- A file of the directory is served with its type. Those of `/assets/`, which the build names after their content, are kept by the browser for good; the others, `index.html` included, are checked again each time.
- A path with no extension, such as `/links/…`, which is a route of the app, gets `index.html`, and the app shows what the route does. A path with an extension that isn't a file gets `404`.
- A path that leads out of the directory, such as with `..%2f`, isn't served.
- Every file comes with a Content Security Policy that lets the page load and send only what is the app's own, so that a script injected into a page can neither load another nor send what it reads elsewhere, with `X-Content-Type-Options: nosniff` and `Referrer-Policy: same-origin`.

A request that isn't a `GET` or a `HEAD`, out of `/api/`, gets `405`.

## The address of the client

The back ends count their rate limits by the client's address, which the server gives them as `X-Forwarded-For`, so they have to trust the server's address for it. The address is the one in `CLIENT_ADDRESS_HEADER`, when it is set and the request has the header, or else the peer of the connection. Set it only to a header that the proxy in front of the server always sets, replacing the one a client sent, or a client could choose its address.

## Modules

| Module                                                                 | Exports                                                                                                                                                                                                                                    |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `main.ts`                                                              | Nothing: starts the server, with the settings of the environment. The tests leave it out.                                                                                                                                                  |
| `node-server.ts`                                                       | `serve(handler)`: a server of `node:http` for a `Handler`, which takes a `Request` of the Fetch API and the peer's address, and answers a `Response`                                                                                       |
| `app.ts`                                                               | `createApp(dependencies)`: the `Handler` of the server, which routes each request, and answers `500` or `502` when one fails. `AppDependencies` are the settings, where the build is, `fetch`, the clock and the IDs, which the tests set. |
| `messages.ts`                                                          | `Incoming`, a request with its URL and the client's address, `bodyOf(request)`, and the answers the routes share, such as `passedThrough(answer)`                                                                                          |
| `back-end.ts`                                                          | `callBackEnd(fetch, url, request)`, which gives the client's address, and `BackEndError`, thrown when a back end can't be reached or answers what the server can't use                                                                     |
| `go-auth.ts`                                                           | `GoAuth`: `send(path, body, clientAddress)`, and `refresh`, `me` and `logout`, with the types of [go-auth's contract](contracts.md)                                                                                                        |
| `session-routes.ts`                                                    | `SessionRoutes`: the routes of `/api/session` and `/api/users`                                                                                                                                                                             |
| `shortener-routes.ts`                                                  | `ShortenerRoutes`                                                                                                                                                                                                                          |
| `static-files.ts`                                                      | `StaticFiles`                                                                                                                                                                                                                              |
| `sessions.ts`, `session.ts`, `session-cookie.ts`, `session-cookies.ts` | [Sessions](#sessions) and [Refreshing](#refreshing)                                                                                                                                                                                        |
| `settings.ts`                                                          | [Settings](#settings)                                                                                                                                                                                                                      |

## Tests

The tests of each module are beside it, and run in Node. Most send requests to the server through its `Handler`, on fake back ends, with the helpers of `tests/support/server/`:

- `FakeBackEnds` is go-auth and the shortener in memory, on a clock the test moves. Its go-auth rotates the refresh tokens, and ends the session of one used twice, as the real one does; its shortener answers what it received, unless the test gives it another answer.
- `createTestApp()` and `createSignedInApp()` give the server on them, and a `TestBrowser`, which keeps the cookie as a browser does. A test can set its cookie, to send one that was replaced.
- `static/` is a build of the app with one page, one asset and an icon.
