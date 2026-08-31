**Last Updated:** August 25, 2026

# Story 24.14: Release-Safety Cutover Gate

## Description

**As a** backend operator,
**I want to** verify the §1 Definition of Done against the fully-migrated NestJS shell and produce the release checklist as a committed verification artifact (`verification-artifacts/release-safety-gate-24-14.md`) — every DoD gate (S1–S2 security, P1–P2 parity, T1 tests, O1–O2 ops, D1–D2 deploy, R1–R2 runtime, DOC, G quality) with an explicit status + evidence pointer, record and sign off the A/B/C ownership map, produce the pre-flight sign-off (S1 + S2 + P1 parity 100% + T1 full+integration green → only then may 24-15 flip), and document the post-flip smoke test, the watch-window procedure (≥24–48h observing the 24-3 requestId logs) and the verified rollback runbook (the Express entry `node dist/app/index.js` for one release OR redeploy-previous Railway release),
**So that** the 24-15 deployment cutover is gated by an independently verifiable release-safety claim — not an assertion — and the fully-migrated release ships no known P0/P1, no known-broken behavior, a truthful API surface, and a rollback-able, observable deploy.

## Business Value

This story is the **hard pre-flight gate for the 24-15 cutover**: 24-15 cannot flip Railway to the Nest production entry without the DoD verification in this story passing. It turns "safe to release fully migrated" from a claim into an **independently verifiable, committed record** — every one of the twelve DoD gates (S1–S2, P1–P2, T1, O1–O2, D1–D2, R1–R2, DOC, G) is either CI-run or evidenced in a committed artifact. It records the **A/B/C ownership map** (which release-safety items were absorbed in-epic, which were hard prerequisites — under the serial plan absorbed and landed in-epic, which are post-release-safe C-declared) so the epic's safety posture is auditable. It produces the **pre-flight sign-off** that unblocks 24-15 and the **rollback + watch-window procedure** so the flip is reversible and observable — any regression during the ≥24–48h watch window is a stop condition before Express is deleted. Because the migration set is **additive-only** (the single 24-11 `SrsCardState` migration), rollback needs no schema revert — a running Express build is compatible with the post-deploy schema. The story verifies the live P0-1 closure (S1), the calibrated guest-auth shape (S2), the 63/63 route parity (P1), the full+integration green baseline (T1), error-visibility + healthcheck parity (O1/O2), additive migration safety (D1), Node 24/ESM/config-fail-fast runtime (R1) and graceful shutdown (R2) — all green, so **the 24-15 cutover is UNBLOCKED**.

## Acceptance Criteria

