# shortener-web

The web front end of the shortener: where a person creates an account, signs in, and manages their short links.

## Where it stands

**The app runs on go-auth and the shortener, through a server of its own, and isn't deployed yet.** Its image, and what deploying it takes, are in [The image](docs/architecture/server.md#the-image). In development, and in its tests, it runs on a [simulation](docs/app/simulation.md) that keeps everything in the memory of the browser tab, so that every page can be seen and tried without the back ends.

## Scope

The app:

- creates accounts, signs in and out, and changes the password;
- shortens links, with a slug of the person's choice or a random one;
- lists the links of the signed-in person, and shows, edits, activates, deactivates and deletes each one;
- follows a short link, at an address of its own, to where it leads.

It doesn't issue tokens or store users or links: those belong to the back ends. Its server keeps the session of each browser, and passes the requests of the app, and the short links, on to them.

## How it fits

```
browser ──▶ shortener-web ──▶ go-auth     accounts and sessions
                          └─▶ shortener   short links
```

Two back ends, each its own project: go-auth, which holds the accounts and issues the access tokens, and the shortener, which holds the short links and checks those tokens. The browser reaches only the server of shortener-web, which keeps the tokens of go-auth in an encrypted cookie, so that no script of the page can read them, and asks the back ends for the app (see [Server](docs/architecture/server.md)).

## Architecture

```
src/
├── domain/      the rules of usernames, passwords, slugs and target URLs
├── services/    what the pages ask of the back ends: the interfaces, and their errors
├── simulation/  answers the services from memory, as the back ends would
├── http/        answers the services by asking the server of the app
├── ui/          the design tokens, and the components the pages are built from
├── pages/       one directory per page: its loader, its action and its component
└── app/         the routes and the layouts, assembled on the simulation
server/          the server of the app: its files, the sessions, and the requests to the back ends
contracts/       the schemas of the back ends, and the types generated from them
```

Dependencies point inward, and a check fails when they don't. The details are in [docs/architecture/](docs/architecture/README.md).

## Development

Requirements: Node.js 24 or newer.

```bash
npm install
npx playwright install chromium   # once, for the tests in a browser
npm run dev
```

The app answers at `http://localhost:5173`, on the simulation. Sign in with the demo account, `demo` and `demo-password`, which has a dozen links, or create an account.

To run it on the back ends instead, with go-auth and the shortener running, and the shortener taking go-auth's tokens, with `JWT_ALGORITHMS=EdDSA` and `JWT_JWKS_URL` set to go-auth's `/.well-known/jwks.json`:

```bash
cp .env.example .env   # then set SESSION_KEY, and the addresses of the back ends
npm run server         # the server of the app, at http://localhost:3000
npm run dev:real       # the app, at http://localhost:5173, which asks that server
```

`npm run build` and `npm run server` serve the build, as it is deployed, at `http://localhost:3000`.

```bash
npm run check
```

runs the formatter, the linter, the type checker, the check of the layers, and every test, the ones in a browser included. Before changing anything, read [CONTRIBUTING.md](CONTRIBUTING.md).

## Documentation

- [CONTRIBUTING.md](CONTRIBUTING.md): how to work in the project, person or agent: the principles, the checks, and the conventions of the tests, comments, documents, issues and commits.
- [AGENTS.md](AGENTS.md): what is specific to agents.
- [docs/app/](docs/app/pages.md): what the app does, seen by whoever uses it: its [pages](docs/app/pages.md) and its [simulation](docs/app/simulation.md).
- [docs/design.md](docs/design.md): the visual language, its tokens and its components.
- [docs/architecture/](docs/architecture/README.md): how the code does it: the layers, and one document per layer.
- [Issues](https://github.com/rafaelblt/shortener-web/issues): the known problems and the open questions.
