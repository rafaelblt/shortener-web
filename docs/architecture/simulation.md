# Simulation

`src/simulation/`: the implementation of the [services](services.md) that answers from memory, as the back ends would. What it does, seen by whoever uses the app, is in [the simulation of the app](../app/simulation.md).

## Assembly

`simulated-services.ts`

`createSimulatedServices(settings)` builds the `Services` on a new, empty `SimulationStore`. `settings` takes any of the `SimulationOptions` below, each with a default, and `withDemoData`, which adds the [demo account](#demo-data) when `true`; it is `false` by default.

| Option    | What                                    | Default                                    |
| --------- | --------------------------------------- | ------------------------------------------ |
| `latency` | How long each answer takes, a `Latency` | `NO_LATENCY`                               |
| `now`     | The clock                               | The time of the system                     |
| `newId`   | The ID of a new user or short URL       | `randomId()`, a UUID                       |
| `newSlug` | A generated slug                        | `randomSlug()`, 6 ASCII letters and digits |

The tests set them all, through `createTestServices()` of `tests/support/simulation.ts`.

## Store

`store.ts`

`SimulationStore` holds the `users`, by ID, with their passwords, the `shortUrls`, by ID, and `signedInUserId`, `null` while nobody is signed in. `userByUsername()` and `shortUrlBySlug()` find one by its value. `SimulationOptions` is the type of the options above.

## Auth

`simulated-auth-service.ts`

`SimulatedAuthService` implements `AuthService` on the store:

- `register()` checks the username and the password with the [domain](domain.md#user), both at once, then whether the normalized username is taken, and stores the user. It doesn't sign in.
- `signIn()` looks the normalized username up and compares the password, and answers `invalid_credentials` for any failure, values that break the rules included.
- `changePassword()` checks the new password first, as go-auth does, then the current one, then replaces it and signs out.

## Short URLs

`simulated-short-url-service.ts`

`SimulatedShortUrlService` implements `ShortUrlService` on the store. Every answer is a copy, so that nothing outside changes what is stored.

- `list()` sorts the user's short URLs newest first, and by ID when two were created at the same moment. A cursor is the time and the ID of the last short URL of a page, and the next page starts after it, so it keeps working after that short URL is deleted.
- `create()` and `update()` check the values given with the [domain](domain.md#short-url), before looking anything up, then whether the slug is taken, by anyone. `create()` asks `newSlug` for a slug when none is given, up to 10 times while the slug is taken, and throws after that.
- `resolve()` counts the resolution, and sets `lastResolvedAt`, only for an active short URL.

## Demo data

`demo-data.ts`

`DEMO_CREDENTIALS` is the account `demo`, with the password `demo-password`, and `addDemoData(store, options)` adds it with its 12 short URLs, dated back from `now`.

## Latency and randomness

- `latency.ts`: `Latency` is a `minMs` and a `maxMs`, and `wait(latency)` waits a random time between them, with no timer at all when both are 0, as in `NO_LATENCY`.
- `random.ts`: `randomId()` and `randomSlug()`, from the browser's `crypto`.
