**Last Updated:** August 24, 2026

# Implementation 24-16: Docs-Truth Close + API Docs Expansion

> **BR Reference:** `docs/business-requirements/epic-24-nestjs-shell-migration/story-24-16-release-prep.md`
> **Last Updated:** August 24, 2026
> **Status:** In Progress
> **Commit hash:** _(to be filled at epic close)_

## Implementation Summary

Story 24-16 is the **BLOCKING pre-merge FIRST** story of the Epic 24 follow-on re-slice (owner decision, 2026-08-23) — **all docs-related scope**. It runs before **24-17 (Deployment Setup — PR Env Scope — deployment setup — PR env scope)**; both land before the single merge PR. Two work streams:

1. **Docs-truth close (Docs Writer — complete in the working tree, committed in this story):** system map + coverage regenerated (`check:system-map` green), both index READMEs → `Completed`, `project-workflow.instructions.md` + `backend-development.md` Nest-rewritten, `copilot-instructions.md` / `.github/agents/*` / READMEs / env docs aligned to `validateConfig` (7 criticals incl. `GCS_CREDENTIALS_RAW`), the 24-15 docs-close hash `5834a51e` filled, the epic READMEs registered for the 16/17 stories, `apps/backend/docs/design.md` modernized (15 modules), and the Root-Directory contradiction reconciled (see Technical Challenges).
2. **openapi ~54-route expansion (Docs Writer + Backend Engineer — REMAINING WORK, the primary remaining work item):** `apps/backend/src/shared/docs/openapi.yaml` from the 7-path System/Auth/TTS surface to the full ~54-route surface (63 registered incl. shadowed), reconciled against `ROUTE_PATTERNS` + the parity harness; `apps/backend/docs/api/*` per-domain specs reconciled/completed.

DoD: openapi full surface + docs-truth committed; `check:system-map` + `check:doc-links` green. **Sequencing:** 24-16 (docs) is the **FIRST commit group(s)** and 24-17 (infra) the **second**, both before the single merge. 24-16's cross-references to the infra artifacts that land in 24-17 (rollback runbook, smoke script, rehearsal record, `preview.yml`, root `engines`, `terraform/main.tf`, `eslint.config.js`) are **forward-pointers** ("delivered in 24-17") — those artifacts are **not** authored in this story. **No `git add -f`** is used (owner rule — `verification-artifacts/` stays gitignored; referenced by path only).

## Technical Scope

Close the docs-truth and expand the API docs to the full live surface — the docs side of the pre-merge release prep.

**Files (docs-truth close — done in the working tree by the prior pass, committed in this story):**

- `docs/README.md` + `docs/coverage.md` — regenerated (system map; hand-zone 28/30 → corrected; Stack + epic-24 rows Nest-truthful)
- `docs/business-requirements/README.md` + `docs/issue-implementation/README.md` — index READMEs → `Completed`
- `.github/instructions/project-workflow.instructions.md` + `docs/guides/setup/backend-development.md` — Nest-rewritten (no deleted `container.ts`/`routes.ts`/`src/app/index.ts`; NestJS = production; 25–28 land on NestJS)
- `.github/copilot-instructions.md`, `.github/agents/backend-engineer.agent.md`, `.github/agents/orchestrator.agent.md`, `README.md` (root), `apps/backend/README.md`, `apps/backend/docs/api/README.md`, `apps/backend/docs/api/env.md`, `docs/guides/getting-started/README.md`, `docs/guides/getting-started/environment-setup.md`, `verification-artifacts/README.md` — aligned to the Nest production entry + `validateConfig` (7 criticals incl. `GCS_CREDENTIALS_RAW`)
- `docs/issue-implementation/epic-24-nestjs-shell-migration/story-24-15-deployment-cutover.md` — 24-15 docs-close hash `5834a51e` filled
- `apps/backend/docs/design.md` — modernized (15 modules; verified against `apps/backend/src/modules/`)
- `docs/knowledge-base/infrastructure/iac-phase1-migration-runbook.md` — Root Directory row corrected (see Technical Challenges) + `last-verified` bumped
- `docs/issue-implementation/epic-24-nestjs-shell-migration/README.md` + `docs/business-requirements/epic-24-nestjs-shell-migration/README.md` — epic READMEs updated for the 16/17 framing (this re-slice)

