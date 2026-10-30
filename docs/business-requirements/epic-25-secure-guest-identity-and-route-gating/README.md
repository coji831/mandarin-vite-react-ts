---
purpose: Secure guest identity — P0-1 SRS isolation, guest-identity lockstep, A25 Learn un-gating, guest TTS cost surface
status: completed
last-verified: 2026-10-27
type: epic
---

# Epic 25: Secure Guest Identity & Route Gating

## Epic Summary

**Goal:** Make guest mode safe and correct — close the P0-1 cross-tenant SRS leak at the repository boundary, land guest identity (`isGuest` + `currentPhase: 1`) in lockstep across backend and shell, remove the phase walls that BM-1 does not ratify, and prove the two `optionalAuth` TTS surfaces are guest-safe.

**Key Points:**

- **Security first (P0-1).** A guest request carries no `userId`. Prisma silently drops `undefined` where-keys, so any SRS read that passes an optional `userId` straight through returns **every user's rows**. The repository — not the controller — is the last line of defence.
- **One guest identity, one source.** `createGuestPhaseGate()` is the server's single answer for an anonymous caller (`currentPhase: 1`, `isGuest: true`), and `buildGuestGateStatus()` projects that same answer onto the computed-gates shape `getGates` returns. `getGates` and `getPhaseGate` must agree for the same identity, and the frontend consumes that answer instead of inventing its own.
- **No phase walls (A25 — binding).** BM-1 §3 ratifies "Learn — all content … ✅ browse/demo (**no lock**)" and L6 makes the four-phase roadmap "**signals, not walls**". Guest scarcity is session-local progress plus demo quotas, not content walls.
- **Guest state is Browse-only.** The guest affordance belongs on a Browse surface (the dashboard), never in the persistent `AppLayout` chrome that every route inherits.
- **Guest cost is bounded downstream.** TTS reads are cache-first and free for guests; the generated-audio path is counter-gated by the L5 quota machinery that epic-29 owns. This epic proves the first half and hands the second half to 29.

**Status:** Completed

**PR:** #61 (single epic PR) · **Branch:** `epic-25-guest-identity`

**Last Update:** October 27, 2026

> **Scope authority — A25 amendment (binding, overrides the older epic body).**
> `docs/planning/epics-25-40.md` §2026 Audit Amendments **A25** re-bounds this epic. Where an earlier
> reading of Epic 25 said "gate every Learn route" / "data-driven `LEARN_REQUIRED_PHASE` for all 6 Learn
> routes, closing the radicals/phonetic-clusters URL bypass", that framing is **superseded**:
>
> 1. **The six Learn routes are un-gated**, not tightened. `business-model.md` §3 line 54 ratifies
>    "Learn — all content (foundations → chengyu, all 4 stages) | ✅ browse/demo (no lock)" and L6
>    ratifies "priority scoring layer, **not a lock**; phase metadata retained for sequencing".
>    The radicals/phonetic-clusters "bypass" is closed by **removing the wall**, not by adding a gate.
> 2. **The guest-state region moves out of `AppLayout`** (persistent, inherited by every route) and
>    lives on a **Browse-only** surface.
> 3. **P0-1, guest-identity lockstep and guest cost-surface verification stay in scope.**

> **Residual scope measured, not assumed.** Epic 24 (Completed, 15 stories) absorbed the original
> P0-1 stopgap (24-1), guest identity (24-7) and the structural review port (24-11). Measured on `main`
> at `4b6e629a`: `ReviewRepository.findByUserAndTypes`/`countDue` already reject `undefined` userId;
> `ProgressionNestController.getPhaseGate` already returns `createGuestPhaseGate()`; `AppLayout` no
> longer hardcodes `: 4`. What therefore remains for Epic 25 is: **verify and close any remaining
> `optionalAuth` SRS gap (25-1), prove the two progression endpoints agree under one cache key (25-2),
> remove the Learn phase walls and land the Browse-only guest state (25-3), and evidence the TTS
> guest cost surface (25-4).**

