---
status: open
resolution:
labels: [todo, deploy]
---

# 0003: Nothing builds or serves the app for a deploy

Opened on 2026-10-18.

The repository has no image or server configuration: `npm run build` writes the static files of the app to `dist/`, and `npm run preview` serves them only for development. A server for them has to answer `index.html` for any path that isn't a file, since the routes are the app's own, such as `/links/…`.

The plan is to serve it with Caddy on Railway, as the maintainer's other sites are, and to have the same server pass the requests of the app to go-auth and the shortener, on the same origin, so that neither back end needs CORS. How, and whether the domain of short links is the same service (see issue 0004), are still to be decided.
