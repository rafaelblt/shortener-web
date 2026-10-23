# AGENTS.md

What is specific to agents working in this repository. The project's rules aren't here: they are in [CONTRIBUTING.md](CONTRIBUTING.md), and they apply to everyone who changes the project, people and agents alike.

## Map

| Where                                             | What                                                                                      |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [README.md](README.md)                            | What the app is, where it stands, its architecture in short, and how to start             |
| [CONTRIBUTING.md](CONTRIBUTING.md)                | How to work: the principles, the checks, the tests, the documents, the issues and commits |
| [docs/app/](docs/app/pages.md)                    | What the app does, seen by whoever uses it: its pages and the simulation                  |
| [docs/design.md](docs/design.md)                  | The visual language, its tokens and its components                                        |
| [docs/architecture/](docs/architecture/README.md) | How the code does it: the layers, and one document per layer                              |
| [docs/issues/](docs/issues/README.md)             | The known problems and the open questions                                                 |
| `package.json`                                    | The dependencies and the scripts                                                          |

## Before a task

Read [CONTRIBUTING.md](CONTRIBUTING.md), all of it, and [docs/architecture/README.md](docs/architecture/README.md). Then read the documents of what the task touches:

| When the task                                                | Read                                                                                    |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| changes what a page shows or does, or a text it shows        | [docs/app/pages.md](docs/app/pages.md)                                                  |
| changes how the app looks                                    | [docs/design.md](docs/design.md)                                                        |
| changes what the simulation answers, or its demo data        | [docs/app/simulation.md](docs/app/simulation.md)                                        |
| touches `src/domain/`                                        | [docs/architecture/domain.md](docs/architecture/domain.md)                              |
| touches `src/services/`                                      | [docs/architecture/services.md](docs/architecture/services.md)                          |
| touches `src/simulation/`                                    | [docs/architecture/simulation.md](docs/architecture/simulation.md)                      |
| touches `src/ui/`                                            | [docs/architecture/ui.md](docs/architecture/ui.md) and [docs/design.md](docs/design.md) |
| touches `src/pages/`                                         | [docs/architecture/pages.md](docs/architecture/pages.md)                                |
| touches `src/app/`                                           | [docs/architecture/app.md](docs/architecture/app.md)                                    |
| touches `contracts/`, or what a back end receives or answers | [docs/architecture/contracts.md](docs/architecture/contracts.md)                        |
| touches `tests/`                                             | [Tests](CONTRIBUTING.md#tests) in CONTRIBUTING.md                                       |
| opens, closes or adds to an issue                            | [docs/issues/README.md](docs/issues/README.md)                                          |
| makes a commit                                               | [Commits](CONTRIBUTING.md#commits) in CONTRIBUTING.md                                   |

## During a task

- Stay inside the task. Report the problems you find outside it instead of fixing them.
- When you point out that something breaks a rule, cite the document where the rule is written, not this file. For example: "this repeats an explanation, see [No repetition](CONTRIBUTING.md#no-repetition)".
- Ask the user whatever only they can decide (see [How the project is developed](CONTRIBUTING.md#how-the-project-is-developed)), instead of deciding or deducing it.
- For a change a person sees, look at it in a browser, in both themes and on a narrow window, before saying it's done.
- Before saying a task is done, run `npm run check` and report its result.
- Commit or push only with the user's permission.
