**Last Updated:** September 4, 2026

# Implementation 24-17: Deployment Setup (PR Env Scope) + Env-Isolation Hardening + IaC

> **BR Reference:** `docs/business-requirements/epic-24-nestjs-shell-migration/story-24-17-deployment-setup-pr-env.md`
> **Last Updated:** September 4, 2026
> **Status:** In Progress
> **Commit hash:** _(to be filled at epic close)_
> **2026-09-04:** Vercel **simplified** (owner + Architect approved): per-PR Vercel targeting
> removed — `preview.yml` has no `vercel-preview` job or Vercel cleanup step, and
> `terraform/vercel.tf` keeps only the single Production `VITE_API_URL` (Preview-scope fallback var
> deleted). Previews are Vercel-native auto-builds; preview-scope `VITE_API_URL` is owner-set
> manually when testing (Neon `demo` parent repaired 2026-09-04 → 30/30 migrations, data-free;
> poisoned preview branch deleted).

## Implementation Summary

Story 24-17 is the **pre-merge SECOND** story of the Epic 24 follow-on re-slice, **superseded 2026-08-25 by the approved final plan** (Architect, owner-approved) to **Deployment Setup (PR Env Scope) + Env-Isolation Hardening + IaC**. It runs AFTER **24-16 (Docs-Truth Close + API Docs Expansion)** (docs, blocking, FIRST); both land before the single merge PR. Five workstreams:

1. **A — Deployment execution (the core):** push → merge the PR (the **two-fold merge gate**: `preview.yml` smoke green + the **R1/R2 upserts verified**) → **Railway prod deploy** → **post-flip prod smoke + T+0→24h watch window** (R1 prod JWT rotation at T+0) — the **T+0 rollback-decision point** (owner judgment → redeploy the previous Railway release or `git revert`, per `deployment.md` §Rollback). **Post-merge bugs → hotfix on main** (out of scope).
2. **B — Deployment enablers (already built in the working tree — kept, framed as deployment prep):** the single-page rollback note in `docs/guides/operations/deployment.md` §Rollback (redeploy the previous Railway release primary + `git revert` fallback; additive-only migration invariant; verify with `pr-smoke.mjs` — the former two-layer pinned-tag model + runbook are retired), the PR-env smoke (`preview.yml` smoke job + `apps/backend/scripts/pr-smoke.mjs`), and the config normalizations (root `engines.node` `>=24`, `terraform/main.tf` comment, `apps/backend/eslint.config.js` comment).
3. **C — Env-isolation hardening:** **R1** per-env JWT secrets + `JwtService` env claim + prod rotation at T+0; **R2** `HEALTH_PROBE_EXTERNAL=false` probe gate + per-env GCP → preview SA + sandbox bucket; **R3** Neon `parent:demo` preview branch (owner action, non-blocking); **R6** backup gate (doc-only); **R4/R5** deferred to Phase-2.
4. **D — IaC:** `terraform/README.md` (NEW) + additive preview SA + sandbox bucket; the committed `docs/guides/operations/env-isolation.md` extraction (Phase-2-delivered evidence); NestJS refresh of `docs/knowledge-base/infrastructure/iac-phase1-migration-runbook.md` + `docs/guides/operations/deployment.md`.
5. **E — Owner external validations (PENDING owner — open AC gates):** the 7 items in `env-isolation.md` §5, incl. the **new upsert/secret/demo checks**.

DoD: merge PR merged with the **two-fold merge gate** green (smoke + R1/R2 upserts verified) → Railway prod deploy executed → post-flip prod smoke + T+0→24h watch green (R1 rotation at T+0; the T+0 rollback-decision point per `deployment.md` §Rollback) → hardening (R1/R2 shipped, R3 non-blocking, R6 doc-only, R4/R5 deferred) + IaC landed → owner validations recorded → post-merge bugfixing delegated to the hotfix-on-main path. **Sequencing:** 24-16 (docs) is the FIRST commit group(s), 24-17 (deployment setup — PR env scope) the second, both before the single merge. **4-commit sequence:** C1 feat (JWT env claim + probe gate + tests) → C2 ci (preview.yml per-env upserts + provision PR-scoping fix) → C3 chore(infra) (preview SA + sandbox bucket + terraform README) → C4 docs (this supersede + `env-isolation.md` + iac-phase1 runbook/deployment §Rollback refresh + two-fold gate).

