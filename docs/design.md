# Design

How the app looks, and why: its principles, its tokens, its components and its patterns. What each page shows is in [Pages](app/pages.md), and the code of the components in [the architecture of `ui`](architecture/ui.md).

## Principles

- **A ledger, not a dashboard.** Links are addresses, and the app sets them like a well-kept index: rows and hairlines, aligned columns, numbers that line up. Sections are bordered panels on the page, not cards floating over it.
- **Ink on paper.** A warm off-white paper, a near-black ink, and one accent, a vermilion, used sparingly: the slash of the wordmark and of the slugs, the focus ring, the bar of a page that loads, the word _Simulation_. The other colors carry meaning only: green for active and success, red for errors and deleting.
- **Type does the work.** IBM Plex Sans for the interface, and IBM Plex Mono for what is an address or a number: slugs, URLs, counts and IDs. Hierarchy comes from size and weight, not from boxes or colors.
- **Quiet until needed.** A secondary action shows when it's wanted, as **Copy** on the row under the pointer; a notice shows where the action happened; deleting asks in place, without a dialog.

What it avoids, the look of a generic SaaS page: gradients, glows and translucent glass, large soft shadows, pill shapes, emoji and decorative icons, illustrations, oversized hero text, purple and indigo palettes, shimmering skeletons, and toasts popping in a corner.

## Tokens

Every color, size and space is a custom property of `src/ui/styles/tokens.css`, and a component uses them, never raw values. The dark theme redefines the colors, and follows the system's preference.

### Colors

| Token                 | Light     | Dark      | For                                                       |
| --------------------- | --------- | --------- | --------------------------------------------------------- |
| `--color-paper`       | `#f6f4ef` | `#161513` | The page                                                  |
| `--color-surface`     | `#fffefb` | `#1c1b18` | Panels, fields, the header                                |
| `--color-wash`        | `#eeebe3` | `#24221f` | A row under the pointer, a notice                         |
| `--color-ink`         | `#1d1c1a` | `#ebe7de` | Text, the primary button                                  |
| `--color-ink-muted`   | `#5f5b53` | `#a7a195` | Secondary text: descriptions, target URLs, hints          |
| `--color-ink-faint`   | `#8c877d` | `#767168` | Labels of columns and numbers, placeholders               |
| `--color-rule`        | `#dcd7cc` | `#2f2d29` | Hairlines between rows and around panels                  |
| `--color-rule-strong` | `#b8b1a3` | `#4a4740` | Borders of fields and buttons, rules that close a section |
| `--color-accent`      | `#c9431c` | `#ef7546` | The accent: slashes, the pending bar                      |
| `--color-on-ink`      | `#f6f4ef` | `#161513` | Text on the ink, as in the primary button                 |
| `--color-positive`    | `#2f7a4d` | `#63bb86` | Active, success                                           |
| `--color-danger`      | `#b3261e` | `#ef7a6f` | Errors, deleting                                          |
| `--color-danger-wash` | `#f8e7e3` | `#2c1c19` | The background of an error notice                         |
| `--color-focus`       | `#c9431c` | `#ef7546` | The focus ring                                            |

### Type

`--font-sans` is IBM Plex Sans, at 400, 500 and 600, and `--font-mono` is IBM Plex Mono, at 400 and 500, both served with the app.

| Token         | Size | For                                  |
| ------------- | ---- | ------------------------------------ |
| `--text-xs`   | 12px | Labels in capitals: columns, numbers |
| `--text-sm`   | 13px | Hints, errors, secondary details     |
| `--text-base` | 15px | The text of the app                  |
| `--text-md`   | 17px | Titles of panels, numbers of a link  |
| `--text-lg`   | 22px | The short link on its page           |
| `--text-xl`   | 30px | The title of a page                  |

Headings are 600, with a tight letter spacing; labels and buttons are 500.

### Space and shape

- **Space**: `--space-1` to `--space-8`: 4, 8, 12, 16, 24, 32, 48 and 64px.
- **Shape**: `--radius` is 3px, for every corner; fields and buttons are `--control-height`, 38px, or `--control-height-small`, 28px.
- **Width**: the pages for signed-in users are at most `--content-width`, 60rem, and the forms to sign in or create an account `--narrow-width`, 22.5rem.

## Components

The components of `src/ui/`, from which the pages are built. They know nothing of users or links.

| Component    | What                                                                                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`     | **Primary**, in ink, for the one action of a form; **secondary**, outlined; **quiet**, text only; **danger**, in red, for deleting. Small or default. |
| `TextField`  | A labeled field, optionally marked _optional_, with a fixed prefix, a hint, or an error that replaces the hint.                                       |
| `Notice`     | A message about what just happened, with a colored rule on its left; success, error, or neutral; with actions.                                        |
| `Badge`      | A short state with a dot: filled when positive, hollow when neutral.                                                                                  |
| `Panel`      | A titled, bordered section, with an optional description; red-tinted for a dangerous one.                                                             |
| `PageHeader` | The title of a page, its description, and its actions.                                                                                                |
| `CopyButton` | Copies a text, and says _Copied_ on itself for a moment.                                                                                              |
| `PendingBar` | The thin accent bar at the top of the window while something loads.                                                                                   |
| `Wordmark`   | `/shortener`, in mono, with the slash in the accent.                                                                                                  |

## Patterns

- **Pages**: one title per page, at the top. A page for signed-in users sits under the header, in the content width.
- **Forms**: the label above the field, the hint below it, and the error in place of the hint, in red, with the field outlined in red. The app checks the values itself, so the browser's own bubbles never show. The button of a form names its action, and says what it's doing while it waits, as _Signing in…_.
- **Notices**: after an action, near where it happened, or at the top of the page a redirect led to.
- **Lists**: rows with hairlines between them, a header of columns on wide screens, numbers aligned right in tabular figures, and the whole row opening the item.
- **Statuses**: a badge: a filled green dot for active, a hollow one for deactivated.
- **Dangerous actions**: in a red-tinted panel, asked in place: the question, **Keep it**, and the action in red, with the focus on it.
- **Empty states**: a dashed box with one sentence of what's missing and how to fill it.
- **Waiting**: the bar at the top, only after 150ms, so that quick answers don't flicker, and the label of the button.
- **Narrow screens**: under about 36 to 40rem, the rows of a list stack, a form takes one column, the numbers of a link stack, and the header hides the username.
- **Accessibility**: every field has a label, and its error or hint is its description; errors are announced at once, other notices politely; the focus ring is the accent, 2px; the pending bar stands still when the system asks for reduced motion.
