---
purpose: Epic 25 implementation — data-driven Learn route gating (all 6 routes) + guest-shell UI + TTS guest-cost verification (residual after epic-24 absorption)
status: completed
last-verified: 2026-09-05
type: epic
---

# Epic 25: Secure Guest Identity & Route Gating — Implementation

**BR Reference:** `docs/business-requirements/epic-25-secure-guest-identity-and-route-gating/README.md`

**Status:** ✅ Completed — the Epic 25 Phase-A residual is implemented + verified in the working tree on branch `solar-v5-wire` (slug `epic-25-secure-guest-identity-and-route-gating`): one data-driven `LearnRouteGate` + `LEARN_ROUTE_CONFIG` gates all six Learn routes (`foundations`/`radicals`/`grammar`/`phonetic`/`readers`/`chengyu`) from `LEARN_NAV_ITEMS` and renders the shared `LockedSurface` gate screen on below-phase direct nav (radicals + phonetic-clusters URL bypass closed); the guest shell ships the passive Guest badge (`AppTopBar` `isGuest`) + `LockedSurface` (S1/S2); both `optionalAuth` TTS surfaces (`POST /v1/tts`, passage-audio) are verified cache-first-free for guests with **no backend change**; generated-audio quota mechanics recorded as epic-29's. Local gates green: `tsc -b --noEmit` 0 errors · 8 affected test files / 18 tests pass · `check:registry-stories` 36/36 · no NEW `design-audit` errors. **Story docs:** `25-1` BR + IMP authored and closed; commit hash filled at commit time (COMMIT GATE — final merge pending the Code Reviewer verdict + owner commit gate). Verification in `verification-artifacts/epic-25-route-gating-verification.md`.

**Last Update:** September 5, 2026

## Technical Overview

Epic 25's residual Phase-A scope (after Epic 24 absorbed the P0-1 leak + guest-identity lockstep into 24-1/24-7/24-11) is **frontend-only + a docs verification**. The Learn router's gate becomes data-driven and total (all six routes, no URL bypass), the guest shell gains a passive identity badge and a locked-surface gate screen, and the two `optionalAuth` TTS read surfaces are verified guest-safe (cache-first-free) against the shipped Nest controllers — no backend code change. The guest identity shape `{currentPhase: 1, isGuest: true}` is **not re-implemented** here; it was landed by Epic 24 story 24-7 and is consumed via `usePhaseGate` / `phaseGate.isGuest`.

## User Stories

### 25-1 — Data-Driven Learn Route Gating + Guest-Shell UI + TTS Guest-Cost Verification

**Goal:** Replace the redirect-only, hardcoded (grammar/readers/chengyu) phase gate with one data-driven `LearnRouteGate` covering all six Learn routes; render the shared `LockedSurface` gate screen on below-phase direct nav; add the passive Guest identity badge (`AppTopBar` `isGuest`); verify both `optionalAuth` TTS surfaces are cache-first-free for guests (docs-only).

**ACs:** all six routes gated from `LEARN_NAV_ITEMS` via `LEARN_ROUTE_CONFIG` (no hardcoded phases); radicals + phonetic-clusters bypass closed (new route-gate tests); gate screen replaces the silent redirect (grammar/chengyu tests updated); `LockedSurface` registered (registry + barrel + stories default/edge) + `AppTopBar.isGuest` Guest badge (no CTA); absorbed-by-24-7 framing explicit; TTS guest-cost verification (both surfaces, no backend change, generated quota → epic-29); gates green (tsc 0, 8 files / 18 tests, registry-stories 36/36, no NEW design-audit errors).

**Status:** ✅ completed — see the [BR](../../business-requirements/epic-25-secure-guest-identity-and-route-gating/story-25-1-route-gating-guest-shell.md) and the [IMP](story-25-1-route-gating-guest-shell.md) (full) for the file-by-file scope, implementation details, challenges, and test inventory. **Commit hash:** TBD (filled at commit time).

## Architecture Decisions

