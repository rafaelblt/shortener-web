# App

`src/app/`: the routes, the layouts, and the start of the app in the browser, which puts every layer together, on the [simulation](simulation.md) or on the [HTTP services](http.md).

## The start

`main.tsx` imports the fonts and the [styles](ui.md#styles), and builds the services by the mode of Vite: in `simulation`, which `npm run dev` and `npm run build:simulation` use, the simulated ones, with the demo account and a latency of 250 to 700ms, and otherwise the HTTP ones. It creates the router with them, and renders it in `#root`, under the `SimulationBanner` in the simulation. Vite writes the mode into the build, which so leaves out the code of the other one. It is the only module that runs only in the browser, and the only one the tests leave out.

## The router

`router-context.ts`: `contextWith(services, { simulated })` returns the `getContext` of the router: each navigation and form gets a new `RouterContextProvider`, with the services in `servicesContext`, and whether they are the simulation in `simulatedContext`. `main.tsx` gives it the services of its mode, and the flow tests their own, simulated unless a test says otherwise.

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
| `RootLayout.tsx`       | The `PendingBar`, visible while the router isn't idle, the page, and the restoration of the scroll                                                                                                           |
| `AuthLayout.tsx`       | The wordmark, and the page in a narrow column                                                                                                                                                                |
| `SignedInLayout.tsx`   | Its `loader` returns the signed-in user, and the layout shows the header, with the navigation, the username and **Sign out**, over the page. **Links** is the current item on `/` and on the page of a link. |
| `SimulationBanner.tsx` | The [banner](../app/simulation.md#the-banner), with the demo account of `DEMO_CREDENTIALS`, which `main.tsx` shows above the router in the simulation                                                        |
