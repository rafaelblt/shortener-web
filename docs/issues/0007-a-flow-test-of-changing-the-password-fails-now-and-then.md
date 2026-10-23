---
status: open
resolution:
labels: [bug, tests]
---

# 0007: A flow test of changing the password fails now and then

Opened on 2026-10-23.

`refuses a new password that is the current one`, in `tests/flows/account.test.tsx`, failed once in `npm run check`, and passed when run again, three times. It failed with the field's hint, _At least 8 characters._, as its description, instead of the message of the action.

The test finds the field with `findByLabelText("New password")`, which answers at once, since the field is there before the form is sent, and then checks its description a single time, without waiting for the action to answer. When the action takes longer, as when the machine is busy, the check runs first. The other case of the same `it.each`, and the test of a wrong current password above it, wait the same way.
