# Services

`src/services/`: what the pages ask of the back ends, as interfaces, with the failures each operation can answer. The pages only know these interfaces. The [simulation](simulation.md) implements them, and so does [http](http.md), by asking the server of the app; [app](app.md#the-start) chooses which one runs.

The interfaces are shaped after what the pages need, not after the endpoints of the back ends: an implementation keeps the tokens of the session, and calls whatever it takes, such as signing in and then asking who the user is.

## Result

`result.ts`

`Result<Value, Error>` is either `{ ok: true, value }` or `{ ok: false, error }`, built with `ok(value)` and `err(error)`. An operation returns one for the failures its caller is expected to handle, each with a `code`.

## Errors

`errors.ts`

| Export                | What                                                                                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `InvalidInput<Field>` | `invalid_input`, with the [issue](domain.md#issues) of each field at fault, in `fields`                                                                                                    |
| `NotFound`            | `not_found`                                                                                                                                                                                |
| `NotSignedInError`    | Thrown, not returned, by an operation that needs a signed-in user when there is none, such as when the session ended. The [error page](pages.md#the-error-page) sends to the sign-in page. |

## Auth

`auth-service.ts`: `AuthService`, the accounts and the session.

| Method                   | Answers                            | Its errors                                                                         |
| ------------------------ | ---------------------------------- | ---------------------------------------------------------------------------------- |
| `currentUser()`          | The signed-in `User`, or `null`    |                                                                                    |
| `register(credentials)`  | The new `User`, without signing in | `username_taken`, `invalid_input` on `username` and `password`                     |
| `signIn(credentials)`    | The `User`                         | `invalid_credentials`, whatever is wrong                                           |
| `signOut()`              | Nothing                            |                                                                                    |
| `changePassword(change)` | Nothing, and the session ends      | `invalid_credentials`, `invalid_input` on `newPassword`; throws `NotSignedInError` |

`Credentials` is a `username` and a `password`, and `PasswordChange` a `currentPassword` and a `newPassword`.

## Short URLs

`short-url-service.ts`: `ShortUrlService`, the short URLs of the signed-in user. A short URL of someone else is `not_found`, as one that doesn't exist, and every method but `resolve` throws `NotSignedInError` without a signed-in user.

| Method                      | Answers                                                                            | Its errors                                                      |
| --------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `list(request)`             | A `ShortUrlPage`: `items`, newest first, and `nextCursor`, `null` on the last page |                                                                 |
| `get(id)`                   | The `ShortUrl`                                                                     | `not_found`                                                     |
| `create(shortUrl)`          | The new `ShortUrl`, its slug generated when left out                               | `slug_taken`, `invalid_input` on `targetUrl` and `slug`         |
| `update(id, changes)`       | The `ShortUrl`, with the values given changed, both or neither                     | `nothing_to_update`, `invalid_input`, `not_found`, `slug_taken` |
| `enable(id)`, `disable(id)` | The `ShortUrl`, active or deactivated                                              | `not_found`                                                     |
| `delete(id)`                | Nothing                                                                            | `not_found`                                                     |
| `resolve(slug)`             | The target URL, for anyone, counting the resolution                                | `not_found`, `deactivated`                                      |

A `PageRequest` has a `limit`, and the `cursor` of the previous page for the next one.

## Services

`services.ts`: `Services`, with `auth` and `shortUrls`, which [app](app.md#the-router) gives the router.
