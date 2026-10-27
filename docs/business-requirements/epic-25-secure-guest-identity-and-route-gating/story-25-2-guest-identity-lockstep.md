---
purpose: Guest identity lockstep — one server-computed guest gate, one cache key, shell consumes it
status: planned
last-verified: 2026-10-27
type: story
---

# Story 25.2: Guest Identity Lockstep — One Guest Gate, One Cache Key

**Last Updated:** October 27, 2026

## Description

**As a** guest,
**I want to** have the backend and the shell agree that I am Phase 1 with `isGuest: true` — and to stop believing that the moment I sign in,
**So that** the locks, badges and messages I see always match my real state.

## Business Value

Guest identity is the contract the whole demo funnel rests on. Two failure shapes cost real conversion:
(1) the shell inventing a phase the server never granted (a guest seeing "all unlocked", then hitting a
contradiction), and (2) a **stale guest gate** surviving login thanks to a cache keyed without identity
(the §7.2 staleness), so a newly registered learner keeps seeing guest messaging. One server-computed
answer — `createGuestPhaseGate()` → `{ currentPhase: 1, isGuest: true }` — consumed by every surface,
keyed by identity, evicted on auth change, removes both.

## Acceptance Criteria

- [ ] `createGuestPhaseGate()` returns exactly `{ currentPhase: 1, isGuest: true }` (plus its normalized timestamps) — asserted by unit test on the shared constant.
- [ ] `GET /v1/progression/gates` and `GET /v1/progression/phase-gate` return **agreeing** guest payloads for the same anonymous identity, proven by an integration test that requests **both** endpoints (not by two independent unit assertions).
- [ ] **One source, not two literals.** `getGates`'s hand-written guest branch (`progression-nest.controller.ts:173-180`, six hardcoded `"Guest — Phase 1 only"` strings) is derived from the same shared answer as `getPhaseGate` (`createGuestPhaseGate()` or a shared builder), so the two payloads cannot drift.
- [ ] **The frontend gate cache is identity-scoped and evicted on auth change.** Today the only gate cache is localStorage keyed by identity _class_ (`phaseGate:user` / `phaseGate:guest`, `phaseGateService.ts:19`) and `phaseGate:user` is never cleared, so user A's gate can be served to user B on the same device while a fetch is failing. Logout (and login) must clear it, or the key must include the user id — proven by a test: user A gate → logout → user B login → gate fetch fails → B never sees A's `currentPhase`.
- [ ] Tests exist for the frontend gate path (`usePhaseGate` + `phaseGateService` have **no** test file today): one fetch path, one key, refetch on identity change.
- [ ] The frontend shell derives the Learn phase from the server gate only: `AppLayout` has no hardcoded phase fallback that grants a **guest** more than Phase 1, and no shell component synthesises `isGuest` locally. (An authenticated user's `Infinity` fallback while the fetch is in flight is a documented deliberate exception — keep it.)
- [ ] Page-level phase fallbacks are clamped or documented: `GrammarPage.tsx:33` (`DEV ? 4 : 2`) and `RadicalsPage.tsx:82` (`DEV ? 3 : 1`) must not present a guest with a phase above 1, or must be recorded as card-badge-only signals with the rationale.
- [ ] Affected backend + frontend suites pass; `npm run typecheck --workspace=@mandarin/backend` passes.

## Business Rules

1. **The server owns guest identity.** `isGuest` and `currentPhase` are computed once, server-side; clients consume, never infer.
2. **Identity is the cache key.** A gate cached for one identity is never served to another; login/logout invalidates.
3. **Guests are Phase 1, never more.** A failed or in-flight gate fetch must not unlock content the server has not granted.

## Related Issues

- **Epic 25: Secure Guest Identity & Route Gating** _(link to `../epic-25-secure-guest-identity-and-route-gating/README.md`)_ (Parent)
- **Story 24.7: Guest Identity Calibration** _(link to `../epic-24-nestjs-shell-migration/story-24-7-guest-identity-calibration.md`)_ (Predecessor — landed the guest gate shape)
- **Story 25.1: P0-1 Guest Isolation** _(link to `story-25-1-optional-auth-srs-guest-isolation.md`)_ (Sibling — same epic, lands first)
- **Story 25.3: A25 Learn Un-Gating** _(link to `story-25-3-learn-ungating-browse-guest-state.md`)_ (Consumer — reads this contract)

## Implementation Status

- **Status**: Planned
- **PR**: TBD (epic PR)
- **Merge Date**: TBD
- **Key Commit**: TBD
