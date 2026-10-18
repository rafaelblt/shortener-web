# Pages

`src/pages/`: one directory per page, with its route module and the components only it uses, and `shared/`, what the pages share. What each page shows and does is in [Pages](../app/pages.md); how the routes are assembled, in [app](app.md#the-routes).

## A page

Each page is a route module of React Router: a module that exports what the route of the page needs, which `src/app/routes.tsx` puts together.

| Export        | What                                                                                                                                                                                            |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loader`      | Loads what the page shows, with the [services](services.md) of the router's context, and returns it as a typed object, or throws a `redirect()`.                                                |
| `action`      | Handles the forms of the page: checks the values with the [domain](domain.md), asks the services, and returns what the page shows, such as the message of each field, or throws a `redirect()`. |
| The component | Named after the page, as `LinksPage`. It reads the loader's data with `useLoaderData<Data>()` and the action's with `useActionData<Data>()`, each typed by an interface of the module.          |

- A page whose loader or action needs the services reads them with `context.get(servicesContext)`, and the signed-in user with `context.get(signedInUserContext)`.
- A page with more than one form tells them apart by a hidden field, `intent`, as [A link](#a-link) does.
- A form is a `<Form method="post">` of React Router, with `noValidate`: the action checks the values, so that the messages are the app's own.
- The component sets the title of the window with a `<title>`, which React places in the head.

| Directory     | Page                                                   | Exports                                      |
| ------------- | ------------------------------------------------------ | -------------------------------------------- |
| `sign-in/`    | [Sign in](../app/pages.md#sign-in)                     | `loader`, `action`, `SignInPage`             |
| `register/`   | [Create an account](../app/pages.md#create-an-account) | `loader`, `action`, `RegisterPage`           |
| `links/`      | [Links](../app/pages.md#links)                         | `loader`, `action`, `LinksPage`, `PAGE_SIZE` |
| `link/`       | [A link](../app/pages.md#a-link)                       | `loader`, `action`, `LinkPage`               |
| `account/`    | [Account](../app/pages.md#account)                     | `loader`, `action`, `AccountPage`            |
| `sign-out/`   | No page: signs out                                     | `loader`, `action`                           |
| `short-link/` | [A short link](../app/pages.md#a-short-link)           | `loader`, `ShortLinkPage`                    |
| `not-found/`  | [Not found](../app/pages.md#not-found)                 | `NotFoundPage`                               |
| `error/`      | [Errors](../app/pages.md#errors)                       | `ErrorPage`                                  |

## Sign in and create an account

- The loaders of both send whoever is signed in to `/`.
- The action of Sign in sends back to the `next` of the address when it is a path of the app, starting with one `/` and not `//` or `/\`, which a browser would read as another site; otherwise to `/`.
- The action of Create an account signs in right after creating the account, since `register()` doesn't.

## Links

`links/`: `LinksPage.tsx`, with the form, `CreateLinkForm.tsx`, and the list, `LinkList.tsx`.

- The loader reads `?pages=` from the address, 1 by default and at most 50, and asks `list()` for as many pages of `PAGE_SIZE`, 10, one after the other, so that the list loaded again after an action shows as many links as before. **Load more** is a link to the next number of pages.
- The action creates the link, and returns it, which the page shows in a notice, highlights in the list, and `CreateLinkForm` takes as the signal to empty itself.

## A link

`link/`: `LinkPage.tsx`, with its sections, `EditLinkForm.tsx`, `LinkStatus.tsx` and `DeleteLink.tsx`.

- `link-intent.ts`: the intents of the forms of the page, `edit`, `enable`, `disable` and `delete`, and `isLinkIntent()`. The action throws on an intent the page has no form for.
- `edit-link.ts`: `editLink()`, the action of `edit`. The form sends the saved values in hidden fields, and only the values that differ from them are sent to `update()`, so that a value accepted under older rules of the back end isn't checked again when it stays the same.
- `EditLinkForm` enables **Save changes** by comparing the fields with the saved values on each change, and is keyed by the saved values, so that it starts over once they change.
- `DeleteLink` keeps whether it is asking for confirmation in its state; only the confirmation is a form.

## The error page

`error/ErrorPage.tsx`: the `ErrorBoundary` of the routes. A `NotSignedInError` sends to `/sign-in`, with the address as `next`; any other error shows the page, whose **Try again** runs the loaders again with `useRevalidator()`, without reloading the tab, which would lose the [simulation](simulation.md).

## Shared

`shared/`:

| Module                                                              | Exports                                                                                                                                                                                                        |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `route-context.ts`                                                  | `servicesContext` and `signedInUserContext`, the contexts of the router that hold the services and the signed-in user                                                                                          |
| `form-data.ts`                                                      | `formText(formData, name)`: the text of a field, or `""`                                                                                                                                                       |
| `field-messages.ts`                                                 | `fieldMessage(field, issue)` and `fieldMessages(issues)`: the [messages](../app/pages.md#the-messages-of-the-fields) of the fields, from one table                                                             |
| `notices.ts`                                                        | `withNotice(path, name)` adds a notice to the address a redirect leads to, as `?notice=signed-out`, and `useNotice()` reads its text; the [notices](../app/pages.md#notices) are one table                     |
| `short-link.ts`                                                     | `shortLinkUrl(slug)`, `shortLinkText(slug)` without the scheme, `SHORT_LINK_PREFIX`, and `withoutScheme(url)`. Short links start with `VITE_SHORT_LINK_BASE_URL`, or else with the app's own address and `/s`. |
| `use-submitting.ts`                                                 | `useSubmitting(intent?)`: whether a form of the page, or the one of the intent, is being sent; `INTENT`, the name of the hidden field                                                                          |
| `StatusBadge.tsx`                                                   | `StatusBadge`: the `Badge` of a status                                                                                                                                                                         |
| `forms.module.css`, `AuthPage.module.css`, `MessagePage.module.css` | The layout of the forms, of Sign in and Create an account, and of the pages that only show a message                                                                                                           |

`short-link/short-link-path.ts`: `shortLinkPath(slug)`, the path of the page of a short link in the app, which **Open** follows.
