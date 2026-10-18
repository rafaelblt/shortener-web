---
status: open
resolution:
labels: [todo, tooling]
---

# 0002: The lint has no rules of accessibility

Opened on 2026-10-18.

The usual plugin for the accessibility of JSX, `eslint-plugin-jsx-a11y`, supports ESLint up to 9 in its latest version, 6.10.2, and the project uses ESLint 10, so `eslint.config.js` has no rule of accessibility. The tests find elements by their role and their name, which catches a field without a label or a button without a name in the flows they cover, but nothing checks the rest.

Whether to wait for the plugin, use ESLint 9, or check accessibility in another way, such as in the browser tests, is still to be decided.