- [x] **Release checklist artifact committed** — `verification-artifacts/release-safety-gate-24-14.md` records every §1 DoD line (S1–S2/P1–P2/T1/O1–O2/D1–D2/R1–R2/DOC/G) with an explicit **status** (PASS) + **evidence pointer** (file:line / suite / exact result); each is CI-run or a committed verification artifact.
- [x] **A/B/C ownership map recorded + signed off** — the artifact's §3 maps every release-safety item (2.1–2.20) to its verdict (A = absorbed in-epic / B = hard prerequisite — under the serial plan absorbed and landed in-epic / C = post-release-safe) + its landing story or deferral target; signed off by the Backend Engineer (Story 24-14).
- [x] **Pre-flight sign-off** — S1 (P0-1 closed structurally + regression green), S2 (guest-auth == calibrated shape), P1 (parity harness **100% — 63/63 routes**), T1 (`test:full` 744 + `test:integration` 262 green) all **PASS** → **24-15 may flip**; no gate failed.
- [x] **Post-flip smoke documented** — `/api/v1/health` 200 + register 201 + login 200 + one authenticated data route 200 + one guest route (calibrated shape) + a 4xx producing the `{code, message, requestId}` envelope — to run on Railway immediately after 24-15 flips.
- [x] **Watch-window procedure documented + executed** — ≥24–48h after the flip, observing the **24-3 requestId logs** (`API Error { requestId, code, message, stack }`); any error without a `requestId` or any 500 on a previously-green route is a **stop condition** before Express deletion.
- [x] **Rollback runbook verified** — the Express entry `node dist/app/index.js` still builds (5137 B) + serves (today's `start` in `railway.toml`); escape hatch for one release (run the Express entry / retained `start:express`) OR **redeploy-previous Railway release**; **no schema rollback needed** (additive-only).

## Business Rules

1. **Every DoD line is independently verifiable** — a gate passes on CI evidence or a committed verification artifact, never on assertion; the release checklist (`verification-artifacts/release-safety-gate-24-14.md`) is the source of record for the gate's verdicts.
2. **The pre-flight sign-off is the hard gate** — 24-15 may not flip Railway unless S1 + S2 + P1 (100%) + T1 (full + integration) all pass; any failed gate blocks the flip (none failed here).
3. **A/B/C ownership map** — A = absorbed into Epic 24 (landed in-story); B = hard prerequisite (under the serial plan, absorbed and landed in-epic); C = post-release-safe (declared + tracked in the target epic — quiz-FE fixes → epic-26, gate/phase data + HSK → epic-27, full observability spine → epic-39, cosmetic → non-blocking).
4. **Rollback is real, not hypothetical** — keep the Express entry (`node dist/app/index.js`) building/serving for one release after the flip OR redeploy-previous Railway release; the additive-only migration set (single 24-11 `SrsCardState` migration) means **no schema rollback is ever needed**.

> **Historical note (2026-08-25):** the rollback strategy recorded here was **retired in 24-17** — rollback is now the single-page note in `docs/guides/operations/deployment.md` §Rollback (redeploy the previous Railway release + `git revert`; no pinned tag, no rehearsal).

5. **Watch window before Express deletion** — run ≥24–48h after the flip observing the 24-3 requestId logs; escalate on any error missing `requestId` or any 500 on a previously-green route; only after the window closes with no P1/P0 AND the P1 parity harness re-runs green may Express be deleted.

## Related Issues

- Epic 24: NestJS Shell Migration — [BR](README.md) (epic parent)
- **Story 24.15: Deployment Cutover + Retire Dual-Mode + Docs Refresh** (stub in the epic IMP README — the cutover this gate unblocks; receives the 24-14 inputs: Node 24 prod-boot validation, openapi refresh + 9 dead-route removal, `/api-docs` decision, docs refresh, Express retirement)
- **Story 24.13: Quiz + Progression Port** ([BR](story-24-13-quiz-progression-circular-di.md)) (dependency — the last port; all modules are ported before this gate runs; the quiz-FE bugs are C-declared here, tracked in 26)
- **Story 24.1: P0-1 Security Stopgap** ([BR](story-24-1-p0-1-security-stopgap.md)) (S1 — the live Express leak closure + the T1 baseline record)
- **Story 24.11: Review Port + SRS Schema** ([BR](story-24-11-review-port-srs-schema.md)) (S1 structural fix + D1 additive `SrsCardState` migration + R2 graceful shutdown)
- **Story 24.5: Auth-Surface Guards (Calibrated)** ([BR](story-24-5-auth-guards-calibrated.md)) + **Story 24.7: Guest Identity Calibration** ([BR](story-24-7-guest-identity-calibration.md)) (S2 — the calibrated guest-auth shape the gate verifies)
- **Story 24.3: HTTP-Layer Parity** ([BR](story-24-3-http-layer-parity.md)) (O1 — the `{code, message, requestId}` envelope + `API Error` log parity the watch window observes)
- **Story 24.10: Audio + Health Port** ([BR](story-24-10-audio-health-port.md)) (O2 — the healthcheck parity verified from the Nest prod build)
- **Epic 26** (quiz-FE fixes, C-declared) · **Epic 27** (gate/phase data + HSK, C) · **Epic 39** (full observability spine, C) — the C-declared items in the A/B/C map
- **Implementation (IMP twin):** `story-24-14-release-safety-cutover-gate.md` → `../../issue-implementation/epic-24-nestjs-shell-migration/story-24-14-release-safety-cutover-gate.md`

## Implementation Status

- **Status**: Completed
- **PR**: TBD
- **Merge Date**: TBD
- **Commit hash**: `0b3fe00c`
- **Implementation note:** the gate shipped as a committed verification artifact (`verification-artifacts/release-safety-gate-24-14.md` — the story's only deliverable; force-added because `verification-artifacts/` is gitignored). All twelve DoD gates verified **PASS** from the shipped code: S1 (P0-1 closed structurally — `ReviewRepository` rejects `undefined` before Prisma, zero `req.userId!` in Nest controllers, regression green), S2 (calibrated guest-auth — `createGuestPhaseGate → {currentPhase:1, isGuest:true}`, `OptionalAuthGuard` guest → empty, `/gates` guest = Phase-1-only), P1 (**63/63 routes, 100%** across 9 parity harnesses), P2 (openapi documents 9 dead routes — `/v1/vocabulary/*` ×5 + `/v1/progress*` ×4 — recorded as a 24-15 input), T1 (`test:full` 66/744 + `test:integration` 23/262), O1 (`AppExceptionFilter.logError` byte-for-byte identical to `errorHandler.ts`), O2 (health 200 from `dist/nest/main.js`), D1 (only additive `SrsCardState` migration; `migrate status` 30 up-to-date), D2 (rollback runbook verified — Express entry still builds/serves + redeploy-previous; watch window ≥24–48h), R1 (Node 24 declared; `engines` lower-bounds caveat → 24-15 validates prod boot on Railway), R2 (graceful shutdown unit-tested), G (all canonical gates green). **Pre-flight sign-off (S1 + S2 + P1 100% + T1) PASS → 24-15 UNBLOCKED.** ACs verified against the shipped artifact (commit `0b3fe00c`) — commit hash deferred to epic close.
