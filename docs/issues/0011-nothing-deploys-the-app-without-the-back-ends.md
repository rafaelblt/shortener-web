---
status: open
resolution:
labels: [question, deploy, simulation]
---

# 0011: Nothing deploys the app without the back ends

Opened on 2026-10-24.

The maintainer plans to deploy the app, for a portfolio, without deploying go-auth or the shortener. What the repository has for a deploy needs them:

- The image, of the `Dockerfile`, builds the app with `npm run build`, which runs on the HTTP services and asks the server. The server doesn't start without `GO_AUTH_URL`, `SHORTENER_URL` and `SESSION_KEY`. With back ends where nothing answers, the pages load, but signing in and creating an account get the error page, since the server answers `502`, and a short link answers JSON (issue 0010).
- The simulation, which needs no back end, is a mode of Vite, for `npm run dev` and the browser tests, and `npm run build:simulation` builds it, but nothing deploys it: the image doesn't build it, and its server asks the shortener for every `/s/…`.
- [The simulation](../app/simulation.md) says that the app runs on the back ends once deployed, and the [README](../../README.md#where-it-stands) that it runs on go-auth and the shortener.

In the simulation, nothing leaves the tab: no request reaches a server, and a visitor sees nothing another created.

Still to be decided by the maintainer:

- Whether the deploy is the simulation, and how it is served: as files, by a host that answers `index.html` for the routes of the app, or by the image, in a mode that needs no back end.
- For files served by a host, whether it sends the headers that the server sends with them, its Content Security Policy among them (see [The files of the app](../architecture/server.md#the-files-of-the-app)).
- What the README and the documents of the app say about it.
