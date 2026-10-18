# App

`src/app/`: the routes, the layouts, and the start of the app in the browser, which puts every layer together on the [simulation](simulation.md).

## The start

`main.tsx` imports the fonts and the [styles](ui.md#styles), builds the simulated services with the demo account and a latency of 250 to 700ms, creates the router with them, and renders it in `#root`. It is the only module that runs only in the browser, and the only one the tests leave out.

## The router

`router-context.ts`: `contextWith(services)` returns the `getContext` of the router: each navigation and form gets a new `RouterContextProvider`, with the services in `servicesContext`. `main.tsx` gives it the simulation, and the flow tests their own services.

## The routes

`routes.tsx`: `routes`, every route of the app:

```
/                  RootLayout, with ErrorPage as its error boundary
├── (AuthLayout)
│   ├── sign-in
│   └── register
├── (SignedInLayout, guarded)
│   ├── (index)    links
│   ├── links/:id
│   └── account
├── sign-out       no page
├── s/:slug
└── *              not found
```

The routes in parentheses have no path of their own: they lay out the routes under them.

## The guard

`require-signed-in-user.ts`: `requireSignedInUser`, the middleware of the routes for signed-in users. It runs before their loaders and actions, sends whoever isn't signed in to `/sign-in`, with the address as `next`, and puts the user in `signedInUserContext`.

## Layouts

| Module                 | What                                                                                                                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `RootLayout.tsx`       | The `PendingBar`, visible while the router isn't idle, the `SimulationBanner`, the page, and the restoration of the scroll                                                                                   |
| `AuthLayout.tsx`       | The wordmark, and the page in a narrow column                                                                                                                                                                |
| `SignedInLayout.tsx`   | Its `loader` returns the signed-in user, and the layout shows the header, with the navigation, the username and **Sign out**, over the page. **Links** is the current item on `/` and on the page of a link. |
| `SimulationBanner.tsx` | The [banner](../app/simulation.md#the-banner), with the demo account of `DEMO_CREDENTIALS`. It goes away with the simulation.                                                                                |