## Technical Scope

Execute the Epic 24 production release end-to-end with per-environment isolation and the IaC to support it. The deployment is underpinned by the deployment enablers already built in the working tree (the rollback note, PR-env smoke, config normalizations). Post-merge bugs are NOT in scope — they go to the hotfix-on-main path.

**Deployment activities (Workstream A — executed during 24-17):**

- Merge the PR with the **two-fold merge gate** green (`preview.yml` smoke green + the R1/R2 upserts verified)
- Railway prod deploy of the NestJS entry (`node dist/nest/main.js`)
- Post-flip prod smoke + T+0→24h watch window — the **T+0 rollback-decision point**; R1 prod JWT rotation at T+0
- Rollback execution only if the T+0 decision calls for it (owner judgment → redeploy-previous or `git revert`, per `deployment.md` §Rollback)

**Files (Workstream B — deployment enablers, complete in the working tree, committed in this story as deployment prep):**

- `docs/guides/operations/deployment.md` — **§Rollback** single-page rollback note (redeploy the previous Railway release primary; `git revert` fallback; retained invariants — additive-only migration never rolled back + `pr-smoke.mjs` verify; triage env-diff vs code-regression) — the former `docs/runbooks/backend-rollback.md` runbook + pinned tag are **retired**
- `apps/backend/scripts/pr-smoke.mjs` — **NEW** dependency-free in-repo smoke script (health + service booleans, auth register/login/refresh/me, guest phase-gate shape, 4xx envelope)
- `.github/workflows/preview.yml` — post-deploy smoke job calling the script on the PR URL + **the C2 per-env upserts (Workstream C)** + **the provision PR-scoping fix**
- `apps/backend/railway.toml` — build/deploy pipeline (the former rollback comment pointer is removed)
- `package.json` (root) — `engines.node` `>=20.0.0` → `>=24`
- `terraform/main.tf` — comment (Express→NestJS)
- `apps/backend/eslint.config.js` — comment

