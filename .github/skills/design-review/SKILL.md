---
name: design-review
description: >
  Runs the design review: deterministic gates first (R0), an independent visual critique
  with no source access (R1), a serial synthesis that prices each finding (R2), and a
  re-verification against the live render before any edit (R3). Scores 12 dimensions 0/1/2
  with three hard gates. USE WHEN a component set, a page or a theme is being reviewed, or a
  review round is being opened, resumed or closed.
user-invocable: true
---

# Design review

**Trigger.** A review round is opened over a changed set (components, pages or a theme), or an
existing round needs synthesising or re-verifying.

**Finish.** R0 is green with receipts, every finding carries a claim, a reading and a falsifier, R2 has
priced each finding, R3 has re-checked every high-severity finding against the live render, and the
round's receipts are on disk.

`docs/guides/design/design-quality-rubric.md` owns the measurable definition of good and
`docs/guides/design/page-archetypes.md` owns the page shapes. This skill is the sequence; it does not
restate either.

The review also applies `docs/guides/design/design-revalidation-guide.md` — a surface that fails the
contract is **reworked from scratch**, not patched, and "session = route, not modal" is a binding rule.
Dense surfaces are judged against `docs/guides/design/data-density-spec.md` (fundamental #10) and
overlays against ADR-013 (`useFocusTrap`).

> **Roles are generic and skill-driven.** The review runs through the generic `layout-critic` → `design-lead`
> roles in `.solar/registry.json`, each executing this skill. Do not proliferate one-off specialist agents
> per surface; the experimental workspace-only Stage 3 Judge/Runner agents are NOT part of this repo's
> flow.

## R0 · deterministic gates (machine-owned, blocking)

CI and the reviewer run the same commands. Nothing in R1 may be raised against a file R0 has already
failed; fix the gate first.

```powershell
npm run build
npm run typecheck
npm run lint
npm run design-audit              # full: foundation + feature, 0 errors
npm run check:spine-parity        # canonical vocabulary, 0 generic / 0 deprecated
npm run check:closure             # genuinely dangling: 0
npm run check:design-parity       # component-registry <-> stories parity
```

The axe sweep named below is the browser half of R0 and runs in the browser pass, not in this
sequence:

```powershell
# per theme, 0 violations — procedure in docs/guides/testing/visual-qa.md
```

Record the receipts in the round's `r0-receipts.md`: the command, its exit code, and the one number it
printed. Reason: a later round compares against a reading, not a memory.

## R1 · independent eye (human or critic agent)

One artefact per reviewer, rendered only:

- **No source, no stylesheet, no other reviewer's report.** A reviewer who reads the implementation
  inherits its argument and starts defending it.
- **Screenshots, not a DOM dump.** The image is the only thing that shows whether it works.
- **Capture twice.** A first capture after navigation can return an empty frame; a reviewer that
  judges it describes a page that does not exist.

Every finding is a row with four parts:

```
claim      — what is wrong, in one sentence
reading    — the observation or number that shows it (width, state, measured value)
dimension  — one of the 12 below
falsifier  — the check that would prove the claim wrong
```

A finding without a reading is taste. A finding without a falsifier is unrankable, because R3 cannot
re-check it.

## The 12 dimensions

Scored 0 (absent), 1 (partial), 2 (complete). ⛔ marks a hard gate: it must score 2 for the artefact to
pass, whatever the total.

| # | Dimension | What a 2 looks like |
| --- | --- | --- |
| 1 | ⛔ Token compliance | no literals or magic numbers; every value traces to a token |
| 2 | ⛔ State completeness | every gated state exists, differs from default, and is reachable from a story |
| 3 | ⛔ Accessibility floor | WCAG 2.2 AA: 4.5:1 text, 3:1 UI and focus, keyboard and AT operable, reduced-motion and forced-colors safe |
| 4 | Naming honesty | one name per role; the name describes the role, not the first page that needed it |
| 5 | Boundary and composition | no margin, width, grid or padding leaks out; the primitive/composed tiering is respected |
| 6 | Proportionality | every variant and member has a consumer; no dead arms |
| 7 | One mechanism per fact | no duplicate vocabularies for one concept |
| 8 | API ergonomics | typed props, exported interface, a small predictable surface, deprecate before remove |
| 9 | Built-to-spec fidelity | the implementation matches the registry entry, including the token paths |
| 10 | Docs completeness | usage, style, code and accessibility guidance; a sentence per member |
| 11 | Responsiveness and globalization | works to ~320px; strings are parameterized |
| 12 | Legibility at point of use | a stranger can consume it from the catalogue and the story alone |

The three ⛔ dimensions are the ones a machine can partly check and a reviewer must confirm; the other
nine are judgement, and a judgement without a reading is not a finding.

## R2 · synthesis (serial, one lead)

One pass reads every report. It answers three questions and nothing else:

1. **Alignment** — which artefacts are unlike their peers, or unlike the studied reference, and which
   side the evidence favours.
2. **Fix** — what must change, in the order that unblocks the most, and what will *not* be fixed and
   why. A list with no rejections has not been prioritised.
3. **Condensation** — what is promoted to a live token, rule or component; what is demoted to a
   receipt; what is retired, and what depends on it.

Price each finding by the artefacts it touches. The same defect described in three reports is one
finding with three instances and is worth more stated once.

## R3 · re-verification (before any edit lands)

- **Re-check every high-severity finding against the live render.** A finding that was true in the
  capture is not automatically true in the tree.
- **Apply the falsifier.** If the stated check does not fail, the finding is withdrawn and the
  withdrawal is recorded; a withdrawn finding is a measurement, not an embarrassment.
- **Re-run R0.** A fix that reopens a gate is not a fix.
- **Never compare scores across rounds without confirming the instrument is identical.** A changed
  instrument makes two rounds incomparable, and the difference gets read as progress.

## Falsification rule

Every claim carries the check that would disprove it, and that check is run before the claim is acted
on. Two corollaries:

- An aggregate claim names its instances ("7 of 15 pages" needs the seven named).
- A number never stands in for the thing it measured: coverage is not quality, and a small void is not
  good composition by itself.

## Approval and landing

A visual change needs one design approval and two developer approvals, and it lands with the R3
receipts. A change that touches only prose or types needs the two developer approvals. A review round
never edits the artefacts it reviewed except through a fix pass that re-runs R0.

## When to stop

- An artefact has no reviewer and no reading: name it as a hole rather than judging it from its
  neighbours.
- Two reports describe the same artefact and disagree about what is on screen: that is a finding about
  the capture, not a licence to pick one.
- A gate fails for reasons unrelated to the round: record it, do not absorb it into the review.
