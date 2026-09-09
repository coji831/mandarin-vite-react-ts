---
purpose: Define "good" operationally — criteria × measurement × threshold — the scored quality bar for designs
status: active
last-verified: 2026-08-18
type: design
audience: agents
---

# PinyinPal Design-Quality Rubric

**Last Updated:** 2026-08-18
**Audience:** AI Coding Agents + Code Reviewer
**Purpose:** Define "good" operationally — criteria × measurement × threshold — so a design is _scored_, not vibed. This is the **human-pass companion** to the machine gates. The pre-delivery checklist stays the shipped gate artifact; this rubric is the definitions + scoring companion it points to.

> **How to use this file:** run the rubric per page/component (self-audit → Storybook visual check → gates → owner preview → sign-off). Run the **human rubric pass at each epic close** as a per-epic consistency snapshot against the archetype's Golden Template — never per-commit.

---

## What "Good" Means

**"Good" = two gates, both green:**

1. **All machine criteria green** — tokens, archetype conformance, states, story tests, a11y, slop-scan, token freeze.
2. **The rubric passes** — warm-minimalism QA + hierarchy + focus-visible + microcopy + one-CLA + no-slop + Golden-Template parity.

**"Consistent" = machine (same archetype ⇒ same anatomy, by construction) + human (Golden-Template side-by-side, Storybook Pages catalog).**

**"Industry-standard" = honestly decomposed** into WCAG 2.2 AA (the only hard external standard, measurable) + consumer-app conventions + no layout shift — **explicitly NOT enterprise density or copied looks.**

### The industry-standard decomposition

- **WCAG 2.2 AA** — measured via **addon-a11y** (axe, already installed) + the repo's own tokens: `--size-touch: 28px` (> 24×24 min, SC 2.5.8), focus-visible (2.4.7 / 2.4.11 Focus Not Obscured), and the per-archetype a11y checklists (4.1.3 live regions for chat, 1.4.1 non-color for media, 2.2.1 for timed).
- **Consumer-app conventions** — readable type ladder, visible focus, low cognitive load, ≤ one primary CTA per view, 28px touch targets, 320px reflow (all already encoded in `design-reasoning.md` + the pre-delivery checklist).
- **Performance** — no layout shift (CLS): skeleton dims = final dims, fixed shell + inner scroll (data-resilient shell rule), measured via browser pass.
- **What it is NOT** — enterprise density, a generic SaaS look, or copying any specific app's look (Duolingo's candy, Linear's dense chrome, Material's elevation-heavy surfaces). Warm-minimalism defines _what good looks like_; this checklist proves _the mechanics_.

---

## Per-Page Rubric (22 criteria)

