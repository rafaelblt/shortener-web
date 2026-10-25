---
status: open
resolution:
labels: [bug, tooling]
---

# 0009: The check leaves the build of the simulation where the server serves the app from

Opened on 2026-10-24.

`npm run test:e2e`, which `npm run check` runs, builds the simulation with `npm run build:simulation` (see `playwright.config.ts`), which Vite writes to `dist/`. `npm run server` and `npm run start` serve the app from that same `dist/` (see `server/main.ts`), as does `npm run preview`. So, after `npm run check`, the server serves the simulation: every page shows its banner, and the app asks nothing of the server, whatever back ends it runs on.

To reproduce: `npm run check`, then `grep -l demo-password dist/assets/*.js` finds the build of the simulation, and `npm run server` serves it at `http://localhost:3000`.

The [README](../../README.md#development) and [Settings](../architecture/server.md#settings) say that the server serves the build that `npm run build` writes to `dist/`, which holds when `npm run build` runs last. The image isn't affected: `.dockerignore` keeps `dist/` out, and the image builds the app itself.
