# Architecture

How the code is organized, and where each thing is. What the app does, seen from outside, is in [docs/app/](../app/pages.md), and each of the other documents of this directory describes the code of one layer, as it is now: each module, and what it exports.

## Layers

```
src/
├── domain/      the rules of usernames, passwords, slugs and target URLs
├── services/    what the pages ask of the back ends: the interfaces, and their errors
├── simulation/  answers the services from memory, as the back ends would
├── http/        answers the services by asking the server of the app
├── ui/          the design tokens, and the components the pages are built from
├── pages/       one directory per page: its loader, its action and its component
└── app/         the routes and the layouts, assembled on the simulation or on http
```

| Layer             | Document                       |
| ----------------- | ------------------------------ |
| `src/domain/`     | [domain.md](domain.md)         |
| `src/services/`   | [services.md](services.md)     |
| `src/simulation/` | [simulation.md](simulation.md) |
| `src/http/`       | [http.md](http.md)             |
| `src/ui/`         | [ui.md](ui.md)                 |
| `src/pages/`      | [pages.md](pages.md)           |
| `src/app/`        | [app.md](app.md)               |

Outside `src/`:

| Directory    | What                                                                                                  | Document                     |
| ------------ | ----------------------------------------------------------------------------------------------------- | ---------------------------- |
| `server/`    | The server of the app: serves its files, keeps the sessions, and passes its requests to the back ends | [server.md](server.md)       |
| `contracts/` | The schemas of the back ends, and the types generated from them                                       | [contracts.md](contracts.md) |

The stack: React, with React Router in its data mode, for the routes, their loaders and actions, and the forms; TypeScript; CSS Modules over the tokens of [Design](../design.md#tokens); Vite to serve and build it.

## Dependencies

Dependencies point inward, toward the domain:

| Layer        | May import                                                                          |
| ------------ | ----------------------------------------------------------------------------------- |
| `domain`     | Nothing: no other layer, and no package                                             |
| `services`   | `domain`                                                                            |
| `simulation` | `services`, `domain`                                                                |
| `http`       | `services`, `domain`, and the types of `contracts/`                                 |
| `ui`         | Packages only, such as React: no other layer, so it knows nothing of users or links |
| `pages`      | `services`, `domain`, `ui`, and packages, but not `simulation` or `http`            |
| `app`        | Everything: it assembles the layers                                                 |

- The pages know the back ends only through the interfaces of `services`, so which implementation runs is up to `app`, and no page changes with it.
- No module of `src/` imports a test, or a development dependency, but a declaration of types.
- The server imports nothing of `src/` or of the tests, and no package, only Node's own modules and the types of `contracts/`, and `src/` imports nothing of the server.
- No import is circular.

dependency-cruiser checks these rules, with `.dependency-cruiser.cjs` (see [Checks](../../CONTRIBUTING.md#checks)). The tests may import any layer.

## A request

How the app shortens a link, as every form does:

1. The person sends the form of [Links](../app/pages.md#links). React Router calls the [action](pages.md#a-page) of the page, with the form's data and the router's context, which holds the [services](services.md), as [app](app.md#the-router) put them there.
2. Before the action, the [middleware](app.md#the-guard) of the pages for signed-in users checks that someone is signed in, and puts the user in the context.
3. The action checks the values with the rules of the [domain](domain.md), and asks `ShortUrlService.create()`, which [http](http.md) implements by asking the [server](server.md), which asks the shortener, and the [simulation](simulation.md) by checking them again, as the shortener does.
4. It returns what the page shows: the new link, or the message of each field at fault. React Router then runs the loaders of the page again, so the list shows the new link.

## Across the layers

- **Expected failures are values.** A failure a page handles, such as a taken slug, is returned in a [`Result`](services.md#result), whose error has a `code`. Exceptions are only for programming errors, and for a failure no page handles on its own, which the [error page](pages.md#the-error-page) shows.
- **The rules are written once.** The forms and the simulation check a value with the same function of the domain.
- **The services reach the routes through the router.** No module holds them: `app` gives them to the router, which hands them to each loader, action and middleware.
- **Time and randomness are given.** The simulation receives its clock, its IDs, its generated slugs and its latency, which the tests set.
