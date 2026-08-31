---
purpose: Env-isolation verification — separated-vs-shared matrix, R1–R6 risks, and the 7 owner verification items for the Epic 24 release
status: active
last-verified: 2026-08-25
type: guide
audience: backend
tags: epic-24, env-isolation, deployment, hardening, release
---

# Environment Isolation — Epic 24 Release Verification

**Last Updated:** August 25, 2026
**Purpose:** Committed artifact of the env-isolation verification for the Epic 24 NestJS production release (story 24-17, Workstreams C–E) — the **"Phase-2-delivered" evidence** of what was hardened in 24-17 vs. what is deferred or accepted.

---

## 1. Purpose

This guide is the committed extraction of the env-isolation verification that hardened the Epic 24 release. It records:

1. The **separated-vs-shared matrix** — which surfaces are per-environment and which are shared across prod/preview.
2. The **R1–R6 risk table** — every shared-surface risk identified, with its decision and placement.
3. The **placement decisions** — what landed in 24-17, what is non-blocking, what is deferred to Phase-2, what is doc-only, and what is accepted.
4. The **7 owner external-verification items** — the human checks (owner = release captain) that gate the release.

It is written from the approved 24-17 plan (2026-08-25) and cross-references the story docs, the IaC runbook, and the deployment guide.

## 2. Separated vs. Shared Matrix

| Surface             | Status                     | Detail                                                                                                                                                                                                                            |
| ------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend deploy      | **Separated**              | Railway prod (`main`) vs. per-PR preview (`pr-*` environments); the PR env runs the same `railway.toml` pipeline (build → `db:migrate:deploy` → `node dist/nest/main.js` → healthcheck `/api/v1/health` ON_FAILURE ×10, Node 24). |
| Frontend deploy     | **Separated**              | Vercel prod vs. preview deployments; `VITE_API_URL` is env-scoped.                                                                                                                                                                |
| Database            | **Separated**              | Neon prod vs. per-PR preview branch (copy-on-write, prod-schema copy + delta); preview branch parent = prod (owner verification item 3).                                                                                          |
| Rate limiting       | **Separated**              | Per-env rate-limit state (per-instance; no cross-env coupling).                                                                                                                                                                   |
| Migrations          | **Separated**              | `db:migrate:deploy` runs per-env against its own DB branch; a migration failure blocks that env's deploy (no rollback trigger).                                                                                                   |
| **JWT secrets**     | **Shared → hardened (R1)** | Prod and preview shared one `JWT_SECRET`/`JWT_REFRESH_SECRET`. 24-17: per-env secrets (`openssl rand` per PR env) + `JwtService` env claim + prod rotation at T+0.                                                                |
| **GCP credentials** | **Shared → hardened (R2)** | Preview inherited prod `GCS_CREDENTIALS_RAW`/`GCS_BUCKET_NAME`. 24-17: per-env GCP → preview SA + sandbox bucket (preview can no longer touch prod GCS).                                                                          |
| **Redis**           | **Shared → deferred (R5)** | Preview consumes the shared Upstash Redis **keyspace** (`mandarin:` not env-scoped); read-only where possible; env-scoped keyspace / dedicated preview Redis deferred to Phase-2 (R5, matters epics 29+).                         |
| **CORS wildcards**  | **Shared → deferred (R4)** | Wildcard origins (`*.vercel.app` + `*.up.railway.app`) shared across environments; deferred Phase-2 (GCS half permanently infeasible).                                                                                            |
| **Health probe**    | **Shared → gated (R2)**    | `HEALTH_PROBE_EXTERNAL=false` probe gate — the probe's Gemini/TTS dependency checks short-circuit and report `false` (no external calls, no dependency-state leak); Railway's healthcheck still gets 200.                         |

## 3. R1–R6 Risk Table

| #   | Risk                                                                                                                                                  | Severity | Decision / Placement                                                                                                                                                                                                                                                                                                 |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | **Shared JWT secrets across environments** — a preview env can mint prod-valid tokens; a leaked preview secret is valid in prod.                      | High     | **In 24-17** — per-env `JWT_SECRET`/`JWT_REFRESH_SECRET`/`APP_ENV` upsert (`openssl rand` per PR env) + `JwtService` env claim (tokens carry the issuing env) + prod rotation at T+0 (one re-login — accepted).                                                                                                      |
| R2  | **Shared GCP credentials + externally-reachable health probe** — a preview env holds prod GCS admin creds; the probe leaks dependency state publicly. | High     | **In 24-17** — `HEALTH_PROBE_EXTERNAL=false` probe gate (Gemini/TTS health checks short-circuit, report `false`) + per-env GCP → preview SA (`preview-service`) + sandbox bucket `pinyin-pal-preview-data` (all three `*_CREDENTIALS_RAW` + `GCS_BUCKET_NAME` upserted from the `GCP_PREVIEW_SA_KEY` GitHub secret). |
| R3  | **Neon preview branch parent ≠ prod** — a branch off the wrong parent migrates the wrong schema.                                                      | Medium   | **In 24-17, non-blocking** — Neon `parent_branch: demo` (a `demo` branch cloned as the preview base — create/seed, owner action); fallback to the prod parent if the demo branch is not ready.                                                                                                                       |
| R4  | **CORS wildcard origins** — `*.vercel.app` + `*.up.railway.app` wildcards shared across environments.                                                 | Low      | **Deferred Phase-2** — CORS origin tightening; the GCS half is permanently infeasible (GCS CORS config cannot be env-scoped the same way); documented here, not implemented in 24-17.                                                                                                                                |
| R5  | **Shared Redis keyspace** — the `mandarin:` cache keyspace is not env-scoped; preview reads/writes the prod cache keyspace.                           | Med      | **Deferred Phase-2** — env-scoped keyspace / dedicated preview Redis; matters once epics 29+ (tracking/state) land; documented here, not implemented in 24-17.                                                                                                                                                       |
| R6  | **Migrations auto-run on prod, no backup automation** — `db:migrate:deploy` runs on merge; a bad migration could lose data.                           | Med      | **In 24-17, doc-only** — backup gate documented in `deployment.md` (Neon backup console-side, not automated); enforced as a manual release check.                                                                                                                                                                    |

