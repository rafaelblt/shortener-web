---
status: closed
resolution: fixed
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

## 2026-10-23: Closed as fixed

The app runs on go-auth and the shortener, through a server of its own, in `server/`, and the simulation became a mode of the app, for development and the tests: `src/app/main.tsx` builds the services that ask that server, `src/http/`, unless Vite builds the simulation. The questions left open were decided by the maintainer:

- **How this repository documents what it consumes**: it copies the OpenAPI schemas of the back ends as they are, into `contracts/`, and generates their types, which `npm run check` keeps in step with them. The documents of the back ends aren't copied. See `docs/architecture/contracts.md`.
- **Where the tokens are kept, and how they are refreshed**: the server keeps them, in an `HttpOnly` cookie it encrypts, and refreshes a session one request at a time, keeping the refreshed one for five minutes for the requests that carry the cookie it replaced. go-auth's documents recommend a backend-for-frontend for a browser since 2026-10-21. See `docs/architecture/server.md`.
- **How the app reaches the back ends once deployed**: through that same server, the only one the browser reaches. Building and deploying it stays with issue 0003.
- **What the app does when a back end can't answer**: the error page, as for any failure, for now.