| #   | Criterion                                                               | Measure (machine or human)                                                                                                             | Threshold                                       |
| --- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 1   | Token compliance                                                        | `npm run design-audit` (gate #9)                                                                                                       | 0 errors                                        |
| 2   | Token freeze (no new tokens outside ADR)                                | `design lint` (#8) + `design-audit` (#9)                                                                                               | green                                           |
| 3   | Archetype conformance                                                   | `check:page-inventory` (gate #7)                                                                                                       | valid archetype + registry-only composition map |
| 4   | States coverage                                                         | page-inventory `states[]`; each → a story                                                                                              | non-empty; states map to stories                |
| 5   | Story tests                                                             | `test-storybook` (gate #7)                                                                                                             | pass                                            |
| 6   | a11y scan                                                               | addon-a11y on the page story                                                                                                           | 0 critical/serious (WCAG 2.2 AA)                |
| 7   | Slop-scan                                                               | `design-audit` slop rules (gate #9)                                                                                                    | 0 hits                                          |
| 8   | Warm-minimalism QA                                                      | human rubric — matches `design-reasoning.md` §1 (flat, amber-on-dark, content-first)                                                   | pass                                            |
| 9   | Hierarchy & spacing rhythm                                              | human rubric — §5.3 (section gap > item gap; no same-gap collapse) + advisory heuristics                                               | pass                                            |
| 10  | One primary CTA, positioned per archetype slot                          | human rubric — count + position                                                                                                        | ≤1 primary, correct slot                        |
| 11  | Focus-visible on every interactive element                              | human spot-check (+ a11y addon)                                                                                                        | pass                                            |
| 12  | Microcopy                                                               | human rubric — action verbs, empty states give a next step, no placeholder slop                                                        | pass                                            |
| 13  | No-slop forbiddance list                                                | machine (#7) + human eyeball                                                                                                           | pass                                            |
| 14  | Golden-Template parity                                                  | human — side-by-side with the archetype exemplar story                                                                                 | no structural drift                             |
| 15  | Responsive                                                              | human — 320/768/1024 + mobile spot-check                                                                                               | pass, no horizontal scroll, no CLS              |
| 16  | Thin container — page JSX ≤ ~100 lines, delegates to feature components | human (page size) + `large-component` advisory                                                                                         | pass                                            |
| 17  | Cognitive load — progressive disclosure                                 | human rubric — advanced options behind a reveal, not stacked on the shell                                                              | pass                                            |
| 18  | Hierarchy — squint test                                                 | human — blur/zoom-out: top 3 visible elements = intended hierarchy; ≤2–3 competing elevated surfaces per viewport                      | pass                                            |
| 19  | Hub-launcher size guard                                                 | human — quick-access grid capped ~8–9 launch targets per group (Hick's law; hub-launcher archetype only)                               | pass                                            |
| 20  | Job clarity — ONE primary action + ONE primary content                  | human scorecard — name the screen's single job + who it's for (squint test)                                                            | scorecard ≥4                                    |
| 21  | Business fit — hierarchy serves the goal, friction off the job          | human scorecard — §14.5 goal → signal → lever                                                                                          | pass                                            |
| 22  | Distinctiveness — not the generic default for this page type            | human scorecard — uniqueness question: "does this read as the generic default you'd produce for any similar page?" + what you'd change | pass                                            |

## Per-Component Rubric (8 criteria)

| #   | Criterion                                                                 | Measure                                                                  | Threshold                           |
| --- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------- |
| 1   | Registry entry + storyFile + states                                       | `check:registry-stories` (gate #7)                                       | pass                                |
| 2   | States cover declared set (loading/empty/error/disabled where applicable) | story inspection + registry `states[]`                                   | pass                                |
| 3   | Token compliance                                                          | `design-audit`                                                           | 0 errors                            |
| 4   | a11y + keyboard behavior (focus order, trap for Modal/Dropdown)           | addon-a11y + manual keyboard pass                                        | 0 serious; trap/focus-order correct |
| 5   | Tests                                                                     | per `testing-standards.instructions.md` (Testing-Trophy, not coverage %) | test present + passing              |
| 6   | Human: looks on-system, no invented decoration                            | rubric — matches exemplar + tokens                                       | pass                                |
| 7   | Decomposition — state colocation + logic separation + named `XxxProps`    | human CR against `frontend-component-architecture.instructions.md`       | pass                                |
| 8   | Styling — utility-first + local CSS; no inline magic values               | `design-audit` (`inline-style-magic-value`, `inline-style-static`)       | 0 errors                            |

---

## Cross-Page Consistency Measurement

- **Machine:** `check:page-inventory` — same archetype ⇒ same anatomy _by construction_ (there is no anatomy to invent); `design-audit` spacing/typography-role heuristics (advisory → hard).
- **Human:** Golden-Template side-by-side per archetype; Storybook **"Pages" sidebar grouped by archetype** as the catalog.
- **Cadence:** a **consistency snapshot at each epic close** — compare the epic's pages to their archetype's exemplar story and note any drift in the epic's verification artifact. This slots into gate #13 (pre-delivery + truth-check) without a new gate.

---

## Fillable Scorecard (owner gate — blueprint §14.4/14.5)

The human rubric **made fillable**: the non-designer owner's review is a scored checklist, not a
feeling (2026 research: structured scorecard beats freeform "looks good?"; judge side-by-side
when unsure). Run it per page at the Step-1 preview gate (`uiux-design-protocol.instructions.md`
§1.6) and at the L6/L7 owner sign-off. Companion lens + learning pack: `ai-generated-ui.md` §14.

**Rate 1–5** (5 = exemplar-level · 3 = acceptable but generic · 1 = fails the check):

| #   | Dimension         | 1–5 | What to look for (quick)                                                         |
| --- | ----------------- | --- | -------------------------------------------------------------------------------- |
| 1   | Job clarity       |     | ONE primary action + ONE primary content; for whom?                              |
| 2   | Alignment         |     | shared grid; nothing floating; edges/labels/baselines align                      |
| 3   | Spacing & rhythm  |     | 8/12/16/24/32/40 scale; section gap > item gap; proximity = grouping             |
| 4   | Hierarchy         |     | squint test: top-3 visible = top-3 important; ≤3–4 heading levels, no skips      |
| 5   | Proportion        |     | sane measure; balanced columns; gutters match the archetype                      |
| 6   | Typography        |     | ≤4–5 sizes; weight contrast; no tracking on hanzi; not Inter-by-default          |
| 7   | States/resilience |     | loading/empty/error/edge; no 320px overflow; data volume stable                  |
| 8   | Language          |     | user's words; action verbs; empty states give a next step; errors say what + how |
| 9   | A11y quick pass   |     | real controls + labels; focus visible; touch ≥28px                               |
| 10  | Business fit      |     | hierarchy serves the goal; friction off the job (§14.5)                          |
| 11  | Distinctiveness   |     | fluent-but-generic? named tells? a point of view?                                |

**Uniqueness question (ask out loud):** "Does this read as the generic default you'd produce for
any similar page?" If yes → name what you'd change + why.

**Business translate (§14.5 — design choice → lever):** grasp value in 5s → activation; main path
frictionless → conversion; returner trust (consistency/visible state) → retention/habit; error
prevention + recovery → support cost/trust; looked-after feel (alignment/rhythm/states) →
perceived quality → willingness to pay; user's language → comprehension. Translate to a
stakeholder: state the job → point at the ONE action → show how hierarchy/spacing serve it →
name risks checked (states, a11y, overflow) → decide.

**Verdict rule (one line, never "looks good?"):** `PASS` / `REVISE` / `BLOCK` + what-to-change
AND why it fails the check. Notes hand back as specific change requests (§14.2 verdict rule).

---

## Review Workflow (repeatable per page/component)

1. **Self-audit** — run the rubric (machine checks + human items).
2. **Storybook visual check** — open the story set, including the `<Page>Full` story with states.
3. **Gates** — Tier-1 + Tier-2 relevant (#7 story tests + page-inventory, #9 design-audit, addon-a11y). Gates are canonical in `project-workflow.instructions.md` — this rubric points to them, it does not redefine them.
4. **Owner preview gate** — the user-preview/approval gate (`uiux-design-protocol.instructions.md` §1.6): run the Fillable Scorecard + uniqueness question, record the one-line PASS/REVISE/BLOCK verdict before logic.
5. **Sign-off ("done")** — all machine criteria green + all human rubric items pass + owner preview approved + pre-delivery checklist green.

## Definition of "Done"

A page/component is "done" only when **all five** hold:

1. All machine criteria green (token compliance, archetype conformance, states→stories, story tests, a11y scan, slop-scan).
2. All human rubric items pass (warm-minimalism QA, hierarchy, focus-visible, microcopy, one-CLA, Golden-Template parity).
3. Owner preview approved via the structured gate — Fillable Scorecard run + one-line PASS verdict recorded (`uiux-design-protocol.instructions.md` §1.6).
4. Pre-delivery checklist (`frontend-pre-delivery-checklist.instructions.md`) green.
5. Epic-close consistency snapshot recorded in the epic's verification artifact.

**Relationship to the pre-delivery checklist (not a duplicate):** the checklist stays the shipped gate artifact (gate #13) and lists _what to check_; the rubric supplies _what good means and how to measure it_ — scored measurable criteria, machine criteria tied to exact gate names, and the cross-page consistency dimension (archetype conformance + Golden-Template parity). Point to this rubric from the checklist; never re-list the criteria there.

**QA scorecard (companion):** the 7-layer reliability scorecard (≥6/7 with no red on a11y or visual = ship) and the per-surface visual-QA procedure live in `docs/guides/testing/visual-qa.md` — the rubric defines _what good means_; the guide defines _who runs it, on which stories, and where the evidence lands_.

**See also:** `page-archetypes.md` (the archetypes the rubric scores against) • `per-epic-design-spec.md` (the spec template) • `frontend-pre-delivery-checklist.instructions.md` (the shipped gate artifact) • `project-workflow.instructions.md` (canonical gate table) • `uiux-design-protocol.instructions.md` §1.6 (the gate that runs this scorecard) • `ai-generated-ui.md` §14 (companion lens + learning pack) • `docs/guides/testing/visual-qa.md` (QA scorecard + per-surface visual-QA script).