**Files (Workstream C — env-isolation hardening, Backend Engineer's C1–C2 commits):**

- `apps/backend/src/shared/infrastructure/security/JwtService.ts` — **R1**: `env` claim on issued tokens (`env: process.env.APP_ENV ?? "production"`); `assertEnvClaim` rejects a token minted for a different/missing env (defense-in-depth on top of per-env secrets)
- `apps/backend/src/shared/infrastructure/external/GeminiService.ts` + `apps/backend/src/modules/audio/services/AudioService.ts` — **R2**: probe gate — `healthCheck` short-circuits (returns `false` without calling the external client) when `HEALTH_PROBE_EXTERNAL=false`
- `.github/workflows/preview.yml` — **C2**: per-PR upserts: `JWT_SECRET`/`JWT_REFRESH_SECRET` via `openssl rand -hex 48` + `APP_ENV=pr-<n>`; the three `*_CREDENTIALS_RAW` ← `$GCP_PREVIEW_SA_KEY` + `GCS_BUCKET_NAME` → sandbox bucket `pinyin-pal-preview-data` (`GCP_PREVIEW_BUCKET_NAME` var); `HEALTH_PROBE_EXTERNAL=false`; Neon `parent_branch: demo`
- New unit tests for the env claim + probe gate (`JwtService.test.ts`, `GeminiService.test.ts`, `AudioService.test.ts`)

**Files (Workstream D — IaC, Backend Engineer's C3 + this docs slice):**

- `terraform/README.md` — **NEW** IaC overview (what Terraform manages, the additive preview SA + sandbox bucket, the manual branch apply + `GCP_PREVIEW_SA_KEY` secret flow)
- `terraform/service-accounts.tf` / `terraform/iam.tf` / `terraform/main.tf` — **additive** preview SA (`preview-service`) + sandbox bucket (`pinyin-pal-preview-data`) + scoped IAM (object admin on the sandbox bucket only); existing resources untouched
- `docs/guides/operations/env-isolation.md` — **NEW** committed extraction (separated-vs-shared matrix, R1–R6 table, placement decisions, the 7 owner external-verification items)
- `docs/knowledge-base/infrastructure/iac-phase1-migration-runbook.md` — NestJS refresh (production entry `node dist/nest/main.js`, `railway.toml` pipeline, per-env isolation → `preview.yml`, rollback pointer → `deployment.md` §Rollback)
- `docs/guides/operations/deployment.md` — NestJS refresh (Architecture, single-page rollback note **§Rollback**, C6 backup gate)

**Files (pending):**

- Post-merge hotfixes — **OUT OF SCOPE** — any defect surfaced by the post-flip smoke/watch is handled as a hotfix on `main` (separate concern, not in 24-17)
- Owner external validations — recorded as AC gates (the 7 items in `env-isolation.md` §5)

## Implementation Details

### Production release execution (Workstream A — the core deployment activity)

The story's core is executing the release: **merge → deploy → verify → watch**. Each step is gated by the enablers + hardening below:

1. **Push + merge the PR** — the **two-fold merge gate**: `preview.yml` smoke green (health + service booleans, auth register/login/refresh/me, guest phase-gate shape, 4xx envelope) + the **R1/R2 upserts verified** (per-env JWT + probe gate + preview SA/sandbox live on the PR env). The rehearsal leg was dropped (2026-08-25 owner decision — the rollback model was retired).
2. **Railway prod deploy** — the merged `main` deploys the NestJS entry (`node dist/nest/main.js`); healthcheck `/api/v1/health` green.
3. **R1 prod JWT rotation at T+0** — rotate the prod `JWT_SECRET`/`JWT_REFRESH_SECRET`; existing sessions get one re-login (accepted).
4. **Post-flip prod smoke + T+0→24h watch** — the **T+0 rollback-decision point** (T+0 merge · T+5–15min smoke → No-Go #1 · T+15–60min log scan → No-Go #2 · T+1h–24h watch).
5. **Rollback execution (only if the T+0 decision calls for it)** — owner judgment, per `deployment.md` §Rollback: primary = redeploy the previous Railway release (Railway dashboard → Deployments); fallback = `git revert <bad-commit>` on `main`. No-Go verdicts are triaged env-diff (fix config + redeploy — no rollback) vs code-regression (revert).
6. **Post-merge bugs → hotfix on main** — any defect surfaced by the post-flip smoke/watch is handled as a hotfix on `main` after the release (separate concern, not in 24-17).

### Rollback — single-page note (Workstream B — as-built)

The rollback model was **retired on 2026-08-25** (owner decision): the two-layer pinned-tag model, `docs/runbooks/backend-rollback.md`, the auto-trip trigger table, and the Layer-1 rehearsal leg are gone. Rollback is the single-page note in `docs/guides/operations/deployment.md` §Rollback:

```
Option 1 (primary)  — Railway dashboard → Deployments → redeploy the previous release
Option 2 (fallback) — git revert <bad-commit> on main (add -m 1 if merged) → push → Railway redeploys
Retained invariants — never roll back the migration set (additive-only); verify with
                     pr-smoke.mjs against prod after any rollback
Triage              — red prod smoke = env-diff (fix config + redeploy, no rollback)
                     vs code-regression (revert)
```

- **Why remove the pinned tag?** The tag points at a pre-24-17 Express tree that LACKS the R1 `JwtService` env claim + R2 probe gate — rolling back to it would re-open the isolation holes 24-17 closes; and the runbook was self-retiring ceremony (rehearsal + trigger table added operational overhead once the smoke gate is the pre-merge confidence check).
- **Where is the decision point?** The post-flip prod smoke + T+0→24h watch remains — a red prod smoke there is the **T+0 rollback-decision point**: owner judgment → redeploy-previous or `git revert`, per `deployment.md` §Rollback.

### Env-isolation hardening (Workstream C)

#### R1 — Per-env JWT secrets + `JwtService` env claim + prod rotation at T+0

Before 24-17, prod and every preview shared the same `JWT_SECRET`/`JWT_REFRESH_SECRET` (set once in the Railway service) — a token minted in a preview env is valid in prod. 24-17 splits them:

- **Per-env secrets (C2, `preview.yml`):** the preview provision job upserts per-PR `JWT_SECRET` + `JWT_REFRESH_SECRET` + `APP_ENV` onto the Railway `pr-*` environment (generated with `openssl rand -hex 48`; each PR gets fresh secrets). Prod keeps its own managed secrets.
- **`JwtService` env claim (C1, code + tests):** issued tokens carry an `env` claim = `process.env.APP_ENV ?? "production"`; `assertEnvClaim` rejects a token whose claim differs from the serving env — a preview-minted token (`env: "pr-<n>"`) cannot authenticate against prod or another PR env, even when the signing secret matches (defense-in-depth).
- **Prod rotation at T+0 (A):** after the prod deploy, rotate the prod JWT secrets; existing sessions get one re-login (accepted — documented in `env-isolation.md` R1).

#### R2 — `HEALTH_PROBE_EXTERNAL=false` probe gate + per-env GCP → preview SA + sandbox bucket

- **Probe gate (C1, code + tests):** `GeminiService.healthCheck` + the AudioService TTS health check short-circuit when `HEALTH_PROBE_EXTERNAL=false` — they return `false` WITHOUT calling the external client, so the preview env neither invokes paid prod-side services nor leaks dependency state. Railway's ON_FAILURE ×10 healthcheck still gets a 200; the smoke asserts the booleans are still booleans.
- **Per-env GCP (C2 + C3):** the preview env no longer inherits prod `GCS_CREDENTIALS_RAW` + `GCS_BUCKET_NAME`. C3 provisions an additive **preview SA** (`preview-service`) + a **sandbox bucket** (`pinyin-pal-preview-data`, scoped IAM: object admin on the sandbox bucket only). C2 upserts all three `*_CREDENTIALS_RAW` from the single `GCP_PREVIEW_SA_KEY` GitHub secret (stored by the owner after the manual branch apply) + `GCS_BUCKET_NAME` → the sandbox bucket — a preview env can no longer read/write prod GCS.

#### R3 — Neon `parent_branch: demo` preview branch (non-blocking)

The Neon preview branch is created with `parent_branch: demo` — cloning the `demo` branch (a prod-copy created/seeded by the owner) as the preview base instead of only prod. Non-blocking — if the demo branch is not ready, the preview falls back to the prod parent (R3 fallback).

#### R6 — Backup gate (doc-only)

`docs/guides/operations/deployment.md` gains the **C6 backup gate** section: before a data-sensitive migration, take a Neon backup (console-side, manual) — documented, not automated; enforced as a manual release check.

#### R4/R5 — Deferred to Phase-2

Dedicated preview GCP project (same-project quota — R4) and dedicated preview Redis (R5) are deferred to Phase-2 and documented in `env-isolation.md` (not implemented in 24-17).

### IaC (Workstream D)

- `terraform/README.md` — NEW overview: what Terraform manages, the additive preview SA + sandbox bucket, the manual branch `terraform apply` before the release PR (because `terraform-apply.yml` auto-runs on `main` post-merge), and the `GCP_PREVIEW_SA_KEY` → GitHub secret flow.
- `terraform/service-accounts.tf` + `terraform/iam.tf` + `terraform/main.tf` — **additive** preview SA (`preview-service`) + sandbox bucket (`pinyin-pal-preview-data`) + scoped IAM; existing resources unchanged.
- `docs/guides/operations/env-isolation.md` — NEW committed extraction (the "Phase-2-delivered" evidence): the separated-vs-shared matrix, the R1–R6 risk table, the placement decisions, and the 7 owner external-verification items.
- `docs/knowledge-base/infrastructure/iac-phase1-migration-runbook.md` + `docs/guides/operations/deployment.md` — NestJS refresh (see below).

### Owner external validations (Workstream E)

The 7 verification items (also in `env-isolation.md` §5): (1) Railway/Neon secrets/vars present; (2) PR deployments enabled + no conflicting overrides + Vercel preview `VITE_API_URL` resolution — **Vercel simplified 2026-09-04** (single TF Production `VITE_API_URL`; previews Vercel-native auto-builds; the per-PR `vercel-preview` job + Vercel cleanup step + the Preview-scope fallback var were **removed** — preview-scope `VITE_API_URL` is owner-set manually when testing the FE preview against a Railway `pr-<n>` backend); (3) Neon preview branch parent = prod; (4) `smoke` required status check; (5) manual `terraform apply` on branch + `GCP_PREVIEW_SA_KEY` GitHub secret; (6) per-env upserts verified live; (7) Neon `demo` parent branch (`parent_branch: demo`) created/seeded.

## Architecture Integration

```
[Story 24-17: Deployment Setup (PR Env Scope) + Env-Isolation Hardening + IaC]
│  pre-merge SECOND — runs after 24-16 (docs), both before the merge PR
├── A · Deployment execution (core):
│     push → merge PR (two-fold gate: smoke green + R1/R2 upserts verified) →
│     Railway prod deploy → post-flip smoke + T+0→24h watch (R1 rotation at T+0)
│     → T+0 rollback-decision point (redeploy-previous or git revert per
│     deployment.md §Rollback); post-merge bugs → hotfix on main (out of scope)
├── B · Deployment enablers (deployment prep — working tree done, kept):
│     Rollback: single-page note deployment.md §Rollback (redeploy-previous
│       primary · git revert fallback · additive-only invariant · pr-smoke verify)
│       — former runbook + pinned tag retired
│     Smoke: preview.yml post-deploy job · apps/backend/scripts/pr-smoke.mjs
│     Config: root engines >=24 · terraform/main.tf comment · eslint.config.js comment
├── C · Env-isolation hardening:
│     R1 per-env JWT (openssl rand) + JwtService env claim + prod rotation T+0
│     R2 HEALTH_PROBE_EXTERNAL=false probe gate + per-env GCP → preview SA/sandbox bucket
│     R3 Neon parent_branch: demo (non-blocking, owner action) · R6 backup gate (doc-only)
│     R4/R5 deferred Phase-2
├── D · IaC:
│     terraform/README.md (NEW) · preview SA + sandbox bucket (additive)
│     docs/guides/operations/env-isolation.md (NEW committed extraction)
│     iac-phase1-migration-runbook.md + deployment.md (NestJS refresh)
├── E · Owner external validations (PENDING — open AC gates):
│     Railway/Neon secrets · PR deployments + VITE_API_URL · Neon parent=prod ·
│     smoke required check · terraform pre-apply + GCP_PREVIEW_SA_KEY ·
│     per-env upserts verified · demo branch
└── Enables: the Epic 24 NestJS production release to ship isolated, verify,
    and roll back safely; epics 25–28 land on NestJS after stable
```

Dependencies: **24-16** (the docs story this deployment story follows — the first pre-merge commit group; this story's artifacts are forward-pointed from it) and **24-14** (the release-safety gate whose artifact the post-flip smoke/watch model extends). It is the **second** of the two pre-merge follow-on stories and **executes the Epic 24 production release** with env isolation + IaC. Parallel-safety: deployment + hardening + IaC scope only (`.github/workflows/`, `apps/backend/scripts/`, `apps/backend/src/shared/infrastructure/security/JwtService.ts`, `apps/backend/src/shared/infrastructure/external/GeminiService.ts`, `apps/backend/src/modules/audio/services/AudioService.ts`, `docs/guides/operations/`, `docs/knowledge-base/infrastructure/`, `terraform/`, `railway.toml`, root `package.json` engines, `eslint.config.js`); no docs-truth or openapi changes (those are 24-16's). Consumers: the merge PR review, the release captain (owner), the post-flip prod smoke/watch, and epics 25–28 (unblocked once stable).

## Technical Challenges & Solutions

### Per-env JWT isolation without breaking the shared prod surface (R1)

```
Problem: Prod and every preview shared one JWT_SECRET/JWT_REFRESH_SECRET. A token
  minted on a preview env (or a leaked preview secret) is valid in prod — the
  env-isolation review flagged this as the highest-severity shared risk (R1).
Solution: Three-part fix — (1) per-PR secrets: preview.yml upserts fresh
  JWT_SECRET/JWT_REFRESH_SECRET/APP_ENV (openssl rand) onto each pr-* env; (2)
  JwtService env claim: issued access tokens carry the issuing environment so a
  preview-minted token cannot authenticate against prod; (3) prod rotation at
  T+0 after the deploy. Side-effect accepted: one re-login for active sessions
  at T+0. Documented in docs/guides/operations/env-isolation.md (R1).
```

### Gating the health probe without breaking Railway's healthcheck (R2)

```
Problem: The /api/v1/health probe called the real Gemini/TTS clients on every
  environment — a preview env invoked paid prod-side services and leaked
  dependency state. Gating it must not break Railway's ON_FAILURE ×10 healthcheck,
  which polls the same path and needs a 200.
Solution: A HEALTH_PROBE_EXTERNAL flag, default false — when set, the
  GeminiService/AudioService health checks short-circuit and return false WITHOUT
  calling the external client (no external calls, no state leak). Railway's
  healthcheck still gets 200; the smoke asserts the booleans are booleans.
  Documented in env-isolation.md (R2).
```

### Least-privilege GCP for preview without touching prod state (R2 + IaC additive rule)

```
Problem: Preview inherited prod GCS_CREDENTIALS_RAW (gcs-storage-service, object
  admin on pinyin-pal-data) + GCS_BUCKET_NAME. A compromised preview env holds
  prod storage credentials. But terraform-apply.yml auto-runs on main post-merge,
  so applying new resources in the merge commit would race the release.
Solution: C3 adds a preview SA (preview-service) + a sandbox bucket
  (pinyin-pal-preview-data) + scoped IAM (object admin on the sandbox bucket only) —
  additive-only, existing resources untouched. The owner runs terraform apply on
  the branch BEFORE the release PR and stores the preview SA key as the
  GCP_PREVIEW_SA_KEY GitHub secret; C2 points the preview env's GCP vars at the
  preview SA + sandbox bucket. Documented in env-isolation.md (R2) + terraform/README.md.
```

### The merge gate reframed as two-fold (rollback model removed, 2026-08-25)

```
Problem: The approved plan (2026-08-25) first widened the merge gate to
  three-fold (smoke + Layer-1 rehearsal record + R1/R2 upserts verified). A later
  owner decision (same day) removed the rollback model entirely — the pinned tag
  points at a pre-24-17 Express tree LACKING the R1 env claim + R2 probe gate, so
  rolling back to it would re-open the isolation holes; and the runbook was
  self-retiring ceremony.
Solution: The merge gate is now TWO-fold — preview.yml smoke green (machine) +
  R1/R2 upserts verified (human); the rehearsal leg is dropped. Rollback is the
  single-page note in deployment.md §Rollback (redeploy-previous + git revert),
  and the post-flip prod smoke + T+0→24h watch remains the T+0 rollback-decision
  point (owner judgment). Documented across story-24-17 BR/IMP + env-isolation.md.
```

### Superseding the prior 24-17 re-scopes (2026-08-23/24 → 2026-08-25 final plan)

```
Problem: 24-17 was re-scoped twice ("Release Infra Setup", then "Deployment Setup
  — PR Env Scope only"). The approved final plan (Architect, owner-approved
  2026-08-25) is broader: Deployment Setup + Env-Isolation Hardening + IaC, in 5
  workstreams (A–E) with a 4-commit sequence (C1 code → C2 CI upserts → C3 infra
  → C4 docs). The BR/IMP docs must be superseded to this plan, not the older ones.
Solution: Both story docs rewritten to the approved final plan (this supersede).
  The PR-env smoke carries forward into Workstreams A/B; the rollback model was
  subsequently retired (2026-08-25 — see the two-fold gate challenge above); the
  hardening (C), IaC (D), and the new upsert/secret/demo owner checks (E) are
  added. Status in-progress; commit-hash blank (fill at epic close).
```

### Doc Truth-Check

- [x] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (path + verb copied verbatim) — the smoke step's endpoints verified: `health: "/v1/health"`, `authRegister: "/v1/auth/register"`, `authLogin: "/v1/auth/login"`, `authRefresh: "/v1/auth/refresh"`, `authMe: "/v1/auth/me"`, `progressionPhaseGate: "/v1/progression/phase-gate"` (all `/api`-prefixed by the shell) — the 4xx envelope + guest phase-gate shape are documented behaviors from 24-3/24-7/24-13
- [x] Feature/module/component names verified against `apps/backend/src/modules/` and `apps/frontend/src/features/` — no new module/feature names invented; `apps/backend/scripts/pr-smoke.mjs`, `apps/backend/src/shared/infrastructure/security/JwtService.ts`, `apps/backend/src/shared/infrastructure/external/GeminiService.ts`, `apps/backend/src/modules/audio/services/AudioService.ts`, `terraform/`, `.github/workflows/preview.yml`, `docs/guides/operations/deployment.md` (§Rollback) verified from the working tree
- [x] Data source (static JSON vs Postgres/API) matches the backing service/repository code — the smoke asserts auth + health + guest phase-gate (all DB/service-backed, meaningful on the unseeded preview DB); user-data routes are explicitly excluded
- [x] All relative markdown links resolve — the epic READMEs + the story-BR/IMP twins resolve; `docs/guides/operations/env-isolation.md` (NEW), `docs/knowledge-base/infrastructure/iac-phase1-migration-runbook.md` (rollback pointer → `deployment.md` §Rollback), `docs/guides/operations/deployment.md` (§Rollback single-page note), `apps/backend/scripts/`, `preview.yml`, `railway.toml`, `terraform/main.tf` all resolve in the working tree; the retired `docs/runbooks/backend-rollback.md` + `rollback-rehearsal-24-17.md` are referenced nowhere (removed)
- [x] Last Updated / Last Update date is current (same commit as the edit) — bumped to 2026-08-25 on every leaf touched
- [x] **Truth-check corrections / flags:** (1) the hardening names are now **verified against the working tree** (Backend Engineer's C1–C3 landed): `HEALTH_PROBE_EXTERNAL=false` probe gate (`GeminiService`/`AudioService` short-circuit), per-PR `JWT_SECRET`/`JWT_REFRESH_SECRET`/`APP_ENV` upserts + `JwtService` `env` claim (`process.env.APP_ENV ?? "production"`), `GCP_PREVIEW_SA_KEY` GH secret, preview SA `preview-service`, sandbox bucket `pinyin-pal-preview-data`, Neon `parent_branch: demo`; (2) `terraform/README.md` now exists (C3) — verified; (3) the 24-16 forward-pointers read "deployment setup — PR env scope" and remain consistent with this supersede; (4) no tool/framework named that isn't in `package.json` (Vitest-only; `express-rate-limit`/NestJS verified)

## Testing Implementation

This is a **deployment + hardening + verification story** — its "tests" are the quality gates (run at close) plus the deployment/verification behaviors: the PR-env smoke, the C1 unit tests (env claim + probe gate), and the post-flip prod smoke + T+0→24h watch window (the T+0 rollback-decision point).

| Gate              | Command                                               | Expectation                                                                                                          |
| ----------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Typecheck         | `npx tsc --noEmit` (backend) / root `tsc -b --noEmit` | 0 errors                                                                                                             |
| Build             | `npm run build`                                       | exit 0 (both `dist/nest/main.js`; Express `dist/app/index.js` not emitted)                                           |
| Full unit suite   | `npm run test:full`                                   | green (52 files / 609 at 24-15 baseline)                                                                             |
| Integration suite | `npm run test:integration`                            | green (23 files / 262 at 24-15 baseline)                                                                             |
| Lint              | `npm run lint` (eslint)                               | 0 errors                                                                                                             |
| Module boundaries | `npm run check:module-boundaries`                     | green                                                                                                                |
| System map        | `npm run check:system-map`                            | green (map regen owned by the Backend Engineer — runbooks branch removed + `env-isolation.md` purpose field updated) |
| Doc links         | `scripts/check-doc-links.mjs`                         | edited files only (repo-wide pre-existing rot out of scope)                                                          |

**C1 unit tests (env claim + probe gate):** new tests for the `JwtService` env claim (issued token carries `env: APP_ENV`; a token minted under a different `APP_ENV` is rejected at verify time) and the `HEALTH_PROBE_EXTERNAL=false` probe gate (Gemini/TTS `healthCheck` returns `false` without calling the external client).

**Behavioral verification (the story's deployment + safety claims):**

- **PR-env smoke** (`preview.yml` job via `apps/backend/scripts/pr-smoke.mjs`) — asserts health + service booleans, auth register/login/refresh/me, the guest phase-gate shape and a 4xx envelope on the PR URL; green is a merge precondition.
- **R1/R2 upserts verified** — the per-env JWT/probe/preview-SA/sandbox upserts confirmed live on the PR env (second merge-gate condition).
- **Post-flip prod smoke + T+0→24h watch window** — the merged `main` deploys to Railway; the post-flip smoke + watch is green or the owner executes the **T+0 rollback-decision** (redeploy-previous or `git revert`, per `deployment.md` §Rollback); R1 prod JWT rotation at T+0; the result is recorded at close.
- **Post-merge bugs → hotfix on main (out of scope)** — any defect surfaced by the post-flip smoke/watch is handled as a hotfix on `main` after the release (separate concern, not in 24-17).
- **Owner external validations** — recorded as AC gates (the 7 items in `env-isolation.md` §5).
