---
status: open
resolution:
labels: [todo, services, app, docs]
---

# 0001: The pages don't consume the back ends

Opened on 2026-10-18.

The pages were designed first, on purpose, before any request to the back ends. The only implementation of the services (`src/services/`) is the simulation (`src/simulation/`), and `src/app/main.tsx` builds the router on it: no page reaches go-auth or the shortener, and everything resets on reload (see `docs/app/simulation.md`).

Consuming them takes implementations of `AuthService` and `ShortUrlService` that call the back ends, given to the router by `src/app/main.tsx` instead of the simulation, which then goes away with its banner. The pages don't change, since they only know the interfaces of the services.

Still to be decided, by the maintainer:

- How this repository documents what it consumes of the back ends, whose contracts are in their own documents, and how it learns of their changes.
- Where the tokens of a session are kept, and how they are refreshed, given that a refresh token of go-auth works once, so two tabs refreshing at once end the session.
- How the app reaches the back ends once deployed (see issue 0003).
- What the app does when a back end can't answer, which the simulation never shows.

The back ends are changing meanwhile, and the implementations depend on it: go-auth is getting an endpoint that answers who the user is, and a sign-out that ends the session on its side, and the shortener is to accept the access tokens of go-auth, which have no issuer or audience.
