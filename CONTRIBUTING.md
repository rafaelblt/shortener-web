# Contributing

How to work in this repository. These rules belong to the project and apply to every change, whoever makes it, person or agent. [AGENTS.md](AGENTS.md) only adds what is specific to agents.

## How the project is developed

The project is developed mostly by agents. Its maintainer decides what the app does and how it looks: its pages, its flows, the texts a person reads, and its visual language, as [docs/app/](docs/app/pages.md) and [docs/design.md](docs/design.md) describe them. How the code does it, its structure, names and tests, is up to whoever implements the change, within the rules of this document, which the [checks](#checks) verify.

- The documents of `docs/app/` and `docs/design.md` are where the maintainer sees the app without reading the code. A change of what the app does or how it looks isn't finished until they describe it.
- What only the maintainer can decide is asked, and not decided or deduced: a page or a flow, a text a person reads, a change of the visual language, a contract with the back ends, the reason behind a past decision, or a trade-off that the documents don't settle.
- A problem found outside the change is reported, or recorded as an [issue](#issues), and not fixed in the same change.

## Making a change

1. Read the [README](README.md), this document, and the documents of what the change touches: those of `docs/app/` and `docs/design.md` for what the app does and how it looks, and those of [docs/architecture/](docs/architecture/README.md) for the code. Then read the open issues of the area.
2. Change the code, its tests and its documents together.
3. Look at what a person sees: `npm run dev`, in the light and the dark theme, on a wide and a narrow window.
4. Run `npm run check` until it passes.
5. Commit, following [Commits](#commits).

## Checks

`npm run check` runs every check. There is no CI until the repository has a remote, so it runs before each commit. A change is finished when it passes.

| Script                    | Checks                                                                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `npm run lint`            | The formatting, with Prettier, and the rules of ESLint, the type-checked ones of typescript-eslint and of React |
| `npm run contracts:check` | That the types of the [contracts](docs/architecture/contracts.md) are the ones their schemas generate           |
| `npm run typecheck`       | The types, with TypeScript in strict mode                                                                       |
| `npm run layers`          | The dependencies between the [layers](docs/architecture/README.md#dependencies), with dependency-cruiser        |
| `npm run test`            | The unit and flow tests, with Vitest, and their coverage, which has to reach the thresholds of `vite.config.ts` |
| `npm run test:e2e`        | The browser tests, with Playwright, on a production build. It needs Chromium: `npx playwright install chromium` |

- `npm run format` formats the code. `npm run test:watch` runs the tests again on each change.
- The settings of each tool are in its file: `eslint.config.js`, `.dependency-cruiser.cjs`, `vite.config.ts` (with those of Vitest), `playwright.config.ts` and the `tsconfig` files, with the reason for each choice that isn't obvious. They can change, as anything else, when a need doesn't fit them.
- A finding is fixed in the code. A line that breaks a rule on purpose says so with an `eslint-disable-next-line` that names the rule and gives the reason after `--`.
- The coverage has to stay at 100% of the lines and the functions of `src/`, and the thresholds are raised as it grows, never lowered. Only `src/app/main.tsx`, which starts the app in the browser, is left out. Code that the tests can't reach is code to simplify.

## Principles

They are in order of priority. When two of them pull in opposite directions, the first one wins.

### Simplicity

Simple code, simple features, simple architecture.

- Solve today's problem with the simplest solution that works. Don't build for hypothetical needs.
- Only create an abstraction (an interface, a shared component, a layer of indirection) when there is more than one real use, or when it marks the boundary between layers, like the [services](docs/architecture/services.md).
- Before adding, consider removing.
- Don't add dependencies without a clear need. The browser, React and React Router already do a lot: forms, pending states, redirects, the clipboard.

### Changeability

Nothing written before is fixed. The code, its names, its abstractions, its tests and its documents change when a new need doesn't fit them.

- When the code doesn't do what a change needs, change it, instead of working around it.
- New code is easy to extend where its next need is likely: a table instead of a chain of conditions, one place to add a case. For example, a new message after a redirect is a new entry of the notices, and a new form of the page of a link is a new intent.
- Tests of behavior make it safe: they check what a person sees and does, not how the code does it, so they keep passing when the how changes, and fail when the what does.
- Change what the task needs, and no more. Improving code the task doesn't need is another task.

### Organization

Every responsibility in its proper place.

- Each layer has a role (see [Architecture](docs/architecture/README.md)) and dependencies point inward, which dependency-cruiser checks.
- One concept per module, and the module's name says what is inside. A component and its CSS module are named in PascalCase, as `LinkList.tsx` and `LinkList.module.css`; every other module, and every directory, in kebab-case, as `short-url.ts`.
- No repetition: each rule is written in one place and reused. The rules of a value are in the domain, which the forms and the simulation both use; the texts of the field errors are in one table; colors, sizes and spaces are tokens.
- Similar structures follow the same shape: every page is a route module, as [Pages](docs/architecture/pages.md#a-page) describes. Follow the existing pattern before creating a new one, and when a pattern no longer fits, change it everywhere it is used.

### Readability

Whoever reads the code understands what it does without having to decipher it.

- Descriptive, complete names, with no abbreviations. The exception is well-established terms such as `url` and `id`.
- Small functions and components with a single responsibility. If a name needs an "and", it is probably two.
- Explicit code over clever code: straightforward flow, little indirection, no magic.
- Strict types: no `any`, no non-null assertion (`!`), and a cast (`as`) only where TypeScript can't know what the code knows.

### Tests

Tests are a priority and follow the same principles: simple, organized, readable and focused.

- Every feature comes with tests covering the happy path, the error cases and the boundaries (for example, a slug's minimum and maximum length).
- One behavior per test. The test's name says which behavior, and in which situation.
- Test behavior, not implementation details: find elements as a person does, by their role, label or text, and not by their classes or structure.
- Fixing a bug starts with a test that reproduces it.
- Deterministic tests: the clock, the IDs, the generated slugs and the latency of the simulation are options that the tests set, and the time zone of the tests is UTC.

How they are written:

- When many tests make the same call with different values, they are one test with a table, `it.each`, whose rows name the case.
- A test doesn't check the value of a constant. It uses the constant, as the flow of the links page uses `PAGE_SIZE` to create one page and a bit.
- A test checks the texts a person reads where they are the behavior, such as the error of a field, through its accessible description.
- A test replaces a method of the simulated services only for what the simulation doesn't do: a failure, a request that stays pending, or a rule that only a back end checks.

How they are organized:

| Kind      | Where                              | What                                                                                   |
| --------- | ---------------------------------- | -------------------------------------------------------------------------------------- |
| Unit      | Next to the module, `*.test.ts(x)` | The domain, the simulation, the components and helpers of `ui/`                        |
| Flow      | `tests/flows/`                     | The whole app, in memory: the real routes, pages and simulation, as a person uses them |
| Browser   | `tests/e2e/`                       | The main flows in Chromium, on a production build                                      |
| Documents | `tests/docs.test.ts`               | The links of the [documents](#documents)                                               |

- The helpers the tests share are in `tests/support/`, imported as `@tests/support/…`: the simulated services with the test options, and rendering the app.
- The pages and the app aren't tested on their own: a page's loader, action and component are checked together, through the router, by the flows.
- The browser tests are few, for what only a browser shows: the production build, real navigation, an address opened directly.

## Design

The visual language is in [docs/design.md](docs/design.md). Every color, size and space is a token, and a component uses tokens, never raw values. A new component or pattern is described there in the same change.

## Comments

The code should say what it does on its own. Comments are for what it can't say: the reason behind a decision, a nuance, a constraint that comes from outside.

- Don't comment the obvious. If a comment explains _what_ the code does, improve the code (names, extracting a function) instead of commenting it.
- A doc comment (`/** … */`) only exists when it adds something the name and the signature don't say, such as when a value is missing, or what a function throws.
- If an explanation is too long for a comment, write it in a document and leave a short comment in the code pointing there:

  ```ts
  // The demo account the simulation adds. See docs/app/simulation.md#the-demo-account
  ```

## Documents

The documents are a reflection of the project: what they say is what the code does now, not what it should do. Each one has a subject, and says only what is about it:

- [README](README.md): what the app is, where it stands, its architecture in short, and how to start.
- This document: how to work in the project.
- [AGENTS.md](AGENTS.md): what is specific to agents.
- [docs/app/](docs/app/pages.md): what the app does, seen by whoever uses it or decides what it does: its [pages](docs/app/pages.md), with their texts and flows, and the [simulation](docs/app/simulation.md). They name no module, component or function.
- [docs/design.md](docs/design.md): the visual language: its principles, its tokens, its components and its patterns.
- [docs/architecture/](docs/architecture/README.md): how the code does it: the layers, and one document per layer, with what each module exports.
- [docs/issues/](docs/issues/README.md): the known problems and the open questions.

The contracts of the back ends, their endpoints and the shapes of their requests and answers, are their OpenAPI schemas, copied as they are into `contracts/` (see [Contracts](docs/architecture/contracts.md)). The documents of the back ends, which explain what they do and why, aren't copied or retold here: a document of this repository says what this app does, including what it does because of how a back end behaves.

### No repetition

Each thing is explained once, in the document whose subject it is, and the others link to it. A fact can appear in a document of the app and in one of the architecture, each at its level, such as the length of a slug, which `docs/app/pages.md` gives as a rule a person meets, and `docs/architecture/domain.md` as the constant and the function that check it. But its explanation, its reasons and its edge cases are written once. A repeated text is one more to keep up to date, and the first to go stale.

The same goes for the rules of the project: they are written here, and the other documents point to them, instead of repeating them.

### What a document says

- **What the code does** is concrete, and is either right or wrong. A description that doesn't match the code is fixed, and a missing one is added.
- **Why the code is the way it is** depends on whoever made the decision. Write a why only when it comes from that person: the decision was made in the current task, or its author stated it. Never deduce one from the code.

A bug that is known but not fixed yet, and a question still open, are [issues](#issues), linked from where a document describes what they affect.

### Every change covers its documents

Every task that changes code (a feature, a fix, a refactor, a removal) also covers the documents of what it touches:

1. Before changing the code, read the parts of the documents that describe it.
2. After changing it, fix what became wrong and describe what was added or removed: in `docs/app/` when what the app does changed, in `docs/design.md` when how it looks did, and in `docs/architecture/` when the code did.
3. Add the why of a decision made in the task when it helps a later reader understand something the code doesn't show.

`tests/docs.test.ts` checks that every link between the documents, and every reference of the code to a document, such as the comment above, leads to a file and a heading that exist.

## Issues

Until the repository is on GitHub, issues live in [docs/issues/](docs/issues/README.md), one file per issue. When to open one, the format, the states and the workflow are described there.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

<body>
```

- **Type:** one of those listed below.
- **Scope** (optional): the layer, and optionally the page, separated by `:`. For example, `pages:links`.
- **Description:** imperative mood, starting in lowercase, with no trailing period. Component and function names keep their spelling from the code.
- **Body** (optional): explains the why, or lists the changes as `-` items.
- One commit per logical change. Several small commits are better than one big commit.

| Type       | Use                                                          |
| ---------- | ------------------------------------------------------------ |
| `feat`     | New feature                                                  |
| `fix`      | Bug fix                                                      |
| `refactor` | Code change that doesn't change behavior, including removals |
| `test`     | Adds or changes tests                                        |
| `docs`     | Documentation                                                |
| `style`    | Formatting and imports, with no logic change                 |
| `chore`    | Configuration, dependencies and scripts                      |

| Scope                     | For                                          |
| ------------------------- | -------------------------------------------- |
| `domain`                  | Rules of the values                          |
| `services`                | What the pages ask of the back ends          |
| `simulation`              | The simulated back ends                      |
| `ui`                      | Tokens and components                        |
| `pages`, `pages:links`    | Pages, and one page                          |
| `app`                     | Routes, layouts and the assembly             |
| `support`, `flows`, `e2e` | Test infrastructure and suites (with `test`) |
| `issues`                  | Issue files (with `docs`)                    |

Examples from the history:

```
feat(domain): add the rules of usernames, passwords, slugs and target URLs
feat(simulation): give up after 10 attempts at an unused slug
test: check the main flows in a browser, against a production build
chore: check the layers of the code only, and import test helpers as @tests
```
