# shortener-web

The web front end of the shortener: where a person creates an account, signs in, and manages their short links.

## Where it stands

**The pages are designed, and nothing reaches a server yet.** Every page and flow works against a [simulation](docs/app/simulation.md) that keeps everything in the memory of the browser tab, so the design can be seen and tried while the back ends get ready. A reload starts over. Consuming the real back ends is [issue 0001](docs/issues/0001-the-pages-dont-consume-the-back-ends.md).

## Scope

The app:

- creates accounts, signs in and out, and changes the password;
- shortens links, with a slug of the person's choice or a random one;
- lists the links of the signed-in person, and shows, edits, activates, deactivates and deletes each one;
- shows where a short link leads, standing in for the domain of short links while it is simulated.

It doesn't issue tokens, store users or links, or redirect short links itself: those belong to the back ends.

## How it fits

```
browser ──▶ shortener-web ──▶ go-auth     accounts and sessions
                          └─▶ shortener   short links
```

Two back ends, each its own project: go-auth, which holds the accounts and issues the access tokens, and the shortener, which holds the short links and checks those tokens. Until [issue 0001](docs/issues/0001-the-pages-dont-consume-the-back-ends.md) is done, the simulation stands in for both.

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

The app answers at `http://localhost:5173`. Sign in with the demo account, `demo` and `demo-password`, which has a dozen links, or create an account.

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
- [docs/issues/](docs/issues/README.md): the known problems and the open questions.