**Files (openapi expansion — REMAINING, the primary remaining work item):**

- `apps/backend/src/shared/docs/openapi.yaml` — expand from the 7-path System/Auth/TTS surface to the full ~54-route surface (63 registered incl. shadowed), reconciled against `ROUTE_PATTERNS` + the parity harness; dead/misrouted routes flagged, not documented
- `apps/backend/docs/api/*` — per-domain specs reconciled/completed (`auth.md`, `health.md`, `caching.md`, `tts.md`, `ai-feedback.md`, `errors.md`, `env.md` + `README.md` scope note — see the flagged "13 modules" inconsistency in Technical Challenges)

**Files (forward-pointers — delivered in 24-17, NOT authored here):**

- `docs/runbooks/backend-rollback.md` — two-layer rollback runbook (delivered in 24-17)
- `apps/backend/scripts/pr-smoke.mjs` + `.github/workflows/preview.yml` — PR-env smoke (delivered in 24-17)
- `verification-artifacts/rollback-rehearsal-24-17.md` — Layer-1 rehearsal record (delivered in 24-17; gitignored — referenced by path only)
- `apps/backend/railway.toml` rollback pointer · root `package.json` `engines` `>=24` · `terraform/main.tf` + `apps/backend/eslint.config.js` comments (delivered in 24-17)

## Implementation Details

### Docs-truth close (as-built — committed in this story's working tree)

The docs-truth pass (prior working-tree pass, committed in this story) closed the cutover's docs gap so the docs never contradict the shipped NestJS 11 production entry:

- **System map + coverage regenerated** — `docs/README.md` + `docs/coverage.md` from `scripts/generate-system-map.mjs`; `check:system-map` green.
- **Index READMEs → Completed** — `docs/business-requirements/README.md` + `docs/issue-implementation/README.md`.
- **Workflow/backend-dev Nest-rewritten** — `.github/instructions/project-workflow.instructions.md` + `docs/guides/setup/backend-development.md` (no deleted `container.ts`/`routes.ts`/`src/app/index.ts`; NestJS = production; 25–28 land on NestJS).
- **`validateConfig`-aligned env/READMEs** — `copilot-instructions.md`, both agents, root/backend/api READMEs, `env.md`, `environment-setup.md`, `verification-artifacts/README.md` (the 7 criticals incl. `GCS_CREDENTIALS_RAW`).
- **24-15 docs-close hash filled** — `5834a51e` in `story-24-15-deployment-cutover.md` + the epic IMP README.
- **`apps/backend/docs/design.md` modernized** — 15 modules (verified against `apps/backend/src/modules/`).
- **Root Directory contradiction reconciled** — see Technical Challenges.

### openapi ~54-route expansion (remaining work)

The spec (reconciled at 24-15 to the 7-path System/Auth/TTS surface) is **not** a full spec. This work item expands it to the full live surface:

- **Target:** `openapi.yaml` documents the full **~54-route surface** (63 registered incl. shadowed) — every `ROUTE_PATTERNS` entry path + verb copied verbatim (`health`/`tts`/`quiz`/`auth`/`progression`/`review`/`radicals`/`foundations`/`characters`/`words`/`mnemonics`/`readers`/`phonetic-clusters`/`grammar`/`chengyu` + `pinyin/search`), reconciled against `ROUTE_PATTERNS` **and** the parity harness (the `tests/integration/nest/*.test.ts` registry) so no dead or misrouted route is documented.
- **Per-domain specs reconciled/completed** — `apps/backend/docs/api/*` (`auth.md`, `health.md`, `caching.md`, `tts.md`, `ai-feedback.md`, `errors.md`, `env.md` + `README.md` scope note) updated to match the full surface; the `README.md` "13 modules" scope note is flagged stale vs the 15-module truth and is reconciled here.
- **`/api-docs` + `/api-docs.json`** continue to be served from Nest (`configure-app.ts`); the expanded `swaggerSpec` flows through unchanged.

### Forward-pointers to 24-17 (delivered in 24-17)

