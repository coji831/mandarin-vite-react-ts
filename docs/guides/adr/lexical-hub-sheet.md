---
purpose: "ADR-014 — the lexical hub is a navigator, not a session: it becomes a standalone cross-page peek sheet in the popover layer (no route, one history entry per open), and --size-hub-sheet lands through ADR-005's token route."
status: ratified
date: 2026-10-29
relates-to: "ADR-005 (Token Freeze) · ADR-011 (Night Bench) · ADR-013 (composition, portals, focus) · design-revalidation-guide §4 (session vs navigator)"
last-verified: 2026-10-29
type: adr
audience: agents
---

# ADR-014 — The lexical hub is a navigator (cross-page peek sheet)

**Status:** ratified (records a decision implemented in the same change; no new visual direction)
**Date:** 2026-10-29

## Context

The lexical hub (character / word / radical / chengyu / grammar detail) had been rebuilt twice:
first as an app-wide modal overlay, then — under `design-revalidation-guide.md` §4 "session = route,
not modal" — as a routed `detail`/Focus page at `/learn/hub/:entityType/:entityId`.

The routed form failed its own business intent, measurably:

1. **It destroyed the surface being read.** `openHub()` has 26 call sites and they are not all Browse
   surfaces: a review card's glyph, a reader token, a quiz answer reveal. Tapping the glyph navigated
   away and discarded the typed answer / reading position / audio.
2. **It flipped mode for a non-event.** `/learn/hub` was declared `detail` in `pageChrome.ts`, so the
   rail collapsed and the top bar recessed the moment a learner looked a word up. Looking something up
   is not a change of intent.
3. **History became a transcript of peeks.** The bridge pushed one entry _per hop_ and the page then
   needed `navigate(-hopCount)` arithmetic to unwind them. From a list of eight words, Back was a
   nine-press walk through your own peeks.

## Decision

1. **Classify before choosing a mode.** A surface is a **session** if it has (a) a bounded start and
   end, (b) a completion action and (c) progress state; a surface with none of the three is a
   **navigator**, and a navigator may be a transient overlay. The hub has no task, no completion and
   no progress — it is a navigator.
2. **The hub is a standalone cross-page peek sheet.** `HubSheet` mounts once at the app shell and
   portals to `document.body`, so it floats above the top bar and over the rail, and the origin
   surface is never unmounted (scroll, audio position and typed state survive for free). It changes
   no chrome and presents **zero primary CTAs**.
3. **Non-modal above 767px; modal at or below.** Above: `role="dialog"` + `aria-labelledby`, no
   `aria-modal`, no scrim, no `inert`, no trap — the origin stays live. At or below: `aria-modal`,
   scrim, app root `inert`, and the shared `useFocusTrap` hook (ADR-013).
4. **ONE browser-history entry per OPEN, never per hop.** On open: `pushState` with state only, so the
   URL never changes (a peek is an act of reading, not a location). Hops live in the hub store's own
   stack. `popstate`, Esc and ✕ share the same close; close restores the origin's scroll offset and
   focus.
5. **`--size-hub-sheet: 420px` lands through ADR-005.** A 420px sheet has no existing token and an
   inline `min(28rem, 100vw)` fails `inline-style-magic-value`. The name is a **PinyinPal domain
   token**, not a spine generic (spine owns no sheet): it is declared in `DESIGN.md`
   `tokens.size.hub-sheet` **and** `globals.css` `:root` in this change, added to the covered `size`
   family of gate #14 (`check:design-parity`) and to the product-domain set of gate #15
   (`tools/spine-token-names.json`).

## Consequences

- **Deleted:** `pages/learn/hub/*` (the routed page, its `Full` story and its test),
  `shared/hub-entry/HubRouteBridge.tsx` + test, `shared/hub-entry/hubPath.ts` + test, the
  `/learn/hub` route registration, the `/learn/hub` row in `pageChrome.ts`, and the
  `learn_lexical_hub` / `lexical_entity_route` path constants. The epic-25 token / spent-token
  machinery and the "departure rewritten back to the hub" bug class go with them.
- **The peek is deliberately not addressable.** Share links and cold starts have no hub page to land
  on; if addressability is wanted later it returns as a separate explicit page, not as the default.
- **`design-audit:foundation`'s `session-route` check is re-keyed** to the classifier: it fails a
  registered or `pageChrome`-declared `/learn/hub` route, fails a shell that mounts the dispatcher
  directly, and fails a sheet that does not render the dispatcher.
- **The hub body is unchanged.** `LexicalHubRouter` and the per-entity bodies still self-fetch; the
  sheet is only the shell. The `layout: "stack" | "cardinal"` variant proposed for the narrow sheet is
  **not** part of this change (tracked as follow-up; the cardinal bodies render inside the scrolling
  sheet today).

## References

- `docs/guides/design/design-revalidation-guide.md` §4 (the classifier)
- `docs/guides/design/page-archetypes.md` §0 (mode/page table — the hub row is now Browse + peek)
- `features/lexical-hub/components/HubSheet/HubSheet.tsx`
- `shared/store/hubStore.ts` · `shared/hub-entry/hubEntryPoint.ts`
