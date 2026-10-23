# Contracts

`contracts/`: what the back ends receive and answer, as each one publishes it in an OpenAPI schema, and the TypeScript types generated from it. Nothing in it is written by hand.

| File                     | What                                              | From                                         |
| ------------------------ | ------------------------------------------------- | -------------------------------------------- |
| `go-auth.openapi.yaml`   | The schema of go-auth                             | `docs/api/openapi.yaml` of go-auth           |
| `go-auth.ts`             | The types of go-auth's requests and answers       | Generated from `go-auth.openapi.yaml`        |
| `shortener.openapi.yaml` | The schema of the shortener                       | `docs/service/openapi.yaml` of the shortener |
| `shortener.ts`           | The types of the shortener's requests and answers | Generated from `shortener.openapi.yaml`      |

## The copies

- A copy is the file of the back end as it is, never edited: it is replaced as a whole, so updating it takes no judgment, and its diff shows what changed in the contract.
- Only the schemas are copied. The documents of the back ends, which explain what they do and why, stay in their repositories. What this app does because of a behavior a schema can't express is described where the code that does it is.
- `npm run contracts:update` copies them from go-auth and the shortener checked out beside this repository, in `../go-auth` and `../shortener`, and generates the types again. The commit that updates them names the commit of each back end they come from.

## The types

- `npm run contracts:types` generates them with openapi-typescript, and `npm run contracts:check`, which `npm run check` runs, fails when they aren't the types of the schemas.
- openapi-typescript asks for TypeScript 5, and the `overrides` of `package.json` give it the TypeScript of the project instead, with which it works.
- Prettier and ESLint leave `contracts/` alone, so the copies stay as they came, and the types as they were generated.
