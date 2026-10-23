---
status: open
resolution:
labels: [bug, pages]
---

# 0006: The list of links asks for each page one after the other

Opened on 2026-10-23.

The loader of Links (`src/pages/links/LinksPage.tsx`) asks `list()` for each page of `PAGE_SIZE`, 10 links, one after the other, as many as `?pages=` says, up to 50, so that the list loaded again after an action shows as many links as before. With the shortener, each page is a request, so `?pages=8` takes eight requests, one after the other, on each load of the page, and again after each action on it, such as shortening a link.

The shortener allows each address 60 requests a minute by default, every endpoint counted together, so a person who loads a few pages of links and then shortens or changes some can get `429`, which the page shows as an error (see issue 0005). The shortener answers up to 100 short URLs at a time, so up to 10 pages fit in one request.