## 4. Placement Decisions

- **R1 + R2 → in 24-17** (Workstream C): code deltas (the `JwtService` env claim + the probe gate + unit tests) + CI upserts (`preview.yml` per-env JWT / probe flag / preview SA + sandbox bucket).
- **R3 → non-blocking in 24-17** (Workstream C): the Neon `demo` parent branch (`parent_branch: demo`) — owner action to create/seed; fallback if not ready.
- **R4/R5 → deferred to Phase-2**: CORS wildcard origins (`*.vercel.app` + `*.up.railway.app`) — GCS half permanently infeasible; shared Redis keyspace (`mandarin:` not env-scoped) — matters epics 29+ (documented here, not implemented in 24-17).
- **R6 → doc-only in 24-17**: the backup gate lands in `docs/guides/operations/deployment.md` (Neon backup console-side; not automated).
- **Phase-2 master doc deferred** (not authored in 24-17).

## 5. Owner External-Verification Items (7)

The owner (release captain) verifies the following before/around the merge. Items 5–7 are the **new upsert/secret/demo checks** added by the approved final plan.

> **Two-fold merge gate:** the merge PR gates on `preview.yml` smoke green (machine) + the **R1/R2 upserts verified** (human) — the former Layer-1 rollback rehearsal leg was dropped (the rollback model was retired in 24-17). The post-flip prod smoke + T+0→24h watch remains the **T+0 rollback-decision point**: owner judgment → redeploy the previous Railway release or `git revert`, per `deployment.md` §Rollback.

1. **Railway/Neon secrets/vars present** — `RAILWAY_API_TOKEN`, `NEON_API_KEY`, `RAILWAY_PROJECT_ID`, `RAILWAY_BACKEND_SERVICE_ID`, `NEON_PROJECT_ID`.
2. **PR deployments + overrides** — Railway PR deployments enabled; no conflicting Preview environment overrides; Vercel preview `VITE_API_URL` resolves.
3. **Neon preview branch parent = prod** — the preview branch migrates a prod-schema copy, not a stale branch.
4. **Branch protection** — `smoke` added as a **required status check**.
5. **Terraform pre-apply + secret (NEW)** — owner runs `terraform apply` on the branch BEFORE the release PR (C2b live) and stores `GCP_PREVIEW_SA_KEY` as a GitHub secret.
6. **Per-env upserts verified live (NEW)** — the preview env carries per-PR `JWT_SECRET`/`JWT_REFRESH_SECRET` (`openssl rand -hex 48`) + `APP_ENV=pr-<n>`, the GCP preview SA key (`GCP_PREVIEW_SA_KEY`) mapped to all three `*_CREDENTIALS_RAW` + `GCS_BUCKET_NAME` → sandbox bucket `pinyin-pal-preview-data` (`GCP_PREVIEW_BUCKET_NAME` var), and `HEALTH_PROBE_EXTERNAL=false`.
7. **Neon demo branch (NEW)** — the Neon `demo` parent branch (`parent_branch: demo`) created/seeded (non-blocking; fallback if not ready).

## 6. Cross-References

- **Story 24-17:** [BR](../../business-requirements/epic-24-nestjs-shell-migration/story-24-17-deployment-setup-pr-env.md) · [IMP](../../issue-implementation/epic-24-nestjs-shell-migration/story-24-17-deployment-setup-pr-env.md) (the story this artifact belongs to)
- **Deployment guide:** `docs/guides/operations/deployment.md` (NestJS deploy, single-page rollback note **§Rollback**, **C6 backup gate**)
- **IaC runbook:** `docs/knowledge-base/infrastructure/iac-phase1-migration-runbook.md` (Phase-1 IaC; NestJS refresh; per-env isolation → `preview.yml`)
- **IaC overview:** `terraform/README.md` (additive preview SA + sandbox bucket; manual branch apply + `GCP_PREVIEW_SA_KEY`)
- **Workflow + smoke:** `.github/workflows/preview.yml` + `apps/backend/scripts/pr-smoke.mjs`
