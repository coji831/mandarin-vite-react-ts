---
purpose: Verify both optionalAuth TTS surfaces are cache-first-free for guests; quota mechanics handed to epic-29
status: planned
last-verified: 2026-10-27
type: story
---

# Story 25.4: Guest Cost Surface — TTS Cache-First Verification

**Last Updated:** October 27, 2026

## Description

**As the** product owner,
**I want** proof that the two anonymous TTS surfaces serve cached audio for free,
**So that** a guest demo cannot become an unbounded vendor bill.

## Business Value

Guests can reach two `optionalAuth` audio surfaces — `POST /v1/tts` and
`POST /v1/readers/passages/:id/audio`. TTS generation is a **real vendor cost** (L5), and guest access is
unbounded by design. BM-1's resolution splits the problem in two: **this epic proves the read/cache path**
(a GCS cache hit costs nothing and is safe for guests), and **epic-29 owns the generated-audio quota**
(server-side counter, 2 generated calls/day per guest, enforced by the same Redis counter + `AICallLog`
machinery as the demo quotas). Building a TTS-only counter here would be throwaway machinery, so this
story produces the **evidence** epic-29 sizes its counter against: which surface actually generates on a
miss, and what that path costs today.

## Acceptance Criteria

- [ ] `POST /v1/tts`: a guest (no token / invalid token) is **never** 401'd, and the response shape is unchanged (`{ audioUrl, cached }`) — asserted by test.
- [ ] `POST /v1/tts`: on a cache HIT the response is `{ cached: true }` and the synthesis path is **not invoked** (spy/assert on the generator), proving the guest read is free.
- [ ] `POST /v1/readers/passages/:id/audio`: the same two assertions hold for the guest path (no 401; cache hit returns a signed URL without generation).
- [ ] The cache-MISS path on both surfaces is documented as the **billable generated path**, explicitly assigned to epic-29's counter + `AICallLog` + circuit breaker — with the statement that no quota counter ships in this epic.
- [ ] Per-surface evidence (route, guard, cache lookup, signing, generation call, observed test log) is captured in `verification-artifacts/epic-25-tts-guest-cost-surface.md` **and** condensed into a committed summary in this story's implementation doc — `verification-artifacts/` is gitignored by design (`verification-artifacts/README.md`), so the impl-doc summary is the record that survives on `main`.
- [ ] Backend audio + readers suites pass; `npm run typecheck --workspace=@mandarin/backend` passes.

## Business Rules

1. **Cache-first is free.** A cache hit is a read, not a generation — it costs nothing and is always allowed for a guest.
2. **A miss is billable and bounded downstream.** Generated audio on a guest request is the path epic-29 counter-gates; until then the exposure is documented, not hidden.
3. **No duplicate quota machinery.** No TTS-specific counter ships in epic 25 (L5 unification, epic-29 M2).

## Related Issues

- **Epic 25: Secure Guest Identity & Route Gating** _(link to `../epic-25-secure-guest-identity-and-route-gating/README.md`)_ (Parent)
- **Story 24.10: Audio + Health Port** _(link to `../epic-24-nestjs-shell-migration/story-24-10-audio-health-port.md`)_ (Predecessor — calibrated the `optionalAuth` TTS surface)
- **Story 25.1: P0-1 Guest Isolation** _(link to `story-25-1-optional-auth-srs-guest-isolation.md`)_ (Sibling — the other anonymous-surface security story)
- **Epic 29** (Cost Gateway: quota counters + circuit breaker) (Successor — owns the generated-audio quota mechanics)

## Implementation Status

- **Status**: Planned
- **PR**: TBD (epic PR)
- **Merge Date**: TBD
- **Key Commit**: TBD
