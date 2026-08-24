**Last Updated:** August 24, 2026

# Story 24.16: Docs-Truth Close + API Docs Expansion

## Description

**As a** documentation specialist / backend operator,
**I want to** (1) close the docs-truth — regenerated system map (`docs/README.md` + `docs/coverage.md`, `check:system-map` green), index READMEs → `Completed`, `project-workflow.instructions.md` + `backend-development.md` Nest-rewritten, `copilot-instructions.md` / `.github/agents/*` / READMEs / env docs aligned to `validateConfig` (the 7 criticals incl. `GCS_CREDENTIALS_RAW`), the 24-15 docs-close hash `5834a51e` filled, the epic READMEs registered for 16/17, and `apps/backend/docs/design.md` modernized (15 modules) — and (2) expand the **openapi** to the full live surface: `openapi.yaml` from the 7-path System/Auth/TTS surface to the full **~54-route surface** (63 registered incl. shadowed), reconciled against `ROUTE_PATTERNS` + the parity harness, with the `apps/backend/docs/api/*` per-domain specs reconciled/completed,
**So that** the docs truthfully describe the shipped NestJS backend and the API reference covers every live route — the docs side of a release-safe merge PR.

## Business Value

This story is the **BLOCKING pre-merge FIRST** story of the Epic 24 follow-on re-slice (owner, 2026-08-23): **all docs-related scope**, running before **24-17 (Deployment Setup — PR Env Scope — deployment setup — PR env scope)**, both before the single merge. It closes the docs-truth gap the cutover left behind — the system map, coverage, workflow/backend-dev instructions, env docs, index READMEs, the epic READMEs and the backend `design.md` must all truthfully describe the shipped NestJS 11 production entry (the Express surface no longer exists), so the docs never contradict the code a reader is trying to operate. It then completes the API documentation the cutover deliberately left partial: `openapi.yaml` currently documents only the 7-path System/Auth/TTS surface, and `apps/backend/docs/api/*` explicitly excludes the quiz/readers/characters/radicals/words/mnemonics/progression/review/foundations/phonetic-clusters/chengyu/grammar modules — this story expands the spec to the full ~54-route surface (reconciled against `ROUTE_PATTERNS` + the parity harness so no dead or misrouted route is documented) and completes the per-domain specs, so `/api-docs` served from Nest is a truthful full API reference for SDK/consumer tooling. The infra release-safety artifacts (rollback runbook, smoke script, rehearsal record, `preview.yml`, engines, terraform/eslint comments) are **out of scope here** — they land in 24-17 and are referenced as forward-pointers only.

## Acceptance Criteria

- [ ] **Docs-truth close** — `check:system-map` green (system map regenerated: `docs/README.md` + `docs/coverage.md`); both index READMEs (`docs/business-requirements/README.md`, `docs/issue-implementation/README.md`) → `Completed`; `project-workflow.instructions.md` + `docs/guides/setup/backend-development.md` Nest-rewritten; `copilot-instructions.md` / `.github/agents/*` / root/backend/api READMEs / `env.md` / `environment-setup.md` / `verification-artifacts/README.md` all NestJS-truthful (aligned to `validateConfig` — the 7 criticals incl. `GCS_CREDENTIALS_RAW`); the 24-15 docs-close hash `5834a51e` filled in the 24-15 IMP + epic IMP README; the epic IMP/BR READMEs registered for the 16/17 stories; `apps/backend/docs/design.md` modernized (15 modules). (Already done in the working tree — committed and verified in this story, not redone.)
- [ ] **openapi ~54-route expansion** (moved here from the old post-release 24-17; the primary remaining work item) — `apps/backend/src/shared/docs/openapi.yaml` expanded from the 7-path System/Auth/TTS surface to the full **~54-route surface** (63 registered incl. shadowed), reconciled against `ROUTE_PATTERNS` + the parity harness (dead/misrouted routes flagged, not documented); `apps/backend/docs/api/*` per-domain specs (`auth.md`, `health.md`, `caching.md`, `tts.md`, `ai-feedback.md`, `errors.md`, `env.md` + `README.md` scope note) reconciled/completed; `/api-docs` + `/api-docs.json` continue to serve the expanded spec from Nest.
- [ ] **Quality gates** — `check:system-map` green, `check:doc-links` on the edited files, and the docs-audit truth-check (template compliance + doc↔code) on the edited leaves.

