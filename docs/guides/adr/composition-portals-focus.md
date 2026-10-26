---
purpose: "ADR-013 — composition and portals/focus: extract a shared useFocusTrap hook instead of adopting Radix at epic 31, and the rule for when a portal is allowed"
status: ratified
last-verified: 2026-10-26
type: decision
audience: all
relates-to: "ADR-002 (Fixed-Height Data Shells) · ADR-005 (Token Freeze) · ADR-007 (North-Star Visual Identity) · design-reasoning.md §0 External Borrowing Protocol · page-archetypes.md §0 · design-revalidation-guide.md"
evidence: "apps/frontend/package.json (dependencies) · apps/frontend/src grep for createPortal / role=dialog / focus (2026-10-26) · WAI-ARIA APG Dialog (Modal) Pattern · design-reasoning.md §0 curated borrow shortlist (Radix row)"
---

# ADR-013 — Composition & Portals/Focus: the shared `useFocusTrap` hook

**Status:** ratified (Flow-2 S3 deferred-fundamentals pass, 2026-10-26 — the pass was mandated to settle
this item before the conversation panel is specced; owner acknowledgement is recorded at the epic-31
design-spec preview)
**Supersedes:** nothing. **Settles:** `uiux-fundamentals.md` fundamental **#11**, previously "deferred to
epic 31".

## Context

Fundamental **#11 composition & portals/focus** was the last unbuilt prerequisite in the design set. The
conversation panel (epic 31) is the first surface that is both **compositional** (a scrollable turn list
+ an anchored composer + transient overlays) and a **Focus** surface, so the item had to be settled
before that panel is specced. Two candidates were on the table: extract a shared `useFocusTrap` hook, or
adopt Radix at epic 31.

The repository state, measured rather than assumed (2026-10-26):

| Probe                                                    | Result                                                                                                                            |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| UI primitive dependencies in `apps/frontend/package.json` | **none** — 9 runtime deps, all framework/data (`react`, `react-dom`, `react-router-dom`, `zustand`, `axios`, `hanzi-writer`, `lucide-react`, two workspace packages) |
| `createPortal` in `apps/frontend/src`                     | **0 occurrences** — every overlay renders in place                                                                                |
| Hand-rolled overlays already shipped                      | `Modal` (backdrop + Escape + scroll lock + `role="dialog"`/`aria-modal`), `Dropdown` (listbox, click-outside, Escape), `UserMenu` (popover at `--z-popover`), `WordPopover` (edge-aware position, Escape, focus-in **and** focus-return) |
| Missing behavior                                         | a **Tab/Shift+Tab cycle**. `WordPopover` moves focus in and returns it; no surface traps it. `Modal` neither moves nor traps focus. |

So the repo has already chosen hand-rolled composition four times, and the only *missing* piece is one
reusable behavior. The question is not "do we need focus management" — it is "do we buy a component
library to get 30 lines of it".

## Decision

**Extract the shared hook. Do not adopt Radix.**

### 1. One shared behavior: `shared/hooks/useFocusTrap.ts`

The hook owns the four behaviors the APG *Dialog (Modal) Pattern* specifies, transcribed as behavior
only (no source code borrowed):

