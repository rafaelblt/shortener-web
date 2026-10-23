---
status: closed
resolution: fixed
labels: [todo, deploy]
---

# 0003: Nothing builds or serves the app for a deploy

Opened on 2026-10-18.

The repository has no image or server configuration: `npm run build` writes the static files of the app to `dist/`, and `npm run preview` serves them only for development. A server for them has to answer `index.html` for any path that isn't a file, since the routes are the app's own, such as `/links/…`.

The plan is to serve it with Caddy on Railway, as the maintainer's other sites are, and to have the same server pass the requests of the app to go-auth and the shortener, on the same origin, so that neither back end needs CORS. How, and whether the domain of short links is the same service (see issue 0004), are still to be decided.

## 2026-10-23: Closed as fixed

The `Dockerfile` builds an image that serves the app with its own server, in `server/`, which the maintainer chose instead of Caddy: a single Node process that serves the build, answering `index.html` for the routes of the app, keeps the sessions, and passes the requests of the app to go-auth and the shortener, on the same origin. The short links are the same service's `/s/` addresses, until issue 0004 decides on a domain. What deploying it takes is in `docs/architecture/server.md`. The image was run against go-auth and the shortener built from their own images, and the app worked through every page.
