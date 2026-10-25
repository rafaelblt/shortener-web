---
status: open
resolution:
labels: [bug, docs]
---

# 0012: The README and CONTRIBUTING.md say what is no longer so

Opened on 2026-10-24.

- The tree of [Architecture](../../README.md#architecture), in the README, says that `app/` holds the routes and the layouts "assembled on the simulation". `src/app/main.tsx` assembles them on the simulation or on the HTTP services, by the mode of Vite, as the tree of [Layers](../architecture/README.md#layers) says.
- [Checks](../../CONTRIBUTING.md#checks) says that there is no CI until the repository has a remote, and [Issues](../../CONTRIBUTING.md#issues), as [the issues](README.md), that they live in `docs/issues/` until the repository is on GitHub. The repository has a remote on GitHub, `origin`, private, and in step with `main`. There is no CI yet.

Whether the repository gets a CI now, and whether its issues move to GitHub, is still to be decided by the maintainer.
