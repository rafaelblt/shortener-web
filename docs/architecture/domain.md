# Domain

`src/domain/`: the types of users and short URLs, and the rules of their values, in plain TypeScript, with no other layer and no package. The forms use the rules to point out a mistake before anything is sent, and the [simulation](simulation.md) to answer as the back ends do. The rules, as a person meets them, are in [Pages](../app/pages.md#the-rules-of-the-values); they mirror those of go-auth and of the shortener.

## Issues

`issue.ts`

| Export               | What                                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| `Issue`              | Why a value breaks a rule: `missing`, `too_short`, `too_long`, `invalid_format` or `same_as_current` |
| `FieldIssues<Field>` | The issue of each field, when it has one                                                             |
| `hasIssues(issues)`  | Whether any field has an issue                                                                       |

A rule answers a single issue, the first it finds, or `undefined` when the value follows it: a field shows one message at a time.

## User

`user.ts`

| Export                                       | What                                                                                                                                                        |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `User`                                       | `id` and `username`                                                                                                                                         |
| `USERNAME_MIN_LENGTH`, `USERNAME_MAX_LENGTH` | 3 and 32                                                                                                                                                    |
| `PASSWORD_MIN_LENGTH`, `PASSWORD_MAX_BYTES`  | 8, and 72                                                                                                                                                   |
| `normalizeUsername(username)`                | The username in lowercase, as it is checked and stored                                                                                                      |
| `usernameIssue(username)`                    | Checks the normalized username: `missing`, then `invalid_format` for a character other than `a-z`, `0-9`, `.`, `_` and `-`, then `too_short` and `too_long` |
| `passwordIssue(password)`                    | `missing`, then `too_short` under 8 code points, then `too_long` over 72 bytes of UTF-8                                                                     |
| `newPasswordIssue(newPassword, current)`     | The issue of `passwordIssue`, or else `same_as_current` when both are the same                                                                              |

Lengths are counted in code points, as go-auth counts them, so an emoji is one character, and not two UTF-16 units.

## Short URL

`short-url.ts`

| Export                               | What                                                                                                                                                                                                                                      |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ShortUrl`                           | `id`, `slug`, `targetUrl`, `ownerId`, `status`, `resolutionCount`, `createdAt`, and `lastResolvedAt`, `null` until the first resolution                                                                                                   |
| `ShortUrlStatus`                     | `active` or `deactivated`                                                                                                                                                                                                                 |
| `SLUG_MIN_LENGTH`, `SLUG_MAX_LENGTH` | 3 and 30                                                                                                                                                                                                                                  |
| `slugIssue(slug)`                    | `missing`, then `invalid_format` for a character other than ASCII letters, digits, `_` and `-`, then `too_short` and `too_long`                                                                                                           |
| `targetUrlIssue(targetUrl)`          | `missing`, or else `invalid_format` unless the value has no character of the Unicode categories Other and Separator (controls, invisible characters and every space), starts with `https://` and a host, in any case, and parses as a URL |

`targetUrlIssue` doesn't check the host itself, as the shortener doesn't: `https://exa..mple.com` is accepted.
