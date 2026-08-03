# Pull Request

> **How to use this template:** Fill every section that applies; mark non-applicable ones `N/A`.
> Works for **both** epic-level PRs (single-epic-PR strategy) and story-level PRs (`[EPIC-X] Story X.Y: ...`).
> Section markers (`[EPIC-LEVEL]` / `[STORY-LEVEL]` / `[UI-ONLY]`) tell you when a section is optional for your PR type.
> <!-- PRs are created on request: push the branch to GitHub only when a PR has been requested. This file does not change that workflow. -->

## Title

- **Epic-level:** `EPIC-X: <short epic summary>`
- **Story-level:** `[EPIC-X] Story X.Y: <short description>` — matches the PR Naming Convention in `docs/guides/conventions/git.md`
- (Conventional Commits `<type>(<scope>): <summary>` applies to **commits**, not the PR title.)

## Summary

<!-- [BOTH] 1–3 sentences: what this PR delivers, the problem it solves, and why now. -->

<What / Why>

## Stories / Issues

<!-- [BOTH] One line per item. Story-level: link the story BR + impl doc. Epic-level: link the epic README and list covered stories (or "single epic PR covering stories X.Y"). Do NOT duplicate AC here — AC lives in the BR/impl docs and is confirmed in the Acceptance Criteria section below. -->

- [ ] Epic: `docs/business-requirements/epic-<num>-<slug>/README.md`
- [ ] Story/impl: `docs/issue-implementation/epic-<num>-<slug>/story-<epic>-<story>-<short>.md`
- [ ] Issues: `Closes #NN` / `Related to #NN`

## Key Changes

<!-- [BOTH] Bulleted, file-level. What was added/modified/removed and why. Focus on decisions, not a diff dump. -->

- `apps/frontend/src/features/<feature>/...` — <what / why>
- `apps/backend/src/modules/<module>/...` — <what / why>

## Architecture / Key Decisions

<!-- [BOTH] Optional-if-trivial. Architectural decision, schema change, or API contract change? Link the record: feature `design.md`, `docs/architecture.md`, or the story "Technical Challenges & Solutions" section. Otherwise: "None of note". -->

<None of note | links + 1–2 lines>

## Technical Challenges & Solutions

<!-- [BOTH] REQUIRED when non-trivial (>1h debug, schema/API misalignment, architectural decision); otherwise one line "None of note". Mirrors the story impl doc requirement. -->

<Challenge → solution, 1–3 lines. Link to the story impl doc section if recorded there.>

## Acceptance Criteria

<!-- [BOTH] NEVER pre-tick. Tick ONLY items verified as done in this PR. All AC complete before merge; never merge with `TBD`. AC lives in the BR/impl docs — this section is the merge-time confirmation, not a duplicate AC list. -->

- [ ] All AC in the story/epic docs are complete and verified
- [ ] No AC or close fields left as `TBD` post-merge (backfilled same-commit)

## Quality Gates / Testing

<!-- [BOTH] Run applicable gates. Tier 2 applies at merge / story-complete / epic-close. Canonical table (source of truth): `.github/instructions/project-workflow.instructions.md` — no doc may define its own gate set. -->

### Tier 1 — per-change / pre-commit

- [ ] `npm run format` (soft, non-blocking)
- [ ] `npm run lint` (0 errors)
- [ ] `npm run lint:css --workspace=@mandarin/frontend` (frontend changes)
- [ ] `npm run build` (type-check + bundle)
- [ ] `npm test` (changed scope)

### Tier 2 — pre-merge / story-complete / epic-close

- [ ] `npm run test:full` (NEVER `npm test` for the full suite)
- [ ] `npm run test-storybook --workspace=@mandarin/frontend` + `npm run check:registry-stories` + `npm run check:module-boundaries` (stories changed / always at merge)
- [ ] `npx @google/design.md lint DESIGN.md` (DESIGN.md changes)
- [ ] `npm run design-audit` (frontend changes)
- [ ] `npm run typecheck --workspace=@mandarin/backend` (backend changes)
- [ ] frontend-audit skill (`.github/skills/frontend-audit/SKILL.md`)
- [ ] backend-audit skill (`.github/skills/backend-audit/SKILL.md`)
- [ ] Docs + pre-delivery checklist + all AC + doc↔code truth-check (gate 13)

> **Known failures:** Match any failure against `docs/guides/testing/known-failures.md` FIRST (live rows: KF-001 radical tests, KF-002 backend lint, KF-003 design-audit warning backlog). Bump the row's `Last verified` date + add a one-line confirm; a genuinely new failure opens the next `KF-NNN`. Do NOT auto-fix unrelated failures inside this PR — triage separately.

## Doc Truth-Check

<!-- [BOTH] Confirm before merge. Rules (canonical): `documentation-standards.instructions.md` — endpoints verbatim from ROUTE_PATTERNS, names/counts from `src/`, data source verified, links resolve, dates current same-commit, high-level claims re-derived, rename hygiene. -->

- [ ] Docs match shipped code (endpoints, names, data source, links, dates)

## Pre-Delivery UI Checklist

<!-- [UI-ONLY] Only for PRs touching UI. `.github/instructions/frontend-pre-delivery-checklist.instructions.md` (token compliance, states, a11y, layout, z-index/CLS, no console/TODO, Storybook story present, registry consulted). NOTE: `verification-artifacts/` is gitignored — paste verification summaries inline, do not reference by path. -->

- [ ] Design tokens used (no hardcoded values)
- [ ] All states covered (empty / loading / error / data)
- [ ] Storybook story present + component registry consulted
- [ ] a11y + responsive + z-index/CLS verified
- [ ] No console logs / TODO left behind
- [ ] Verification summary pasted inline (artifact dir is gitignored)

## Merge-Readiness

<!-- [BOTH] After merge, backfill the PR number + merge date + key commit into BOTH the BR and impl docs in the SAME commit — never merge with `TBD`. -->

- [ ] Review feedback addressed
- [ ] CI checks pass (preview + Storybook, both `on: pull_request`)
- [ ] PR number referenced in BR + impl docs
- [ ] `Status` / `PR` / `Merge Date` / `Key Commit` fields backfilled (same commit)

## Related Links

- [Project Overview](../docs/guides/getting-started/project-overview.md)
- [Documentation Home](../docs/README.md)
- [Quality Gates (canonical)](../.github/instructions/project-workflow.instructions.md)
- [Known Failures Registry](../docs/guides/testing/known-failures.md)
- [Review Checklist](../docs/guides/operations/review.md)