## Background

PinyinPal lets a visitor use the product before registering — that is the demo funnel (BM-1). A guest is
identified by device, not by account, so every request from a guest reaches an `optionalAuth` route with
`req.userId === undefined`.

That single fact produced the confirmed **P0-1 cross-tenant leak**: a `where: { userId }` clause with
`userId === undefined` is dropped by Prisma, turning a per-user SRS query into a **cross-tenant** one.
A guest could read another learner's spaced-repetition state. The stopgap landed inside Epic 24; this
epic owns the guarantee that _no_ `optionalAuth` SRS read can regress to that shape, and that the review
read path is guarded at the HTTP boundary as well.

The second problem is identity skew. If the backend says a guest is Phase 1 with `isGuest: true` but the
shell hardcodes a different phase, or if `getGates` and `getPhaseGate` disagree because each writes its
own guest branch, the learner sees a lock state that does not match reality — and a cached gate that is
keyed by identity _class_ rather than identity can survive a login and be served to the next person on
the device (the §7.2 staleness).

The third problem is direction. The pre-BM-1 design put phase walls in front of the Learn routes. BM-1
reversed that: a guest may browse **all** Learn content; scarcity is created by session-local progress
and demo quotas (L5), not by hiding the roadmap (L6). Leaving the walls in place would contradict the
ratified model and hide the product from the exact visitor the funnel depends on.

**Investigation findings (measured 2026-10-27, branch `epic-25-guest-identity`).**

Read-only audit by the Investigator against the code (full evidence in the session report). The BR
statements below were corrected to match what the code actually does — none of these are assumptions.

