# Simulation

The app doesn't reach the back ends yet ([issue 0001](../issues/0001-the-pages-dont-consume-the-back-ends.md)): a simulation stands in for go-auth and the shortener, so that every page and flow can be seen and tried. How the code does it is in [the architecture of the simulation](../architecture/simulation.md).

## What it keeps

Everything lives in the memory of the browser tab: the accounts, who is signed in, and the links.

- **A reload starts over**, with only the [demo account](#the-demo-account), and signed out.
- **Each tab is a simulation of its own.** A short link opened in a new tab, or an address pasted in one, loads the app fresh.
- Moving between the pages of the app, the short link pages included, keeps the memory.

## The banner

Every page shows a banner above everything else, which says that nothing reaches a server, that it all resets on reload, and the username and the password of the demo account.

## The demo account

The username `demo`, with the password `demo-password`, has 12 links, more than a page of [Links](pages.md#links), chosen so that every state of the pages shows: active and deactivated, never resolved and resolved more than a thousand times, created minutes and months ago, with short and very long target URLs, and a slug that was generated. The times are counted back from when the app loaded.

## How it answers

As the back ends do, by the same [rules](pages.md#the-rules-of-the-values):

- Signing in fails the same way for an unknown username and for a wrong password.
- Creating an account doesn't sign in: the page does it right after.
- Changing the password checks the new one first, then the current one, and ends the session.
- A slug is taken whoever has it, and a generated slug is tried again when it is taken, up to 10 times.
- A link of someone else is answered as one that doesn't exist.
- The links come newest first, a page at a time.
- Following a short link counts a resolution, and sets when it was last resolved, only while the link is active.
- Each answer takes between 250 and 700 milliseconds, so that the states of a page while it waits show, as they will with real back ends.

## What it doesn't do

- Fail: the back ends are never down, slow beyond the latency, or refusing for too many requests.
- End a session by itself: a session lasts until the person signs out, changes the password, or reloads.
- Share anything between tabs, or keep anything after a reload.
