---
purpose: "Reusable per-surface human visual-QA procedure — the judgment layer of the QA pyramid. Who runs it, on which stories, against which exemplar, and where the evidence lands."
status: active
last-verified: 2026-08-18
type: guide
audience: docs-writer, reviewer, owner
---

# Visual QA Guide (Human Manual Test)

**Last Updated:** August 18, 2026
**Audience:** Docs Writer (runs + records) · Code Reviewer (fresh-eyes review) · Owner (sign-off)

> **When to read this:** at each **epic close** and the **quarterly full sweep** — before reporting any page/component as visually QA'd. Never per-commit.

## The layered QA pyramid (L1–L7)

The repo's QA is a seven-layer pyramid. Layers L1–L5 are machine gates; this guide is the **human** layer (L6) plus the sign-off layer (L7). Criterion definitions live in `docs/guides/design/design-quality-rubric.md` and the shipped gate list in `frontend-pre-delivery-checklist.instructions.md` — this guide supplies only the **procedure** and the **evidence contract**, not re-listed criteria.

| Layer                | What                                                                     | Cadence                               | Who                         |
| -------------------- | ------------------------------------------------------------------------ | ------------------------------------- | --------------------------- |
| L1 Functional        | Vitest + RTL + `test-storybook` + MSW                                    | per-change / merge                    | FE                          |
| L2 Static/token      | `design-audit` + design lint + stylelint                                 | per-change / merge                    | FE + DW                     |
| L3 A11y machine      | axe via addon-a11y `'error'` on `<Page>Full`/`Full` (WCAG 2.2 `runOnly`) | merge (gate #7)                       | FE                          |
| L4 Visual regression | Chromatic baseline (Visual Tests addon local accept/deny + CI `push`)    | every PR                              | FE run / Owner accept       |
| L5 A11y regression   | Chromatic a11y per-story baseline — no NEW violations                    | every PR                              | machine                     |
| **L6 Human manual**  | **this script** + rubric human pass + squint                             | **epic-close + quarterly**            | **DW (runs) + CR (review)** |
| L7 Owner sign-off    | recorded preview + sign-off line                                         | epic-close + canonization + quarterly | Owner                       |

**Why the human layer exists:** L1–L5 prove the rules the code claims to follow — not what is rendered. Layout drift, overflow/clipping, elevation quality, state-to-state rendering, whitespace rhythm, and contrast _appearance_ are all invisible to a passing unit test. This layer is the judgment automation can't score.

## Per-surface QA script (the template)

Copy this block per surface, fill the bracketed placeholders, run it in Storybook against the `<Page>Full` Default story, and record the result in `verification-artifacts/`.

```text
## Visual QA script — <Surface> (archetype: <archetype>)
- [ ] Open `<Page>Full` Default story → assert layout anatomy matches page-archetypes.md contract
- [ ] Spacing rhythm — section gap > item gap; no same-gap collapse (rubric #9)
- [ ] Contrast — muted text legible on `--surface-dark` and elevated surfaces (rubric #1/#6)
- [ ] Each state in states[]: Loading (skeleton = final dims), Empty (message + next step), Error,
      Disabled, Edge, Guest — rendered distinctly, no overlap (rubric #4)
- [ ] Focus — Tab order = visual order; focus-visible ring on every interactive (rubric #11)
- [ ] Overflow — no horizontal scroll at 320/768/1024; inner scroll respects the shell (rubric #15)
- [ ] Side-by-side vs the archetype exemplar story (canonization gate 8) — no structural drift (rubric #14)
- [ ] Record pass/fail + date in verification-artifacts/
```

## Cadence & who

- **Cadence:** at each **epic close** (the rubric's existing consistency-snapshot slot, gate #13) + a **quarterly full sweep** of the Pages catalog. **Never per-commit** — that is the Chromatic automated layer's job; the human script is the judgment layer.
- **Who (role-separation-by-mode, not a second person):**
  - **DW runs + records** the script — fills the template, notes pass/fail + date, saves the side-by-side exemplar screenshot.
  - **CR reviews the artifact** with fresh eyes — checklist-driven, ideally a different day/mode — and flags anything the runner normalized.
  - **Owner signs** the close — a recorded sign-off line in the artifact.
- **Evidence lands in** `verification-artifacts/<type>-<epic>-<story>.md` (per-epic) — never raw `logs/`.

## Relationship to Chromatic (the automated layer)

- **Chromatic/Playwright baseline diff = the boring 90%.** Every story snapshots against an accepted "last known good" baseline; the PR check reports _needs review_, and the accept/deny decision is the record. This catches drift continuously, per PR, for free.
- **This script = the judgment 10%.** It runs rarely (epic-close + quarterly) and scores what a diff can't: is the hierarchy right, does it look right, is it on-system, does it match the exemplar.
- **A11y is a separate layer that shares the build.** The local axe gate (`addon-a11y` `'error'` on `<Page>Full`/`Full`) is the hard machine gate for compliance; Chromatic's a11y scan adds baseline-tracked per-story regression (only _new_ violations flag a PR). Visual QA ≠ a11y: axe checks compliance, the human pass judges appearance.
- **Exemplar baselines are re-accepted after intentional change** (e.g. the Tier-0 vibrancy pass) — that is the accept flow working, not baseline drift.

## The QA reliability scorecard (per surface / per ship)

> A surface is "QA'd" only with a recorded pass in every layer. Score ≥6/7 with **no red on a11y or visual** = ship. Recorded in the per-surface artifact.

| #   | Check           | Green =                                                                                       |
| --- | --------------- | --------------------------------------------------------------------------------------------- |
| 1   | Functional      | unit + story tests green (gates #5/#7)                                                        |
| 2   | Static/token    | `design-audit` 0 errors; baseline did **not** grow (#9)                                       |
| 3   | A11y machine    | axe 0 critical/serious on `<Page>Full`/`Full`; **no new violations** vs baseline              |
| 4   | Visual baseline | captured **and accepted** (Chromatic); diff decisions recorded                                |
| 5   | Manual QA       | this script run + recorded (epic-close/quarterly)                                             |
| 6   | Canonization    | 8 gates recorded (exemplars only — `verification-artifacts/northstar-canonization-review.md`) |
| 7   | Owner sign-off  | recorded acceptance line (epic-close/canonization/quarterly)                                  |

**See also:** `design-quality-rubric.md` (criteria definitions) • `frontend-pre-delivery-checklist.instructions.md` (gate #13) • `page-archetypes.md` (exemplar stories) • `verification-artifacts/northstar-canonization-review.md` (8-gate canonization record)
