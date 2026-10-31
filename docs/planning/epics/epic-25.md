---
purpose: "Secure Guest Identity & Route Gating"
status: ratified
last-verified: 2026-10-31
type: planning
---

# Epic 25 — Secure Guest Identity & Route Gating _(Phase A)_

> **Superseded in part by A25 (amended 2026-10-27).** The body below is the original 2026-08-17 plan. §2026 Audit
> Amendments **A25** ("re-bound the gate scope") removed the six phase-gated Learn routes from this epic's
> boundary and moved the guest-state region out of `AppLayout`: Learn is "no lock" for every visitor and phase
> is sequencing metadata only. Where the body below still says "gate every Learn route", read it as historical
> intent. As shipped: P0-1 isolation pinned, one guest gate source, Learn un-gated, TTS cost surface verified.

**Goal:** Make guest mode safe and correct — close the P0-1 cross-tenant SRS leak, land the guest identity shape (`isGuest` + `currentPhase:1`) in lockstep across backend and shell, gate every Learn route _(A25: reversed — Learn routes ship **un-gated**)_, and verify the two `optionalAuth` TTS surfaces are guest-governed.

**Boundary — IN:**

- **P0-1**: repository-level rejection of `undefined` userId on all `optionalAuth` SRS reads; review-GET guest guard (guest → session-local scope, never another user's rows).
- **Guest identity lockstep**: `createGuestPhaseGate → { currentPhase:1, isGuest:true }`; `AppLayout :4 → isGuest` removal; `getGates`/`getPhaseGate` guest branch unified (single source, one cache key, cleared on auth change — kills the §7.2 staleness); `ProgressionController.getGates` guest branch.
- **Route gates**: ~~data-driven `LEARN_REQUIRED_PHASE` for all 6 Learn routes, closing the radicals/phonetic-clusters URL bypass~~ — **A25: reversed.** No Learn route is gated and the derived `LEARN_REQUIRED_PHASE` map was deleted with its last consumers; `LEARN_NAV_ITEMS[].phase` survives as sequencing metadata only. The radicals/phonetic-clusters "URL bypass" is closed by removing the walls, not by adding gates.
- **Guest cost-surface verification**: the two `optionalAuth` TTS surfaces (`POST /v1/tts`, passage-audio) resolved as **cache-first-free for guests**; generated-audio quota mechanics documented as epic-29's.

**Boundary — NON-GOALS (OUT):** guest CTA/copy + value-moment upgrade prompts → epic-26 (pattern reused in 31/36); demo-quota server counters + circuit breaker + cross-feature budget → epic-29; generated-TTS quota mechanics → epic-29; practice-lane calibration/quiz formats/review wiring → 26/28; soft-readiness gate→recommendation UI → epic-40.

**Rough AC (6):**

1. BE integration: every `optionalAuth` SRS read with an anonymous caller returns 401 (or guest-scoped empty) — the repository rejects `userId === undefined` (no Prisma ignore-undefined path). **[P0-1]**
2. BE contract: `createGuestPhaseGate` returns `{ currentPhase: 1, isGuest: true }`; `getGates` and `getPhaseGate` agree for the same guest identity under one cache key (evicted on auth change).
3. FE e2e: with `isGuest` true, the shell renders the Phase-1 shape _(A25: the shell renders chrome + `<Outlet />` only; there is no guest region in it)_; ~~direct navigation to any higher-phase Learn route shows the gate screen (radicals/phonetic-clusters bypass closed)~~ — **A25: reversed. Direct navigation to any of the six Learn routes renders the page for a guest; there is no gate screen and no redirect.**
4. BE contract: `POST /v1/tts` + passage-audio verified guest-safe — cache-first reads return without a billable generation; any generated path is explicitly counter-gated (mechanics in 29).
5. FE regression: existing guest flows (browse, quiz attempt, review view) still function after the gate change.
6. Release gates green (full suite); new P0-1 security tests committed.

**UI scope:** ~~`UI: guest-mode shell (isGuest badge/banner in AppLayout) + route-gate fallback screen (locked-surface placeholder) — design spec TBD`~~ — **A25: both reversed.** No guest region in `AppLayout` (the guest affordance lives on the Browse dashboard, `DashboardGuest`) and no route-gate fallback screen exists. _(CTA/copy deliberately not here — see 26.)_

**Dependencies:** none (first post-24 epic). **Lands on NestJS after Epic 24 completes (serial)**; P0-1 + guest-auth semantics are absorbed into Epic 24 (24-1 stopgap + 24-7 identity + 24-11 structural), so epic-25's residual = FE route gating + guest-shell UI + TTS-surface verification on Nest.

**Close criteria:** story BRs + impls (25-1 P0-1 guard, 25-2 guest-gate lockstep, 25-3 Learn un-gating + Browse-only guest state, 25-4 TTS cost surface) with Status/Last-Update + all ACs boxed; the guest cost-surface evidence in `verification-artifacts/epic-25-tts-guest-cost-surface.md` (local) plus its committed condensation in the 25-4 impl doc; Tier 1 + Tier 2 gates (backend type-check, full suite, backend-audit skill).

---

---

Back to the index: [Epic Plan 25-40](../epics-25-40.md) | sequencing: [Sequencing Summary](../epics-25-40.md#sequencing-summary)