1. **One data-driven route gate (ADR-25-A)** — a single `LearnRouteGate` derives `label` + `requiredPhase` from `LEARN_NAV_ITEMS` by matched route id (via `LEARN_ROUTE_CONFIG`), replacing the per-route hardcoded redirect-only `PhaseGate`. Rationale: the old wrapper omitted radicals + phonetic-clusters (the URL bypass) and duplicated phase numbers vs `learnNav.ts`; sharing one source kills drift between the sidebar lock and the route gate. Alternatives considered: extending the hardcoded wrapper (rejected — duplication), page-level gating (rejected — re-opens drift).
2. **Locked-surface screen over silent redirect (approved)** — below-phase direct nav renders the shared `LockedSurface` ("Unlocks in Phase N.", CTA-free) so sidebar-locked and direct-URL-locked read as one system; the grammar/chengyu tests were updated from redirect to gate-screen assertions in the same change.
3. **Passive Guest badge, no CTA (S1 boundary)** — `AppTopBar` gains a required `isGuest` prop rendering a compact `Badge variant="surface"`; CTA/upsell is Epic 26's `GuestUpsell` (NON-GOAL). `AppLayout` derives `isGuest = !isAuthenticated || !!phaseGate?.isGuest`.
4. **TTS resolution is verification-only (OI-3)** — both `optionalAuth` surfaces verified cache-first-free for guests on Nest (guest `userId` undefined → never 401; cache HIT → `{ cached: true }`, no billable generation); generated-audio quota mechanics deferred to Epic 29 M2 (the unified L5 quota spine). No backend code change.

## Technical Challenges & Solutions

1. **The radicals/phonetic-clusters URL bypass** — the old gate was absent on two of six routes and hardcoded elsewhere. Solved with one data-driven `LearnRouteGate` keyed by `LEARN_NAV_ITEMS` id over `LEARN_ROUTE_CONFIG` (all six routes) — drift impossible, both bypasses closed at once. (Full record in the story IMP.)
2. **Silent redirect → gate screen test ripple** — existing grammar/chengyu route-gate tests asserted the redirect; updated to `LockedSurface` gate-screen assertions in the same change (approved behavior change).
3. **Storybook browser verification interrupted** — state parity asserted via `check:registry-stories` 36/36 + component/integration tests instead; the "story files compile in the frontend workspace" residual is queued for the Code Reviewer in this chain.

### Doc Truth-Check

- [x] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (path + verb copied verbatim): `ttsAudio: "/v1/tts"` (POST), `readersPassageAudioById(id)` → `/v1/readers/passages/{id}/audio` (POST) — verified in the Nest controllers (`audio` + `readers` modules).
- [x] Feature/module/component names verified against `apps/backend/src/modules/` and `apps/frontend/src/features/` — `audio`/`readers` modules exist; Learn page/feature names copied verbatim from `LearnRoutes.tsx` + `learnNav.ts`.
- [x] Data source claims match the backing code — no static-data claims; the TTS cache-first claim is grounded in `AudioSynthesizer.synthesizeOnce` (`modules/audio/services/AudioSynthesizer.ts`) + the parity tests (`apps/backend/tests/integration/nest/audio-health-parity.test.ts`, `readers-parity.test.ts`).
- [x] All relative markdown links resolve (epic BR ↔ epic IMP ↔ story files ↔ `verification-artifacts/` reference).
- [x] Last Updated / Last Update date is current (September 5, 2026 — same commit as the edit).

## Technical Implementation

### Architecture

```
LearnRouteGate (all 6 /learn/* routes, LearnRoutes.tsx) ── LEARN_NAV_ITEMS/LEARN_REQUIRED_PHASE (learnNav.ts) ──> SideNav lock
        │ below-phase → LockedSurface (shared/components, EmptyState lock, CTA-free)
AppLayout.isGuest = !isAuthenticated || phaseGate?.isGuest ──> AppTopBar Guest badge (Badge variant="surface", passive)
        └── consumes usePhaseGate → createGuestPhaseGate() {currentPhase:1, isGuest:true}  (landed 24-7)
TTS read path (verified, unchanged): POST /v1/tts + POST /v1/readers/passages/:id/audio
   OptionalAuthGuard → guest userId undefined → cache-first free {cached:true} (AudioSynthesizer.synthesizeOnce)
   generated-audio quota → epic-29 (no counter here)
```

### Component Relationships

- `LearnRoutes.tsx` (router) — owns `LEARN_ROUTE_CONFIG` + renders every content route through `LearnRouteGate`; wraps the six Learn pages/features (FoundationsPage/RadicalsPage/GrammarPage/PhoneticClustersPage/ReadersPage/ChengyuPage).
- `LockedSurface` (shared component) — presentational gate fallback, data-driven (`label`/`requiredPhase`); no `learnNav`/auth import; registered + barrel-exported.
- `AppTopBar` (shared component) — new required `isGuest` prop → passive Guest badge; stays auth-free (identity threaded via props).
- `AppLayout` (shared layout) — derives `isGuest` from `useAuth`/`usePhaseGate`; passes it to `AppTopBar`.
- Backend — **unchanged**; the audio + readers Nest controllers are the evidence for the TTS guest-cost verification.
