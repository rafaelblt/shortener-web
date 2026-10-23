# HTTP

`src/http/`: the implementation of the [services](services.md) that asks the [server of the app](server.md), at the same address as the app, so that the cookie of the session goes with every request. It speaks go-auth's and the shortener's contracts, with the types of [contracts/](contracts.md): the server answers in go-auth's shapes, and passes the shortener's requests and answers as they are.

## Assembly

`http-services.ts`: `createHttpServices(fetch)` builds the `Services` on a `fetch`, the browser's by default, which the tests replace.

## Requests

`server-requests.ts`

| Export                                        | What                                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `send(fetch, method, path, body?)`            | Sends a request, with the body as JSON. Every request but a `GET` says it is JSON, which the server requires.                                                         |
| `bodyOf(answer)`                              | The body of an answer, with the type of the contract                                                                                                                  |
| `errorBodyOf(answer)`                         | The body of an error a caller may handle. Throws an `UnexpectedAnswerError` for one no caller handles: a failure of the server or of a back end, or too many requests |
| `unexpected(answer)`, `UnexpectedAnswerError` | The error thrown for an answer no caller handles, which the [error page](pages.md#the-error-page) shows                                                               |

`field-issues.ts`: `fieldIssuesOf(issues, fieldNames)` turns the issues a back end found in the fields of a request into the [issues](domain.md#issues) of the app: the first of each field, under the name the app gives the field. go-auth's `invalid_characters`, and the shortener's `invalid_type`, are `invalid_format`, as is an issue the app doesn't know.

## Auth

`http-auth-service.ts`: `HttpAuthService` implements `AuthService` on the [API of the server](server.md#the-api).

| Method             | Asks                         | Answers                                                                                                    |
| ------------------ | ---------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `currentUser()`    | `GET /api/session`           | The user, or null for `401`                                                                                |
| `register()`       | `POST /api/users`            | `username_taken` for `username_already_exists`, and `invalid_input` for `validation_failed`                |
| `signIn()`         | `POST /api/session`          | `invalid_credentials`                                                                                      |
| `signOut()`        | `DELETE /api/session`        | Nothing                                                                                                    |
| `changePassword()` | `POST /api/session/password` | `invalid_credentials`, and `invalid_input` on `newPassword`; throws `NotSignedInError` for `not_signed_in` |

## Short URLs

`http-short-url-service.ts`: `HttpShortUrlService` implements `ShortUrlService` on the shortener's API, under `/api/v1/`.

- A short URL comes from the shortener's fields, `target_url` as `targetUrl`, with its dates as `Date`s.
- `401` throws `NotSignedInError`, but for `resolve()`, which needs no session.
- A short URL the shortener doesn't find is `not_found`, and so is an ID that isn't a UUID, which the shortener refuses as `invalid_input` on `id`, since it names no short URL either.
- `create()` and `update()` send the values the shortener's way, leaving out those not given, and answer `slug_taken`, `nothing_to_update`, and `invalid_input` on `targetUrl` and `slug`.
- `resolve()` answers `not_found` for `shorturl_not_found`, and `deactivated` for `shorturl_deactivated`.

Any other answer throws an `UnexpectedAnswerError`.
