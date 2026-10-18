# UI

`src/ui/`: the design tokens, the global styles, and the components the pages are built from. What each component is for, and the rules of the design, are in [Design](../design.md); this document is about the code. The components know nothing of users or links, and import no other layer.

## Styles

- `styles/tokens.css`: the [tokens](../design.md#tokens), as custom properties of `:root`, with the colors of the dark theme under `prefers-color-scheme: dark`.
- `styles/global.css`: the reset and the defaults of the document: the font, the colors of the page, links, headings and the focus ring.

Both are imported once, by `src/app/main.tsx`, after the fonts. Each component has a CSS module beside it, with the same name, as `Button.module.css`.

## Components

| Module                 | Exports                                                                                                                                                                                                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button.tsx`           | `Button`: a `<button>`, of `type="button"` unless told otherwise, with every attribute of one, and a `variant` and a `size`                                                                                                                                            |
| `button-class-name.ts` | `buttonClassName({ variant, size })`: the classes of a button, for an element that looks like one, such as a link; `ButtonVariant`, `ButtonSize`                                                                                                                       |
| `TextField.tsx`        | `TextField`: a `<label>` and an `<input>` tied by an ID of `useId()`, with every attribute of an input, and `label`, `hint`, `error`, `prefix`, `optional` and `monospace`. The error, or else the hint, is the input's description, and an error sets `aria-invalid`. |
| `Notice.tsx`           | `Notice`: a `tone`, `info` by default, `success` or `error`, and optional `actions`. An error is a `role="alert"`; the others a `role="status"`.                                                                                                                       |
| `Badge.tsx`            | `Badge`: a `tone`, `positive` or `neutral`                                                                                                                                                                                                                             |
| `Panel.tsx`            | `Panel`: a `<section>` named by its `title`, with an optional `description`, and a `tone`, `default` or `danger`                                                                                                                                                       |
| `PageHeader.tsx`       | `PageHeader`: the `<h1>` of a page, an optional `description` and `actions`                                                                                                                                                                                            |
| `CopyButton.tsx`       | `CopyButton`: a `Button` that copies its `text` to the clipboard, and reads _Copied_, or _Copy failed_, for 2 seconds                                                                                                                                                  |
| `PendingBar.tsx`       | `PendingBar`: the bar at the top of the window, shown when `visible`; hidden from assistive technologies                                                                                                                                                               |
| `Wordmark.tsx`         | `Wordmark`: `/shortener`                                                                                                                                                                                                                                               |

## Helpers

- `class-names.ts`: `classNames(...names)` joins the class names that are set, skipping `undefined`, `null`, `false` and empty ones.
- `format.ts`: dates and numbers, in English: `formatCount()` groups the thousands, `formatDate()` and `formatDateTime()` write a date, and a time, in the local time zone, and `formatRelativeTime(date, now)` writes _just now_ under a minute, then minutes, hours and days ago, and the date from 30 days on.