1. **P0-1 is closed at two layers, but the audit was never written down.** Of 15 `OptionalAuthGuard`
   routes, **none** can reach `srsCardState`: the review module is 100 % `RequireAuthGuard`, and every
   other guest branch short-circuits (`if (!userId) return …`). Only two SRS reads accept an optional
   userId and both structurally reject it (`ReviewRepository.ts:86-88`, `:166-168`). What is missing is
   the recorded audit list and a **two-user seeded** leak regression (today's tests mock Prisma).
2. **The two progression endpoints do NOT share a guest source.** `getPhaseGate` returns
   `createGuestPhaseGate()` (`progression-nest.controller.ts:146`); `getGates` returns a **hand-written
   literal** — three gate objects, six hardcoded strings in total (three `reason: "GUEST"` plus three
   `details: "Guest — Phase 1 only"`, `:173-180`). There is **no server-side gate cache at all**.
   _(Corrected at close: the count is three `"Guest — Phase 1 only"` details strings, not six — the other
   half of the six are the `GUEST` reason literals. The `gateStatus.factory.ts` header comment inherited
   the looser wording; the shipped derivation is what the code now reads.)_
3. **The only gate cache is frontend localStorage keyed by identity _class_** —
   `phaseGate:user` / `phaseGate:guest` (`phaseGateService.ts:19`) — and `phaseGate:user` is **never
   cleared** on logout (`AuthContext.tsx:200` removes only the token). User A's cached gate can therefore
   be served to user B on the same device when the fetch fails. That is the real §7.2 staleness, and it
   is a genuine cross-user leak of gate state.
4. **Three route walls, not six.** `PhaseGate` wraps grammar (2), readers (3), chengyu (4)
   (`LearnRoutes.tsx:62,71,79`); foundations/radicals/phonetic-clusters have **no** route wall. The
   sidebar, however, blocks **five** of six links (`SideNav.tsx:250-286`), so radicals and
   phonetic-clusters are unreachable from the navigation despite having no wall.
5. **`AppLayout` has no guest region** (chrome + `<Outlet />` only) and never synthesised `isGuest`; the
   guest affordance already lives on the Browse dashboard (`DashboardGuest`, rendered from
   `DashboardPage.tsx:119`). A25's move is therefore mostly **verification + regression pinning**, not new
   UI. A guest prompt in the dashboard also exists in Storybook (`DashboardPageFull.stories.tsx:79`).
6. **Both TTS surfaces are already cache-first-free for guests, and neither has any cost control.**
   `POST /v1/tts` (`AudioSynthesizer.synthesizeOnce:52-56` — `fileExists` → sign, `cached: true`, no
   synthesis) and `POST /v1/readers/passages/:id/audio` (`ReadersAudioService.ts:109-117`) are proven by
   existing parity tests. There is **no** rate limit, **no** `AICallLog`, **no** counter and **no**
   circuit breaker on either — `rate-limit.config.ts:238-241` states the audio POST is deliberately
   un-limited. The story's job is the artifact and the epic-29 handoff, not new machinery.
7. **Two stale documents actively contradict A25.** `verification-artifacts/epic-25-route-gating-verification.md`
   describes shipped `LockedSurface` / `LEARN_ROUTE_CONFIG` / `LearnRouteGate` / `AppTopBar.isGuest` —
   **none of which exist in `apps/frontend/src`** — and `wip/guest-access-calibration.md` D5 records
   "radicals + phonetic get route gates — Decided". Both must be superseded, or the next contributor
   re-adds the wall A25 removed.
8. **Two secondary phase-lock surfaces exist outside A25's stated boundary** and must be recorded, not
   silently ignored: `ContentBrowser.tsx:65-71` (second lock map, inert because `LibraryPage` passes
   `userPhase={4}`) and page-level fallbacks in `GrammarPage.tsx:33` / `RadicalsPage.tsx:82` that give a
   failed-fetch guest a phase above 1.

## User Stories

This epic consists of the following user stories:

1. **P0-1 Guest Isolation: Repository-Level SRS Rejection** _(link to `story-25-1-optional-auth-srs-guest-isolation.md`)_
   - As a guest, I want every spaced-repetition read scoped to my own (non-existent) identity, so that I can never see another learner's review state.

2. **Guest Identity Lockstep: One Guest Gate, One Cache Key** _(link to `story-25-2-guest-identity-lockstep.md`)_
   - As a guest, I want the backend and the shell to agree that I am Phase 1 with `isGuest: true` — and to stop believing that the moment I sign in — so that the locks and messages I see match my real state.

3. **A25 Learn Un-Gating + Browse-Only Guest State** _(link to `story-25-3-learn-ungating-browse-guest-state.md`)_
   - As a guest, I want to reach every Learn surface directly by URL, so that I can judge the whole product before I register — while the guest prompt I do see lives on the dashboard, not in my permanent chrome.

4. **Guest Cost Surface: TTS Cache-First Verification** _(link to `story-25-4-tts-guest-cost-verification.md`)_
   - As the product owner, I want proof that the two anonymous TTS surfaces serve cached audio for free, so that a guest demo cannot become an unbounded vendor bill.

## Story Breakdown Logic

This epic is divided into stories based on the following approach:

- Stories **25.1–25.2** close the correctness and contract half (backend; 25-1 security isolation, 25-2 identity lockstep). 25-1 lands first because a leak outranks a lock-state mismatch; 25-2 lands second because 25-3's frontend work consumes its contract.
- Story **25.3** carries the A25 surface change (frontend): remove the Learn phase walls, demote phase to sequencing metadata, and prove the guest affordance is Browse-only.
- Story **25.4** is the cost-surface verification (backend), independent of 25-3 and sequenced last so its evidence reflects the final state of the anonymous read paths.

Each story is independently committable on the epic branch; together they satisfy the epic AC list.

## Acceptance Criteria

- [x] **P0-1 isolation.** Every `optionalAuth` SRS read in the NestJS surface rejects `undefined` userId before Prisma, and a review read under guest auth returns 401 or an empty session-local result — never another user's rows. Verified by committed P0-1 regression tests (story 25-1). _Verified: `OptionalAuthGuard` inventory at `apps/backend/src/nest/guards/__tests__/optional-auth-coverage.test.ts` (15 routes / 7 signatures, each citing a live asserted line) + `apps/backend/tests/integration/nest/review-guest-isolation.test.ts` (two users seeded, positive control first, then guest `401` / repo `[]`·`0`)._
- [x] **Lockstep contract.** `createGuestPhaseGate()` returns `{ currentPhase: 1, isGuest: true }`; `getGates` and `getPhaseGate` return **agreeing** guest payloads for the same anonymous identity, derived from one shared source (today `getGates` hand-writes a second literal), and the frontend gate cache is identity-scoped and evicted on auth change. Verified by backend integration tests + frontend tests (story 25-2). _Verified: one source is `buildGuestGateStatus(createGuestPhaseGate())` (`modules/progression/services/gateStatus.factory.ts`); agreement is asserted by the controller unit case and the DB-backed "same anonymous identity, both endpoints" case. **Mechanism note:** the cache is keyed by identity **class** and **evicted at six identity transitions** (`clearPhaseGateCache()`), not keyed by user id — identity-in-key is blocked by the `shared → features` boundary rule. Residual windows are stated in the [epic implementation](README.md) and the [25-2 story implementation](../../issue-implementation/epic-25-secure-guest-identity-and-route-gating/story-25-2-guest-identity-lockstep.md)._
- [x] **Shell consumes one source.** `AppLayout` derives its Learn phase from the server gate only — no hardcoded fallback grants a guest more than Phase 1, and the shell never synthesises `isGuest` itself. Verified by `AppLayout` tests (story 25-2). _Verified, and stronger as built: after A25 the shell reads **no** phase for navigation at all (`AppLayout.tsx` has no `usePhaseGate`, no `effectivePhase`, no `Infinity` fallback and no `isGuest`), and `AppLayout.test.tsx` pins "chrome + `<Outlet />` only". The page-level dev-preview fallbacks were clamped for guests (`GrammarPage.tsx:40`, `RadicalsPage.tsx:87`)._
- [x] **No Learn wall (A25).** A guest navigating directly to each of the six Learn routes (`foundations`, `radicals`, `grammar`, `phonetic-clusters`, `readers`, `chengyu`) renders the page — no gate screen, no redirect — and the sidebar does not block navigation to any Learn item. Verified by route tests for all six + a SideNav interaction test (story 25-3). _Verified: `LearnRoutes.guestAtPhase1.test.tsx` (4 routes) + the inverted `LearnRoutes.grammar`/`LearnRoutes.chengyu` tests + the `SideNav` "navigates to every Learn child at phase 1" test._
- [x] **Guest state is Browse-only (A25).** `AppLayout` renders chrome + `<Outlet />` only (no guest banner/badge), and the guest affordance lives on the dashboard Browse surface. Verified by a layout regression test + a dashboard test/story (story 25-3). _Verified: `AppLayout.test.tsx` "renders chrome + `<Outlet />` only — no guest region, banner, or badge (A25)", `DashboardGuest.test.tsx` ownership case, and the `DashboardPageFull` story._
- [x] **Guest cost surface.** Both anonymous TTS surfaces (`POST /v1/tts`, `POST /v1/readers/passages/:id/audio`) are verified cache-first-free for guests, the generated path is documented as epic-29's counter-gated path, and the evidence is recorded in **two places**: the local artifact `verification-artifacts/epic-25-tts-guest-cost-surface.md` (that directory is gitignored by design) **and** a committed condensed summary in the story impl doc, so the record survives on `main` (story 25-4). _Verified: bad-token cache-hit cases on both surfaces (`audio-health-parity.test.ts:289-300`, `readers-parity.test.ts:429-445`) assert no `synthesizeSpeech` / no `uploadFile`; the epic-29 handoff is in the 25-4 impl doc; the artifact index in `verification-artifacts/README.md` lists it._
- [x] **No guest regression.** Existing guest flows — browse, quiz attempt, review view — still function after the gate change. Verified by the frontend suite (story 25-3). _Verified: full frontend suite 157 files / 1156 tests pass and backend 55 files / 631 tests pass at close (gate table in the [epic implementation](README.md))._
- [x] **Release gates green.** Tier 1 per commit and Tier 2 at epic close (full suite, backend type-check, backend-audit skill, design gates as applicable), with any failure triaged against `docs/guides/testing/known-failures.md` first. _Verified at close: full suite, backend type-check, build, lint (`0 errors`), `lint:css`, `design:lint`, `check:design-parity`, `check:spine-parity`, `check:registry-stories`, `check:page-inventory`, `check:module-boundaries`, `check:system-map` and the backend-audit skill (`0 HIGH / 0 MEDIUM / 1 LOW`, corrected) all pass; the three repo-wide failures (`format:check`, `check:doc-links`, `design-audit`) are triaged as KF-004/KF-005/KF-006 with none in an Epic 25 file._

## Architecture Decisions

- Decision: **Repository is the last line of defence for P0-1** (structural rejection, not controller-only)
  - Rationale: a controller guard can be forgotten by the next route; a repository that returns empty for `undefined` userId cannot leak regardless of the caller. The Nest `RequireAuthGuard` additionally blocks guests at the HTTP boundary — defence in depth, not a substitute.
  - Alternatives considered: controller-only `req.userId!` assertions (the pre-24 shape — this is what leaked); a Prisma middleware filter.
  - Implications: two enforcement points (guard + repository) that must stay in sync; the repository silently returns empty for guests, so callers must not read "empty" as "no data exists".

- Decision: **One server-computed guest gate, one cache key** (`createGuestPhaseGate()` → `{ currentPhase: 1, isGuest: true }`)
  - Rationale: identity is the cache key. Two endpoints computing the guest branch independently is how `getGates`/`getPhaseGate` drift and how a stale guest gate survives login (§7.2).
  - Alternatives considered: frontend-computed guest defaults; a separate guest cache namespace.
  - Implications: the gate must be evicted (or keyed) on auth change; the frontend becomes a pure consumer.

- Decision: **Phase is a signal, not a wall (BM-1 L6 / A25)**
  - Rationale: BM-1 §3 ratifies unlimited guest access to all Learn content; L6 retains phase metadata for sequencing only. A wall would contradict the ratified model and hide the funnel's showcase.
  - Alternatives considered: keep the walls (pre-BM-1 shape — rejected); gate only the deepest route (rejected: still a wall).
  - Implications: the phase survives as **sequencing metadata on `LEARN_NAV_ITEMS`** (row order + a `Phase N of 4` tooltip) and is **not** a navigation prerequisite. `SideNav` holds no user-phase state — its `phaseGate`/`requiredPhase` props and the derived `LEARN_REQUIRED_PHASE` map are deleted, because a surviving `REQUIRED` export is how the wall gets re-added. The radicals/phonetic-clusters "URL bypass" ceases to be a defect because there is nothing to bypass.

- Decision: **Guest state is Browse-only**
  - Rationale: chrome is inherited by every route, so a guest affordance there is a permanent, un-dismissable interruption on Focus surfaces (dual-mode chrome law; Focus = one task, one CTA).
  - Alternatives considered: guest banner in `AppLayout` (the pre-A25 shape — rejected); a toast on first visit.
  - Implications: the dashboard becomes the single owner of guest messaging; a guest who never lands on the dashboard sees no prompt (accepted — copy/CTA work belongs to epic-26).

- Decision: **TTS guest safety = cache-first free reads; quota mechanics stay in epic-29**
  - Rationale: building a TTS-only counter here would be throwaway once the unified L5 quota spine lands. This epic's job is to prove which path actually generates on a miss, so epic-29 can size the counter correctly.
  - Alternatives considered: ship a TTS-only counter now (rejected — duplicate machinery); `requireAuth` on TTS (rejected — breaks the guest demo).
  - Implications: a guest cache MISS is billable until epic-29 ships; that exposure is documented in the verification artifact, not silently accepted.

## Implementation Plan

1. Author the BR + story BRs and open the epic branch (`epic-25-guest-identity`).
2. Story 25-1 — audit every `optionalAuth` SRS read, close any remaining `undefined`-userId gap, add P0-1 regression tests.
3. Story 25-2 — pin the guest-gate contract, unify the cache key, prove eviction on auth change, remove shell-side phase invention.
4. Story 25-3 — remove the Learn route gates, demote sidebar locks to metadata, lock in the Browse-only guest state with regression tests.
5. Story 25-4 — verify both anonymous TTS surfaces cache-first, write the verification artifact, hand quota mechanics to epic-29.
6. Docs truth-check + epic close: Status/Last Update, AC boxes, Tier 2 gates, single epic PR.

## Risks & mitigations

- Risk: **Removing the Learn walls is read as a regression** by a later contributor, who re-adds a `PhaseGate`. — Severity: Medium
  - Mitigation: the A25 decision is recorded in this BR, in the affected source headers (`learnNav.ts`, `LearnRoutes.tsx`, `SideNav.tsx`/`.css`, the stories, the registry and `DESIGN.md`), and in six route tests + a compile-time prop-deletion tripwire; a test asserts a guest can reach all six routes.
  - Rollback: re-add gates only via a new BM-1 change-gate decision — never as a local fix.

- Risk: **An `optionalAuth` SRS read is missed** by the 25-1 audit and keeps the leak open. — Severity: High
  - Mitigation: audit every `@UseGuards(OptionalAuthGuard)` route and every repository read taking `string | undefined`; encode the result as a committed list in the story impl doc with one regression test per entry.
  - Rollback: revert the story commit; the pre-existing repository rejection stays in place, so no window reopens.

- Risk: **Cache-key unification breaks the registered path** (registered users seeing guest gates). — Severity: High
  - Mitigation: integration tests cover guest → registered and registered → guest in one session; the parity test asserts both endpoints agree for the same identity.
  - Rollback: revert 25-2; the endpoints keep their pre-story behaviour independently.

- Risk: **Doc drift** — planning docs still describe "gate every Learn route" after A25 removed it. — Severity: Medium
  - Mitigation: epic BR records the supersession explicitly; docs-writer runs the doc↔code truth-check at close and updates the planning pointer.
  - Rollback: n/a (documentation only).

## Implementation notes

- Conventions: follow `docs/guides/conventions/backend.md` (backend) and `docs/guides/conventions/frontend.md` (frontend), plus `docs/knowledge-base/practices/solid-principles.md`.
- Business model authority: `docs/business/business-model.md` §3 (access matrix) + L5/L6.
- Planning authority: `docs/planning/epics-25-40.md` §Epic 25 and §2026 Audit Amendments **A25** (winner on conflict). The §Epic 25 body now carries dated A25 reversal pointers on the goal, the route-gates bullet, AC 3 and the UI scope, so the original plan and the ratified amendment cannot be read in isolation.
- Quality gates: `.github/instructions/project-workflow.instructions.md` §Quality Gates (canonical two-tier table).
- Known failures: triage against `docs/guides/testing/known-failures.md` before re-triaging any failure. The three repo-wide failures this epic triaged are KF-004 (`format:check`), KF-005 (`check:doc-links`) and KF-006 (`design-audit`).
- Related documentation: [epic implementation](../../issue-implementation/epic-25-secure-guest-identity-and-route-gating/README.md) (as-built record + gate table + challenges) · [Epic 24 BR](../epic-24-nestjs-shell-migration/README.md) (absorbed the P0-1 stopgap, guest identity and the structural review port) · [business model](../../business/business-model.md) §3 + L5/L6 · guest cost-surface artifact `verification-artifacts/epic-25-tts-guest-cost-surface.md` (local, gitignored — the committed record is the [25-4 implementation](../../issue-implementation/epic-25-secure-guest-identity-and-route-gating/story-25-4-tts-guest-cost-verification.md)).