The infra artifacts this story's release gate depends on land in **24-17 (Deployment Setup — PR Env Scope)**, the second pre-merge commit group: the two-layer rollback runbook `docs/runbooks/backend-rollback.md`, the PR-env smoke (`apps/backend/scripts/pr-smoke.mjs` + `preview.yml` job), the Layer-1 rehearsal record `verification-artifacts/rollback-rehearsal-24-17.md`, the `railway.toml` rollback pointer, root `engines` `>=24`, and the `terraform/main.tf` + `eslint.config.js` comments. They are referenced here as forward-pointers only.

## Architecture Integration

```
[Story 24-16: Docs-Truth Close + API Docs Expansion]
│  BLOCKING pre-merge FIRST — all docs scope; runs before 24-17 (deployment setup — PR env scope), both before the merge PR
├── Docs-truth close (Docs Writer) ─ committed, working tree done:
│     system-map regen + coverage · index READMEs Completed · project-workflow
│     + backend-development Nest-rewritten · copilot-instructions/agents/README/
│     env docs → validateConfig (7 criticals) · 24-15 hash 5834a51e filled ·
│     epic READMEs 16/17 · design.md modernized (15 modules) · runbook Root
│     Directory reconcile (repo-root cwd)
├── openapi ~54-route expansion (Docs Writer + Backend Engineer) ─ REMAINING:
│     openapi.yaml 7-path → full ~54-route surface (63 registered incl. shadowed)
│     · reconciled vs ROUTE_PATTERNS + parity harness · apps/backend/docs/api/*
│     per-domain specs reconciled/completed
├── Forward-pointers to 24-17 (deployment, delivered there):
│     runbook docs/runbooks/backend-rollback.md · pr-smoke.mjs + preview.yml ·
│     rehearsal record rollback-rehearsal-24-17.md (gitignored) · railway.toml
│     pointer · root engines >=24 · terraform/main.tf + eslint.config.js comments
└── Enables: the Epic 24 merge PR to ship with truthful docs + a full API reference;
    epics 25–28 land on NestJS after
```

Dependencies: **24-15** (the cutover this story closes the docs for and whose docs-close hash `5834a51e` is filled here) and **24-14** (the release-safety gate). It is the **first** of the two pre-merge follow-on stories; **24-17 (deployment setup — PR env scope)** is the second. Parallel-safety: docs-only scope; the infra artifacts it references are confined to 24-17. Consumers: the merge PR review, the Backend Engineer (24-17), and epics 25–28 (unblocked once stable).

## Technical Challenges & Solutions

### The Epic-24 follow-on re-slice (owner, 2026-08-23) — docs-first, infra-second

```
Problem: The combined "Release-Prep + Docs-Truth Close + Verified Rollback +
  PR-Env Smoke" (24-16) mixed docs, infra, and verification; the openapi
  ~54-route expansion was post-release (24-17).
Solution: Owner re-sliced into two pre-merge stories — NEW 24-16 = Docs-Truth
  Close + API Docs Expansion (docs-only, blocking, runs FIRST; openapi expansion
  moved here from the old post-release 24-17) and NEW 24-17 = Deployment Setup (PR Env Scope)
  (deployment setup — PR env scope, runs SECOND; further re-scoped by the owner
  2026-08-24 to deployment setup — PR env scope only). The old combined 24-16 docs are
  rewritten (docs-only) and a new 24-17 BR/IMP authored. Sequencing: 24-16 is
  the FIRST commit group(s), 24-17 the second, both before the single merge.
  The rehearsal record moves from `rollback-rehearsal-24-16.md` →
  `rollback-rehearsal-24-17.md` (the record now belongs to story 17 — verified
  not present in the tree; referenced as a forward-pointer).
```

### Root Directory contradiction — `apps/backend` vs repository root

