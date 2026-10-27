---
purpose: How to pin a security or coverage audit as a test that re-derives its subject from source, and how to leave tripwires when a feature is deliberately removed
status: active
last-verified: 2026-10-27
type: guide
audience: backend
tags: testing, security, audit, regression
---

# Executable Audits and Removal Tripwires

**Last Updated:** October 27, 2026

A prose audit ("every guarded route is safe") is true only on the day it is written. This guide is the
replacement pattern used in this repo: encode the audit as a test that **re-derives its subject from
source on every run**, and encode a _removal_ as tripwires that fail loudly when the removed behaviour
starts coming back.

Use it when the deliverable is proof rather than production code — a leak that is already closed but
unpinned, a contract two endpoints must share, or a feature the product model has retired.

## Part 1 — Pin an audit as an executable inventory

### 1. Find the invariant's real subject

State the invariant as a set the code can be scanned for, not as a story about behaviour. "No guest
request can read another user's spaced-repetition row" becomes: _the set of handlers reachable with
`req.userId === undefined`_ × _the set of reads that would widen without it_. If you cannot name the set,
the audit is not ready to be automated.

### 2. Write the reviewed table first, in the test file

Put the human-reviewed rows in the test file, one row per unit, each with the disposition and the exact
`file:line` evidence you relied on. Keep the table in the same file as the scanner so a reviewer sees the
claim and the check together.

### 3. Re-derive the set from source, and assert **equality**

The scanner must find the units itself (walk the module tree, match the decorator, match the parameter
shape) and then compare _both directions_:

```ts
expect(discovered).toEqual(declared); // an unlisted route AND a stale row both fail
```

A one-directional check ("every declared row exists") silently accepts a new unlisted route — which is the
hole the audit was supposed to close.

### 4. Cite a live line for every disposition

Store `file`, `line` and the snippet you expect to find there, then read the file and assert the snippet is
on that line. A moved guard must fail the test, not quietly become a lie:

```ts
const line = readLine(row.file, row.line);
expect(line).toContain(row.snippet); // e.g. "if (userId) {"
```

### 5. Allow more than two dispositions when the code genuinely has more

Forcing every row into "rejected" or "unreachable" produces falsehoods. Use a narrow third kind when the
code really is guest-reachable and safe: `guest-safe-no-user-scope:<file:line>` — the `undefined` path
skips the identity-scoped step or feeds a query with **no identity predicate**. The citation is the price
of using it.

### 6. Pair the static audit with a seeded positive control

A regression that only asserts "the guest sees nothing" passes when the seed failed, the route 404s or the
table is empty. Seed **two** identities, assert each one sees only its own rows, and only then assert the
anonymous caller gets `401` / `[]` / `0`. If the scoping breaks, the positive control fails first.

### 7. Put the inventory where its subject lives

An inventory spanning several feature modules belongs at the tier that owns the contract — for request
identity, `src/nest/guards/__tests__/`. Putting it inside one module makes that module read another
module's source, which the modulith boundary check forbids.

## Part 2 — Leave tripwires when you remove a feature

A removal is only done when the code cannot re-acquire the removed behaviour by accident. Install four
independent kinds, so deleting one does not restore it:

1. **Normative source docs** — the file a contributor edits before re-adding the behaviour (constants
   module, route table, component header, its CSS). State the rule _and_ the reason.
2. **A compile-time tripwire** — pass the deleted input under `@ts-expect-error` in a test; `tsc -b` then
   fails the moment the prop/parameter returns under any name.
3. **Runtime tests** — one per user-visible surface, asserting the _presence_ of the new behaviour (the
   page renders, the link navigates), not merely the absence of the old one.
4. **Design-layer records** — component registry rows, design-system tables, and stories. A story that
   renders the removed state is a visible regression the next reviewer will catch.

Then record the inventory of tripwires (file → the wording) in the implementation doc, so a future change
can be checked against it instead of against memory.

### When the thing you are superseding is not in the repo

Local working notes and gitignored artifacts cannot carry a banner into `main`. Mark the artifact
**SUPERSEDED** in the tracked index that lists it, restate the supersession in the tracked implementation
doc, and rely on the tripwires for the runtime guarantee. Say plainly that the on-disk banner is local; do
not let a reader believe a committed record exists when it does not.

## Verify the audit actually guards

Before calling it done, mutate the subject and watch the right test fail:

- change the shared derivation (e.g. hard-code the old value) → the **drift** case must fail while the
  same-value case still passes; if only the same-value case fails, you pinned the wrong case;
- add a handler to the scanned tier without a table row → the inventory must fail with a message that
  names the fix;
- move a cited guard line → the citation check must fail.

## Related

- [backend.md](backend.md) — backend test tiers and how to run them
- [security.md](../conventions/security.md) — the mandatory security standards these audits enforce
- [integration-gap-diagnosis.md](../../knowledge-base/practices/integration-gap-diagnosis.md) — diagnosing the gap before pinning it
- [known-failures.md](known-failures.md) — triage a red gate before treating it as your regression
