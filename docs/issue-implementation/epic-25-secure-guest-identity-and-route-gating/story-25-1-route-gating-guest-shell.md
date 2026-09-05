**Last Updated:** September 5, 2026

# Implementation 25-1: Data-Driven Learn Route Gating + Guest-Shell UI + TTS Guest-Cost Verification

> **BR Reference:** `docs/business-requirements/epic-25-secure-guest-identity-and-route-gating/story-25-1-route-gating-guest-shell.md`
> **Last Updated:** September 5, 2026
> **Status:** Completed
> **Commit hash:** TBD (filled at commit time)

## Implementation Summary

Closed Epic 25's residual Phase-A scope on branch `solar-v5-wire` (slug `epic-25-secure-guest-identity-and-route-gating`): **data-driven Learn route gating on all 6 routes**, the **guest-shell UI** (passive Guest badge in `AppTopBar` + the shared `LockedSurface` gate screen), and the **TTS guest-cost verification** (evidence-only, no backend change). The guest identity shape `{currentPhase: 1, isGuest: true}` was already landed by Epic 24 story 24-7 — this story **consumes** it and does not re-implement it.

**The core router change** — the old `PhaseGate` in `apps/frontend/src/router/LearnRoutes.tsx` was redirect-only, hardcoded to grammar(2)/readers(3)/chengyu(4), and omitted radicals + phonetic-clusters entirely (the URL bypass). It is replaced by **one `LearnRouteGate`** that derives `label` + `requiredPhase` from `LEARN_NAV_ITEMS` (the sidebar's single source of truth in `shared/constants/learnNav.ts`) by matched route id, via a `LEARN_ROUTE_CONFIG` that maps all six content routes (`foundations`/`radicals`/`grammar`/`phonetic`/`readers`/`chengyu`). Below-phase direct navigation — guest or authed — now renders the shared `LockedSurface` gate screen instead of the silent redirect-to-foundations. Foundations (Phase 1) always renders and stays the guest/Phase-1 landing.

**The guest-shell UI** — `AppTopBar` gains a required `isGuest` prop; when true it renders a compact passive `Badge variant="surface"` (`data-testid="guest-identity-badge"`, text "Guest", title "Browsing as a guest with Phase 1 access") next to the account controls — **no CTA/upsell** (`GuestUpsell` is Epic 26, untouched). `AppLayout` wires `isGuest = !isAuthenticated || !!phaseGate?.isGuest`. The new shared `LockedSurface` component (`apps/frontend/src/shared/components/LockedSurface/`) composes the `EmptyState` lock-icon treatment with neutral copy ("Unlocks in Phase N."), so sidebar-locked and direct-URL-locked read as one system. It is presentational and data-driven (`label`/`requiredPhase` props — no `learnNav` import), barrel-exported from `shared/components`, and registered in `.github/component-registry.json` (story states default/edge).

**The TTS guest-cost verification** — both `optionalAuth` surfaces on Nest are verified **cache-first-free for guests** with no backend code change: `POST /v1/tts` (`apps/backend/src/modules/audio/nest/audio-nest.controller.ts`) and `POST /v1/readers/passages/:id/audio` (`apps/backend/src/modules/readers/nest/readers-nest.controller.ts`). A guest's `userId` stays `undefined` (never 401); a cache HIT returns `{ cached: true }` with no billable Google TTS generation; generated-audio quota mechanics are recorded as **epic-29's** (in-code comment + verification artifact).

**Behavior deltas to record:**

1. **Silent redirect → gate screen (approved change).** The old redirect-to-foundations on below-phase nav is replaced by the `LockedSurface` gate screen; the grammar/chengyu route-gate tests were updated from redirect assertions to gate-screen assertions in the same change.
2. **Guest badge is passive identity only.** No CTA/upsell copy — Epic 26's `GuestUpsell` is untouched.

## Technical Scope

Data-driven phase gating across the Learn router + the shared `LockedSurface` gate component + the `AppTopBar`/`AppLayout` guest identity wiring + the route-gate/guest test suite + the TTS guest-cost verification artifact. Frontend-only except for the verification (no backend code change).

**Files:**

- `apps/frontend/src/router/LearnRoutes.tsx` — **UPDATE**: `PhaseGate` (redirect-only, hardcoded 2/3/4, radicals + phonetic-clusters ungated) → `LearnRouteGate` (derives `label` + `requiredPhase` from `LEARN_NAV_ITEMS`) + `LEARN_ROUTE_CONFIG` (all six route ids). Below-phase direct nav renders `<LockedSurface>`.
- `apps/frontend/src/shared/components/LockedSurface/LockedSurface.tsx` — **NEW**: shared locked-surface gate screen (S2), presentational + data-driven (`label`, `requiredPhase`, `className`); composes `EmptyState` (lock icon) with neutral CTA-free copy.
- `apps/frontend/src/shared/components/LockedSurface/LockedSurface.stories.tsx` — **NEW**: MSW-mocked stories (default, edge).
- `apps/frontend/src/shared/components/LockedSurface/__tests__/LockedSurface.test.tsx` — **NEW**: component tests (label + neutral copy; lock icon + no CTA).
- `apps/frontend/src/shared/components/index.tsx` — **UPDATE**: barrel export of `LockedSurface` + `LockedSurfaceProps`.
- `apps/frontend/src/shared/components/AppTopBar/AppTopBar.tsx` — **UPDATE**: required `isGuest` prop → compact passive `Badge variant="surface"` (`data-testid="guest-identity-badge"`, "Guest", title "Browsing as a guest with Phase 1 access"). No CTA.
- `apps/frontend/src/shared/components/AppTopBar/AppTopBar.stories.tsx` — **UPDATE**: guest-badge story state ("Guest — badge + Login / Register").
- `apps/frontend/src/shared/components/AppTopBar/__tests__/AppTopBar.test.tsx` — **UPDATE**: guest-badge render/no-render cases.
- `apps/frontend/src/shared/layouts/AppLayout.tsx` — **UPDATE**: `isGuest = !isAuthenticated || !!phaseGate?.isGuest`, threaded into `<AppTopBar isGuest>`.
- `apps/frontend/src/shared/layouts/AppLayout.stories.tsx` — **UPDATE**: `GuestShell` story state (guest badge + Phase-1 shell parity).
- `apps/frontend/src/shared/layouts/__tests__/AppLayout.guest.integration.test.tsx` — **UPDATE**: guest-badge assertion added to the Phase-1 guest integration test.
- `apps/frontend/src/router/__tests__/LearnRoutes.grammar.test.tsx` — **UPDATE**: redirect assertion → LockedSurface gate-screen assertion (below Phase 2).
- `apps/frontend/src/router/__tests__/LearnRoutes.chengyu.test.tsx` — **UPDATE**: redirect assertion → LockedSurface gate-screen assertion (below Phase 4).
- `apps/frontend/src/router/__tests__/LearnRoutes.radicals.test.tsx` — **NEW**: route-gate test (Phase-1 direct nav → locked surface, bypass closed; at Phase 2 → RadicalsPage).
- `apps/frontend/src/router/__tests__/LearnRoutes.phonetic.test.tsx` — **NEW**: route-gate test (Phase-2 direct nav → locked surface, bypass closed; at Phase 3 → PhoneticClustersPage).
- `apps/frontend/src/router/__tests__/LearnRoutes.guest.integration.test.tsx` — **NEW**: guest e2e — Phase-1 shell (Foundations accessible, Guest badge) + LockedSurface on direct `/learn/grammar` nav.
- `.github/component-registry.json` — **UPDATE**: `LockedSurface` registered (props `label`, `requiredPhase`, `className`; story states default/edge); `AppTopBar.isGuest` prop + guest edge story state.
- `verification-artifacts/epic-25-route-gating-verification.md` — **NEW**: consolidated FE verdict + TTS guest-cost verification + epic-29 deferral record.

## Implementation Details

### Data-driven `LearnRouteGate` + `LEARN_ROUTE_CONFIG` (LearnRoutes.tsx)

```tsx
// apps/frontend/src/router/LearnRoutes.tsx
function LearnRouteGate({ routeId, children }: { routeId: string; children: ReactNode }) {
  const { phaseGate, isLoading } = usePhaseGate();
  const navItem = LEARN_NAV_ITEMS.find((item) => item.id === routeId);
  const requiredPhase = navItem?.requiredPhase ?? 1;

  if (isLoading) return null; // app shell provides chrome; pages own their skeletons

  const currentPhase = phaseGate?.currentPhase ?? 1;
  if (currentPhase < requiredPhase) {
    return <LockedSurface label={navItem?.label ?? "This content"} requiredPhase={requiredPhase} />;
  }
  return <>{children}</>;
}

const LEARN_ROUTE_CONFIG: { id: string; path: string; element: ReactNode }[] = [
  { id: "foundations", path: "foundations", element: <FoundationsPage /> },
  { id: "radicals", path: "radicals", element: <RadicalsPage /> },
  { id: "grammar", path: "grammar", element: <GrammarPage /> },
  { id: "phonetic", path: "phonetic-clusters", element: <PhoneticClustersPage /> },
  { id: "readers", path: "readers", element: <ReadersPage mode="library" /> },
  { id: "chengyu", path: "chengyu", element: <ChengyuPage /> },
];
```

The gate is fully data-driven: `requiredPhase` comes from `LEARN_NAV_ITEMS` (the same array the sidebar lock consumes), so the route gate can never drift from the sidebar lock. `LEARN_REQUIRED_PHASE` (`learnNav.ts`) remains derived from `LEARN_NAV_ITEMS` via `Object.fromEntries`. Foundations (`requiredPhase: 1`) always passes, so `/learn/foundations` stays the guest/Phase-1 landing.

### Shared `LockedSurface` gate screen (S2)

```tsx
// apps/frontend/src/shared/components/LockedSurface/LockedSurface.tsx
export type LockedSurfaceProps = {
  /** Content label of the locked surface (e.g. "Grammar"). */
  label: string;
  /** Phase required to unlock the surface (from LEARN_REQUIRED_PHASE). */
  requiredPhase: number;
  className?: string;
};

export function LockedSurface({ label, requiredPhase, className = "" }: LockedSurfaceProps) {
  const rootClass = ["locked-surface flex-1 flex-col-center gap-md p-xl w-full", className]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={rootClass} data-testid="locked-surface">
      <EmptyState icon="lock" title={label} description={`Unlocks in Phase ${requiredPhase}.`} />
    </div>
  );
}
```

Presentational + data-driven (no `learnNav` import — callers derive `label`/`requiredPhase`), CTA-free by construction, and visually consistent with the existing `EmptyState` locked-teaser treatment (`RadicalTreesTab` Phase-2 precedent) and the `SideNav` locked-item lock icon.

### Guest identity wiring (S1) — `AppTopBar` + `AppLayout`

```tsx
// apps/frontend/src/shared/components/AppTopBar/AppTopBar.tsx — required isGuest prop
export type AppTopBarProps = {
  user: UserMenuUser | null;
  isAuthenticated: boolean;
  /** Whether the session is a guest (drives the passive Guest identity badge). */
  isGuest: boolean;
  logout: () => Promise<void> | void;
  className?: string;
};
// when isGuest:
// <Badge variant="surface" data-testid="guest-identity-badge"
//        title="Browsing as a guest with Phase 1 access">Guest</Badge>
```

```tsx
// apps/frontend/src/shared/layouts/AppLayout.tsx — guest identity derivation
// Epic 25 S1: true for the calibrated guest gate (phaseGate.isGuest →
// createGuestPhaseGate()) OR any unauthenticated session (auth fetch fallback).
const isGuest = !isAuthenticated || !!phaseGate?.isGuest;
// ...
<AppTopBar user={user} isAuthenticated={isAuthenticated} isGuest={isGuest} logout={logout} />;
```

`AppTopBar` stays auth-free (identity threaded in via props from `AppLayout`), and `isGuest` builds on the Epic-24-24-7 `effectivePhase = phaseGate?.currentPhase ?? (isAuthenticated ? Infinity : 1)` without re-implementing the identity shape.

## Architecture Integration

```
LearnRouteGate (all 6 /learn/* routes) ──requires phase──> LEARN_NAV_ITEMS / LEARN_REQUIRED_PHASE (learnNav.ts)
            ↓ below-phase renders
   LockedSurface (shared/components, EmptyState lock)      SideNav lock (same LEARN_NAV_ITEMS) — one lock system
AppLayout.isGuest = !isAuthenticated || phaseGate?.isGuest  ──> AppTopBar Guest badge (S1, passive)
            ↑ consumes
   usePhaseGate → fetchPhaseGate → createGuestPhaseGate()  {currentPhase:1, isGuest:true}  (landed by 24-7, consumed here)
TTS read path (verification-only): POST /v1/tts + POST /v1/readers/passages/:id/audio → OptionalAuthGuard,
   guest userId undefined → cache-first free { cached:true } (AudioSynthesizer.synthesizeOnce); generated-quota → epic-29
```

- The router change touches only `LearnRoutes.tsx`; the Learn pages are untouched (the gate wraps them).
- The shared component register/barrel path: new component must be added to `shared/components/index.tsx` + `.github/component-registry.json` (done) so the `check:registry-stories` contract stays green.
- No backend module or endpoint changed — the TTS surfaces were verified against the shipped Nest controllers (audio + readers modules) as evidence.

## Technical Challenges & Solutions

**Challenge 1: The URL bypass — gate omitted on radicals + phonetic-clusters and hardcoded elsewhere**

- **Problem**: Below-phase direct navigation to `/learn/radicals` (Phase 2) or `/learn/phonetic-clusters` (Phase 3) rendered the content — the phase gate was redirect-only, hardcoded to grammar(2)/readers(3)/chengyu(4), and simply absent on the two ungated routes.
- **Root Cause**: The old `PhaseGate` was applied per-route with hardcoded phase numbers (grammar 2 / readers 3 / chengyu 4); radicals + phonetic-clusters were added to the sidebar (`LEARN_NAV_ITEMS`) later without a matching route gate, so the two lists drifted.
- **Solution**: A single `LearnRouteGate` derives `requiredPhase` by route id from `LEARN_NAV_ITEMS` (the sidebar's source of truth) via `LEARN_ROUTE_CONFIG` covering all six routes. Drift is impossible because both surfaces consume the same array.
- **Impact/Benefits**: closes the radicals + phonetic-clusters bypass at once; sidebar-locked and direct-URL-locked now agree; one wrapper instead of three hardcoded ones.
- **Alternatives Considered**: extending the hardcoded wrapper to the two new routes (least change, but keeps 3+2 duplicated numbers vs `learnNav.ts` — rejected); gating at the page level (duplicates per page, re-opens drift — rejected).

**Challenge 2: Silent redirect → gate screen — a behavior change rippling into existing tests**

- **Problem**: The approved UIUX Step-1 design (human-approved at the User Preview Gate) replaced the silent redirect-to-foundations with a locked-surface gate screen, but the existing `LearnRoutes.grammar.test.tsx` / `LearnRoutes.chengyu.test.tsx` asserted the redirect (`<Navigate to="/learn/foundations" replace />`).
- **Root Cause**: Tests encoded the pre-change behavior; a gate screen did not exist to assert against.
- **Solution**: Updated both tests to assert the `LockedSurface` gate screen renders below phase (grammar below 2 → "Unlocks in Phase 2."; chengyu below 4), and added new route-gate tests for radicals/phonetic + a guest integration test that asserts the Phase-1 shell stays intact.
- **Impact/Benefits**: the approved behavior is locked by tests; redirect assertions no longer mask the bypass.
- **Alternatives Considered**: keeping the redirect and layering the screen on top (rejected — the redirect hides _why_ a route is unavailable and would make the screen unreachable).

**Challenge 3: Storybook state-parity assertion after the browser run was interrupted**

- **Problem**: The FE engineer's Storybook browser verification was interrupted (Storybook picked the wrong config directory), so the new/updated story states (LockedSurface default/edge, AppTopBar guest, AppLayout GuestShell) could not be visually walk-checked before handoff.
- **Root Cause**: tooling/run-environment interruption mid-session, not a story defect.
- **Solution**: story state-parity was asserted via `check:registry-stories` (36/36 — every registered shared component, including the new `LockedSurface`, has its story file + allowed states) plus the component/integration tests; the residual "story files compile in the frontend workspace" check is called out for the Code Reviewer in this chain.
- **Impact/Benefits**: the registry contract gives machine-level confidence that story states exist and are allowed even without a browser walk.
- **Alternatives Considered**: re-running the full Storybook browser pass in this story (deferred to the Code Reviewer / owner verification step).

### Doc Truth-Check

- [x] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (path + verb copied verbatim): `ttsAudio: "/v1/tts"` and `readersPassageAudioById(id) → /v1/readers/passages/{id}/audio` — both verified in the Nest controllers (`POST`).
- [x] Feature/module/component names verified against `apps/backend/src/modules/` and `apps/frontend/src/features/` (audio + readers modules exist; Learn pages/features named verbatim from `LearnRoutes.tsx`).
- [x] Data source claims verified: no static-data claims made; the TTS cache-first claim is grounded in `AudioSynthesizer.synthesizeOnce` (exists? cached : synthesize) + the parity test files.
- [x] All relative markdown links resolve (BR ↔ IMP ↔ epic READMEs ↔ `verification-artifacts/` reference).
- [x] Last Updated / Last Update date is current (September 5, 2026 — same commit as the edit).

## Testing Implementation

- **Route-gate tests (jsdom)** — `LearnRoutes.grammar.test.tsx` (below Phase 2 → locked surface; at Phase 2 → GrammarPage), `LearnRoutes.chengyu.test.tsx` (below Phase 4 → locked surface; at Phase 4 → ChengyuPage), `LearnRoutes.radicals.test.tsx` (**NEW** — Phase-1 direct nav → locked surface; at Phase 2 → RadicalsPage), `LearnRoutes.phonetic.test.tsx` (**NEW** — Phase-2 direct nav → locked surface; at Phase 3 → PhoneticClustersPage).
- **Guest integration (jsdom)** — `LearnRoutes.guest.integration.test.tsx` (**NEW**): guest Phase-1 shell renders Foundations + the Guest badge, direct `/learn/grammar` nav shows the `LockedSurface` ("Grammar" / "Unlocks in Phase 2."), Foundations always accessible. `AppLayout.guest.integration.test.tsx` (**updated**): the Phase-1 guest shape end-to-end + the guest badge; the gate-fetch-failure fallback keeps the guest Phase 1 (not all-unlocked).
- **Component tests** — `AppTopBar.test.tsx` (authed UserMenu; guest UserMenu CTAs; Guest badge when `isGuest`; no badge when authenticated); `LockedSurface.test.tsx` (**NEW**): label + neutral copy; lock icon + NO button/link (CTA-free contract).
- **Storybook** — `LockedSurface.stories.tsx` (default, edge), `AppTopBar.stories.tsx` (guest-badge state), `AppLayout.stories.tsx` (`GuestShell` state) — MSW-mocked; asserted via `check:registry-stories` 36/36.
- **Verification (recorded)** — `tsc -b --noEmit` 0 errors; 8 affected test files / 18 tests pass (re-verified 2026-09-05 in the current tree); `check:registry-stories` 36/36 (re-verified 2026-09-05); `design-audit` no NEW errors from the Epic-25 files (driver-verified; repo-wide baseline 252 errors / 468 warnings is pre-existing, mostly dead CSS classes across unrelated features — the one `AppTopBar.tsx:41` `app-top-bar__spacer` hit is a pre-existing warning, class predates this change). Full record in `verification-artifacts/epic-25-route-gating-verification.md`.