1. **Focus in** on activate — to the container, or to the first tabbable descendant.
2. **Tab / Shift+Tab cycle** — never leaves the container; wraps at both ends.
3. **Escape** — closes, via the caller's `onClose`.
4. **Focus return** on deactivate/unmount — to the element that invoked the overlay, unless it no longer
   exists (then the caller's fallback target).

It is a **behavior, not a component**, so it takes **no `component-registry.json` entry** — the registry
catalogs presentational components, and `check:page-inventory` composition maps may only name those.

### 2. Composition rule — sub-parts, never parent-injected styles

Unchanged from `frontend-component-architecture.instructions.md` (lands epic 31 as composition of
**existing registry components only**: the turn list, the composer, the quota notice). No new styling
seam, no second composition model beside the registry's.

### 3. Portals: allowed only for a transient overlay that must escape an ancestor

**Session surfaces are routes, not modals** (`design-revalidation-guide.md` §4), so the conversation
panel needs no portal: it is a `detail` route, and its scrolling is the ADR-002 fixed shell's inner
scroll. A portal is permitted only when all three hold:

1. the overlay is **transient** (menu, popover, confirm, picker) — never a session;
2. it must escape an ancestor's `overflow`, `transform`, or stacking context, so in-place rendering is
   clipped or mis-layered;
3. it renders into the existing `--z-*` ladder (`--z-popover` 100 / `--z-modal` 200 / `--z-toast` 300)
   and keeps the focus contract above.

A portal is **never** a fix for a stacking bug: the ladder + stacking-context discipline is
(`DESIGN.md` § Z-Index Ladder, `z-index-raw` is a machine error).

## Why not Radix

1. **It is a code borrow, and the borrow protocol rejects it.** `design-reasoning.md` §0's shortlist row
   for Radix reads: *mine* = "a11y behavioral specs — focus management, keyboard nav, ARIA patterns";
   *reject* = "its code (unless vendored via ADR)". Adopting the package is the rejected half of a row
   the repo already wrote. This ADR extracts the *principle* and keeps the rejection.
2. **It adds a second composition model.** Radix ships its own DOM shape, its own props, and its own
   styling seams for six or more primitives (`react-dialog`, `react-focus-scope`, `react-dropdown-menu`,
   `react-tabs`, `react-slot`, …). The repo's composition law is that a page composes **registry**
   components, with no parent-injected styles; a parallel primitive tree would need its own registry
   entries, stories, states, and a11y stories per primitive — more surface than the panel itself.
3. **No new gate comes with it.** The a11y floor is the axe sweep plus a hand-checked contract
   (`a11y-floor.instructions.md`); Radix does not enforce anything the hook does not, and axe does not
   credit "used a library".
4. **The gap is smaller than the remedy.** One missing behavior (the Tab cycle) over four existing
   overlays. A hook closes it in one file, with no dependency, version, or peer-range to maintain
   against React 19.

## Consequences

1. **Zero new dependencies.** The `apps/frontend` dependency list is unchanged; no vendored code, no
   license surface.
2. **The hook lands ahead of its first consumer.** It is covered by its own unit test (focus-in, cycle in
   both directions, Escape, focus return, and the no-tabbable-descendant edge). Epic 31 is its first
   consumer, and the retrofit list is: `Modal` (gains trap + focus-in + focus-return, **no restyle**),
   then the conversation panel.
3. **`WordPopover` keeps its hand-written focus-in/return for now** — it is a non-modal popover whose
   contract is "one reveal, then back to the word"; converting it is not required by this decision and
   would change a shipped reading surface. It is recorded as optional follow-up, not debt.
4. **The panel is specced as composition, not as a component library.** Its spec (`archetype: detail`,
   Focus mode) may name only registry components; its overlay behavior names the hook.
5. **Re-open condition (stated, so "revisit later" cannot be vague).** Re-open this ADR if a surface
   needs a behavior the hook cannot supply — a combobox/listbox with typeahead, nested menu/submenu or
   menubar semantics, roving-tabindex grids, or a date picker with a calendar grid. Then the ADR names
   that surface, and a dependency is ratified for it explicitly.

## Provenance (External Borrowing Protocol — patterns only, never code)

```
provenance:
  - source: W3C WAI-ARIA APG — Dialog (Modal) Pattern (keyboard interaction + initial-focus notes)
    borrowed: the four behaviors above, as behavior only
    why: a focus contract that is written down once by the standards body beats four hand-rolled
         variations; the APG's initial-focus note (tabindex="-1" on a static content start when the
         content is semantically structured) is exactly the conversation panel's case
    rejected: nothing — no code, no markup, no naming is copied
  - source: Radix Primitives (documentation only)
    borrowed: the behavioral-spec framing — which behaviors an overlay must own, and that they are
              separable from the visual layer
    why: design-reasoning.md §0 already names this as the borrowable half of Radix
    rejected: the package itself (its code), per the same shortlist row and this ADR
```

## Verification of this decision

- `apps/frontend/package.json` — dependency list unchanged by this change (measured, not assumed).
- `grep -r "createPortal" apps/frontend/src` → 0 matches (still true after this change).
- The hook's unit test is the behavioral evidence; run
  `npx vitest run --project='!storybook' src/shared/hooks` in `apps/frontend`.

## Open items

1. Epic 31 retrofit: `Modal` adopts `useFocusTrap` (behavior only). Not done in this pass — this pass is
   decisions + spec + the shared hook.
2. `WordPopover` conversion — optional, unscheduled; decide at the readers' next pass.