```
Problem: Two docs disagree on the Railway "Root Directory" service setting.
  docs/knowledge-base/infrastructure/iac-phase1-migration-runbook.md (Service
  Settings table) says Root Directory = `apps/backend`; docs/guides/operations/
  deployment.md asserts Railway (RAILPACK) builds with cwd = the repository
  root, citing the root-relative `--schema` path and `--workspace` flags.
Solution: Verified against apps/backend/railway.toml — the buildCommand uses
  repo-root-relative paths and root `--workspace` flags. A Root Directory of
  `apps/backend` would resolve `--schema=apps/backend/...` to a nonexistent
  path and fail the root `--workspace` flags. FIX: the runbook (the WRONG doc)
  is corrected to "leave unset (repository root)"; deployment.md (the CORRECT
  doc) is unchanged.
```

### `apps/backend/docs/api/README.md` scope note (flagged — reconciled in the openapi work item)

```
Problem: `apps/backend/docs/api/README.md` carries a scope note that the
  reference "covers 7 domains... The modulith has 13 modules" and that quiz/
  readers/characters/etc. are "not yet captured here" — stale vs the 15-module
  truth (design.md modernized; `apps/backend/src/modules/` has 15).
Solution: FLAGGED here, not fixed — this is part of the openapi ~54-route
  expansion AC (reconcile `apps/backend/docs/api/*`); the README scope note is
  rewritten when the per-domain specs are completed so it truthfully describes
  the full surface.
```

### Doc Truth-Check

- [x] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (path + verb copied verbatim) — the openapi target is the **~54 `ROUTE_PATTERNS` entries** (verified by reading `packages/shared-constants/src/index.js`: 54 unique patterns across all 15 modules + `pinyin/search`); the "63 registered incl. shadowed" figure is the Nest-registry count (parity-harness surface, incl. the duplicated `radicalsCharacters` + cross-module `/characters/:glyph` shadow) — reconciled at expansion time
- [x] Feature/module/component names verified against `apps/backend/src/modules/` and `apps/frontend/src/features/` — **15 modules** listed verbatim (`audio`, `auth`, `characters`, `chengyu`, `foundations`, `grammar`, `health`, `mnemonics`, `phonetic-clusters`, `progression`, `quiz`, `radicals`, `readers`, `review`, `words`); no new module names invented
- [x] Data source (static JSON vs Postgres/API) matches the backing service/repository code — the per-domain spec claims (auth/health/caching/TTS/AI-feedback/errors/env) are re-verified against the backing modules at expansion time
- [x] All relative markdown links resolve — the epic READMEs + the story-BR/IMP twins + `story-24-14`/`story-24-15` resolve; `docs/runbooks/backend-rollback.md` + `apps/backend/scripts/pr-smoke.mjs` + `apps/backend/docs/api/*` resolve in the working tree; `verification-artifacts/rollback-rehearsal-24-17.md` is referenced by backtick path only (gitignored — no force-add; forward-pointer to 24-17)
- [x] Last Updated / Last Update date is current (same commit as the edit) — bumped to 2026-08-23 on every leaf touched
- [x] **Truth-check corrections:** (1) the Root Directory contradiction resolved in favour of repository-root cwd (the runbook was the wrong doc); (2) the api/README "13 modules" scope note is stale vs 15 — flagged for the openapi work item; (3) no tool/framework named that isn't in `package.json` (Vitest-only; `swagger-ui-express`/NestJS verified).

## Testing Implementation

This is a **docs + verification story** — its "tests" are the quality gates (run at close) plus the openapi-reconciliation checks:

| Gate              | Command                                               | Expectation                                                                  |
| ----------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------- |
| System map        | `npm run check:system-map`                            | green (docs regenerated — no map-affecting frontmatter changed in this pass) |
| Doc links         | `scripts/check-doc-links.mjs`                         | edited files only (repo-wide pre-existing rot out of scope)                  |
| Docs audit        | `.github/skills/docs-audit/SKILL.md`                  | template compliance + doc↔code truth-check on the edited leaves              |
| openapi reconcile | openapi.yaml ↔ `ROUTE_PATTERNS` ↔ parity-harness diff | full ~54-route surface, no dead/misrouted routes documented                  |

**Behavioral verification (24-17's scope, referenced as forward-pointers):** the PR-env smoke (`preview.yml` job via `apps/backend/scripts/pr-smoke.mjs`) and the Layer-1 rollback rehearsal (record in `verification-artifacts/rollback-rehearsal-24-17.md`) land in **24-17** and gate the merge PR there.