## Business Rules

1. **Docs-only scope** — no production code, tests, or UI; the infra artifacts (rollback runbook, smoke script, rehearsal record, `preview.yml`, root `engines`, `terraform/main.tf`, `eslint.config.js`) are **not** part of this story — they land in **24-17** and are referenced here only as forward-pointers.
2. **openapi may document only live routes** — every path + verb is copied verbatim from `ROUTE_PATTERNS`; dead/misrouted routes are flagged, never documented; the spec is reconciled against `ROUTE_PATTERNS` **and** the parity harness.
3. **Sequencing** — 24-16 (docs) is the **FIRST commit group(s)** and 24-17 (infra) the **second**, both before the single merge; 24-16's cross-references to 24-17 artifacts are marked "delivered in 24-17".
4. **No map-affecting frontmatter changes in this pass** — if an edit touches a system-map-mirrored field (e.g. an epic README `purpose:`), it is flagged for the owner/Backend Engineer to regenerate the map rather than regenerating here; `check:system-map` stays green.
5. **Verification artifacts stay gitignored (no force-add)** — the Layer-1 rehearsal record lives in `verification-artifacts/rollback-rehearsal-24-17.md` (24-17's scope; gitignored), referenced by backtick path only.
6. **The docs-truth close is already done in the working tree** — this story commits + verifies it (AC 1) rather than redoing it; the openapi expansion (AC 2) is the remaining work.

## Related Issues

- Epic 24: NestJS Shell Migration — [BR](README.md) (epic parent)
- **Story 24.15: Deployment Cutover + Retire Dual-Mode + Docs Refresh** ([BR](story-24-15-deployment-cutover.md)) (the cutover this story closes the docs for + whose docs-close hash `5834a51e` is filled here; its openapi 7-path reconciliation is the base this story expands)
- **Story 24.17: Deployment Setup (PR Env Scope)** ([BR](story-24-17-deployment-setup-pr-env.md)) (the SECOND pre-merge story — deployment setup — PR env scope; this story forward-points to its artifacts: the rollback runbook `docs/runbooks/backend-rollback.md`, the smoke script `apps/backend/scripts/pr-smoke.mjs` + `preview.yml`, the rehearsal record `verification-artifacts/rollback-rehearsal-24-17.md`)
- **Story 24.14: Release-Safety Cutover Gate** ([BR](story-24-14-release-safety-cutover-gate.md)) (the release-safety artifact this epic's release gate extends)
- **OpenAPI target:** `apps/backend/src/shared/docs/openapi.yaml` + `apps/backend/docs/api/*` (this story's primary remaining work item)
- **Implementation (IMP twin):** `story-24-16-release-prep.md` → `../../issue-implementation/epic-24-nestjs-shell-migration/story-24-16-release-prep.md`

## Implementation Status

- **Status**: In Progress
- **PR**: TBD
- **Merge Date**: TBD
- **Commit hash**: _(to be filled at epic close)_
- **Implementation note:** this is a **BLOCKING pre-merge FIRST** story — the merge PR cannot close until the docs-truth (AC 1) + the openapi full surface (AC 2) are committed and `check:system-map` + `check:doc-links` are green. Docs-truth (AC 1) is complete in the working tree (committed in this story); the **openapi ~54-route expansion (AC 2) is the primary remaining work item**; quality gates (AC 3) run at close. The infra release-safety artifacts (rollback runbook, smoke script, rehearsal record, `preview.yml`, engines, terraform/eslint comments) are **24-17's scope** — referenced here as forward-pointers.
