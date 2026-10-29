---
purpose: "Per-epic design revalidation guide — each UI epic revalidates the surfaces in its scope against the ratified contract, and reworks from scratch when revalidation fails."
status: active
date: 2026-10-26
last-verified: 2026-10-29
type: guide
audience: agents
---

# Design Revalidation Guide — per epic

**Last Updated:** 2026-10-29
**Audience:** AI Coding Agents + Code Reviewer
**Purpose:** The rule each UI-carrying epic follows at design-spec time: revalidate the quality of the
surfaces in its scope against the ratified design contract, and **rework from scratch** when revalidation
fails — instead of patching legacy layouts. This is the epic-distributed counterpart to the 2026 audit
(`docs/planning/epics-25-40.md` §2026 Audit Amendments).

## The one rule

> **Each UI epic revalidates its surfaces first. If a surface fails the contract below, it is rebuilt
> greenfield from its business brief — never patched in place from its legacy code.**

The audit established that the current presentation layer never delivered the two-mode contract: pages
ship one-mode with a modal, so the Focus-First brief is violated on ~7 of 17 surfaces. Those violations
are each owned by an epic; the epic fixes them by rework, not by bolting chrome onto the legacy layout.

## What revalidation checks (the contract)

A surface in an epic's scope passes revalidation only if ALL of the following hold against
`page-archetypes.md` + `design-reasoning.md` + `uiux-fundamentals.md`:

1. **Correct archetype** — the page declares the archetype its brief implies (the 13-archetype set and
   the mode/page table in `page-archetypes.md` §0). No page may claim an archetype just to inherit a
   convenient width.
2. **Correct mode** — Browse (choosing) vs Focus (inside a session), derived from the archetype. A
   session surface that renders as a Browse surface fails.
3. **Correct chrome** — Focus = rail collapsed + recessed top bar + one task + exactly one
   position-locked primary CTA. Browse = rail expanded + standard top bar. (Delivered by the
   mode-aware chrome shell; see "shared shell" below.)
4. **No third mode** — **classify the surface first: session or navigator.** A surface with (a) a
   bounded start and end, (b) a completion action and (c) progress state is a **session**, and every
   session (reader, quiz, review, exam, speaking drill, conversation) is a routed `detail`/Focus
   surface. A surface with none of the three is a **navigator**, and a navigator may be a transient
   overlay. Modals remain reserved for transient actions (confirm, quota-exhausted prompt, a quick
   reveal that is not itself a session). A modal hosting a session is a revalidation failure.
   **Enforced, not merely stated:** `design-audit:foundation` runs a `session-modal` check (a
   `<Modal>` wrapping a session surface — an entity hub from `entityHubRegistry.tsx`, the hub
   dispatcher, or any `*Hub` / `*DetailContent` / `*Session` body) and a `session-route` check, which
   now keys off the classifier rather than "any `*Hub`": the app shell mounts the hub **peek**
   (`HubSheet`, portalled to `<body>`, so it is not page content), the sheet renders the dispatcher,
   and **no** `/learn/hub` route may be registered or declared in `pageChrome.ts` — a lookup is not a
   location. Reference implementation: `features/lexical-hub/components/HubSheet/HubSheet.tsx`
   (ADR-014) — the lexical hub is a navigator worth a cross-page peek, not a 620px page.
5. **One task, one CTA** — the surface does not spread one task across sibling tabs/pages or stack
   multiple primary actions (cognitive-load fundamental #6; immutable rule #4).
6. **Anatomy law** — `PageShell(measure) → PageStack(rhythm) → PageGrid(gutter)`; no page-scoped
   layout CSS. (Already gated green; revalidation must not regress it.)
7. **Fundamentals & a11y** — contrast (token-pair), weight-over-size typography, 8pt spacing, borders
   before shadows, focus-visible, touch ≥28px, 320px reflow, ≤ one saturated fill per viewport.

## The shared shell (baseline every epic consumes)

The mode-aware chrome shell (rail collapse + recessed top bar, PR #56) is the **baseline**, not an
optional add-on. An epic that touches a Focus surface consumes that shell; it does not re-derive rail
state per page. The pre-26 spine epic (`epics-25-40.md` §2026 Audit Amendments A0) owns the shell and
finishes it before surfaces are rebuilt on top.

## Rework-from-scratch boundary (what may and may not be rebuilt)

**May be rebuilt (the presentation layer):** page layout, chrome, modals, the shell, and any surface
whose revalidation failed — rebuilt greenfield from the PO business breakdown + this guide.

**May NOT be rebuilt (kept):**

- **Spine generic foundation** — tokens, `--page-measure-*`, PageShell width, gates (the correct half;
  it just landed).
- **The ratified ADR stack** (001–011) and **BM-1/BM-2** — these are decisions; they are the spec the
  rework implements, not candidates for rework.
- **`content/` data** — the curriculum artifact is unaffected by UI rework.
- **Behavior already gated green** — anatomy, a11y, tests; rework must not regress them.

## Ordering inside an epic

1. **PO business breakdown** — the moment (Browse/Focus), the one task, the one CTA, the value, the
   metric it moves. (Not the legacy page.)
2. **Designer spec from the breakdown** — `per-epic-design-spec.md`, reading the brief, not the old code.
3. **Revalidation verdict** on the existing surface: passes → evolve in place; fails → rebuild.
4. **Implement** to the spec on the shared shell.
5. **Gate** — `design-audit:foundation` + `check:page-inventory` + axe/a11y + story/tests + the
   22-criteria rubric pass at epic close (`design-quality-rubric.md`). Code detection verifies here,
   at the end, never as the designer.

## The batch rule

Specs are batched by pattern family (shell/error; guest lane + cards; assistant/chat; timed/media) per
`per-epic-design-spec.md` — so shared components surface before code exists and no two epics rework the
same surface twice.
