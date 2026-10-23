# Pages

What each page shows and does, and the texts a person reads on it. How the code does it is in [the architecture of the pages](../architecture/pages.md), and how the pages look, in [Design](../design.md). The app runs on go-auth and the shortener, through its server, or, in development and in its tests, on the [simulation](simulation.md), which stands in for them.

## Overview

| Path          | Page                                    | For                     |
| ------------- | --------------------------------------- | ----------------------- |
| `/sign-in`    | [Sign in](#sign-in)                     | Whoever isn't signed in |
| `/register`   | [Create an account](#create-an-account) | Whoever isn't signed in |
| `/`           | [Links](#links)                         | Signed-in users         |
| `/links/:id`  | [A link](#a-link)                       | Signed-in users         |
| `/account`    | [Account](#account)                     | Signed-in users         |
| `/s/:slug`    | [A short link](#a-short-link)           | Anyone                  |
| anything else | [Not found](#not-found)                 | Anyone                  |

- A page for signed-in users, opened by whoever isn't signed in, sends to Sign in, which brings them back to it afterwards.
- Sign in and Create an account, opened by whoever is signed in, send to Links.
- The pages for signed-in users share a header: the wordmark, which leads to Links, the navigation, with Links and Account, the username, and **Sign out**.
- A thin bar runs along the top of the window while a page loads or a form is sent, if it takes more than a moment.
- In the simulation, every page shows its [banner](simulation.md#the-banner) above everything else.

### The rules of the values

The forms point out a value that breaks a rule before anything is sent, under its field, and the back ends check the same rules again.

| Value      | Rule                                                                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Username   | 3 to 32 characters: letters, digits, dots, dashes and underscores. Uppercase letters are read as lowercase, so `Alice` and `alice` are the same user.      |
| Password   | At least 8 characters, and at most 72 bytes, in which an accented letter or an emoji takes more than one. Any character, spaces included.                  |
| Slug       | 3 to 30 characters: ASCII letters, digits, dashes and underscores. Uppercase and lowercase are different: `abc` and `ABC` are two slugs.                   |
| Target URL | A full `https://` address with a host, such as `https://example.com/page`, with no spaces and no invisible characters. Letters of any script are accepted. |

The spaces around a target URL or a slug are removed before they are checked.

### The messages of the fields

| Field                  | When                         | Message                                                              |
| ---------------------- | ---------------------------- | -------------------------------------------------------------------- |
| Username               | Empty                        | Enter a username.                                                    |
|                        | Too short, too long          | Use at least 3 characters. / Use at most 32 characters.              |
|                        | A character outside the rule | Use only letters, digits, dots, dashes and underscores.              |
|                        | Taken                        | That username is taken.                                              |
| Password, New password | Empty                        | Enter a password. / Enter a new password.                            |
|                        | Too short                    | Use at least 8 characters.                                           |
|                        | Too long                     | Use at most 72 bytes; accented letters and emoji take more than one. |
| New password           | The same as the current one  | Choose a password other than the current one.                        |
| Current password       | Empty                        | Enter your current password.                                         |
|                        | Wrong                        | That isn't your current password.                                    |
| Target URL             | Empty                        | Enter the address to shorten.                                        |
|                        | Not a full https address     | Enter a full https:// address, such as https://example.com/page.     |
| Slug                   | Too short, too long          | Use at least 3 characters. / Use at most 30 characters.              |
|                        | A character outside the rule | Use only letters, digits, dashes and underscores.                    |
|                        | Taken                        | That slug is taken.                                                  |

A value that the app accepts and a back end refuses gets the message of the rule the back end names.

### Notices

Some pages greet the person with a notice after another page sent them there:

| After                 | On      | Notice                                                                        |
| --------------------- | ------- | ----------------------------------------------------------------------------- |
| Creating an account   | Links   | Your account is ready. Welcome.                                               |
| Deleting a link       | Links   | The link was deleted, and its slug is free again.                             |
| Signing out           | Sign in | You're signed out.                                                            |
| Changing the password | Sign in | Your password was changed, and every session ended. Sign in with the new one. |

## Sign in

A username and a password, and **Sign in**, which says _Signing in…_ while it waits. Below, a link to [Create an account](#create-an-account).

- An empty field gets its message, and nothing is sent.
- Wrong credentials, whatever is wrong, get one error above the form: _The username or the password is wrong._ It doesn't tell an unknown username from a wrong password, and the username stays typed.
- Once signed in, the person goes back to the page that sent them there, or to [Links](#links). Only a path of the app is followed, never another site.

## Create an account

A username and a password, each with a hint of its rule, and **Create account**. Below, a link to [Sign in](#sign-in).

- Creating the account also signs in, and leads to [Links](#links), with a welcome.
- A taken username, and any value that breaks a rule, get the message of the field.

## Links

The links of the person, newest first, under a form to shorten one.

**Shorten a link** has the target URL and an optional slug, shown after the start of the short links, and **Shorten**.

- Without a slug, the back end generates one: 6 random letters and digits.
- Once created, a notice says _Shortened to_ the new short link, with **Copy**, the link shows first in the list, highlighted, and the form empties for the next one.
- A value that breaks a rule, and a slug that is taken, get the message of the field, and what was typed stays.

**The list** shows, for each link: its slug, which leads to [its page](#a-link), its target URL without `https://`, shortened with an ellipsis when it doesn't fit, how many times it was resolved, its status, and when it was created, as _4 minutes ago_ for the last month and as a date before it. **Copy** shows on the row under the pointer, and always on touch screens.

- 10 links at a time: **Load more** adds the next 10, while there are more. The address keeps how many are shown, as `?pages=2`, so a reload or a link shows the same.
- With no links, the list says _No links yet._ and that the ones shortened above show up there.

## A link

A link of the person, under **← Links**.

- **The header**: the whole short link, the target URL, which opens in a new tab, the status, **Copy**, and **Open**, which follows the short link, as a visitor would (see [A short link](#a-short-link)).
- **The numbers**: how many times it was resolved, when it was last resolved, or _Never_, and the day it was created. Hovering over a time shows it in full.
- **Edit**: the target URL and the slug, and **Save changes**, which is enabled once a value differs from the saved one. Only the values that changed are sent. Once saved, it says _Saved._ The panel warns that changing the slug frees the old one for anyone to take.
- **Status**: what the status means, and **Deactivate** or **Activate**. An active link leads to its target and counts each resolution; a deactivated one says it's turned off and counts nothing, and its slug stays the person's.
- **Delete**: **Delete link** asks, in place, whether to delete the link for good, since its slug becomes free for anyone: **Delete for good** deletes it and leads to [Links](#links), and **Keep it** takes the question back.

A link that doesn't exist, or that belongs to someone else, gets _This link doesn't exist._, which doesn't tell the two apart.

## Account

- **The user**: the username and the user ID.
- **Change password**: the current password and a new one. Changing it ends every session of the user, this one included, so it leads to [Sign in](#sign-in), with a notice.
- **Sign out**: ends the session in this browser.

## A short link

Short links are addresses of the app itself, `/s/` and the slug, until they get a domain of their own (see [issue 0004](../issues/0004-what-a-visitor-sees-on-the-domain-of-short-links-is-undecided.md)). Following an active one counts a visit, and leads straight to its target URL. For a link that leads nowhere, the page says why, without the header of the app:

- **A deactivated link**: _This link is turned off._, and that its owner deactivated it.
- **An unknown slug**: _There's no link here._, and that slugs tell uppercase from lowercase.

In the simulation, which leaving the app would lose, an active link doesn't lead straight to its target either: the page shows the short link, the target URL it leads to, and **Continue**, which opens it, and says that the real short link redirects straight away, and that the visit was counted.

## Not found

An address that is no page of the app gets _There's no page at this address._, with a link to [Links](#links).

## Errors

When something fails, a back end included, such as when one can't be reached or refuses too many requests, the page gets _Something went wrong._ and **Try again**, which loads the page again. When the session ended meanwhile, the person is sent to [Sign in](#sign-in) instead, which brings them back afterwards.
