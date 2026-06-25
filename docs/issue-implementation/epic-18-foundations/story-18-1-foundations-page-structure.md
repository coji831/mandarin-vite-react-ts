# Implementation 18-1: Foundations Page Structure

**Last Updated:** June 18, 2026

## Technical Scope

Implemented the `foundations` feature scaffold, route configuration, phase-gated LearnLayout, inline sub-tab navigation, backend progression module, shared hooks and constants, and FlashCardPage deprecation with route redirect.

**Files created:**

- `apps/frontend/src/pages/learn/FoundationsPage.tsx` — 4-tab page layout with inline tab bar
- `apps/frontend/src/pages/learn/PinyinTab.tsx` — placeholder (Story 18.2)
- `apps/frontend/src/pages/learn/TonesTab.tsx` — placeholder (Story 18.3)
- `apps/frontend/src/pages/learn/StrokeReferenceTab.tsx` — placeholder (Story 18.4)
- `apps/frontend/src/pages/learn/StrokeAnimationTab.tsx` — placeholder (Story 18.4)
- `apps/frontend/src/pages/learn/ContentPlaceholderPage.tsx` — generic placeholder for locked tabs
- `apps/frontend/src/pages/learn/index.ts` — barrel exports for learn pages
- `apps/frontend/src/features/foundations/index.ts` — barrel exports
- `apps/frontend/src/features/foundations/components/FoundationsProgressBar.tsx` — progress indicator
- `apps/frontend/src/features/foundations/hooks/useFoundationsProgress.ts` — data hook
- `apps/frontend/src/features/foundations/services/foundationsService.ts` — API calls
- `apps/frontend/src/features/foundations/types/index.ts` — type definitions
- `apps/frontend/src/features/foundations/utils/index.ts` — utility exports
- `apps/frontend/src/shared/hooks/usePhaseGate.ts` — shared phase gate hook
- `apps/frontend/src/shared/hooks/index.ts` — barrel exports for shared hooks
- `packages/shared-constants/src/foundations.ts` — FOUNDATION_SECTIONS constant
- `apps/backend/src/modules/progression/` — full backend module (controller, routes, domain entities, repositories, services)

**Files modified:**

- `apps/frontend/src/router/LearnRoutes.tsx` — added `/foundations` route + flashcards redirect
- `apps/frontend/src/shared/layouts/LearnLayout.tsx` — phase-gated route nav bar
- `apps/frontend/src/shared/layouts/LearnLayout.css` — styling for phase nav tabs
- `apps/frontend/src/pages/FlashCardPage.tsx` — reduced to deprecation comment marker
- `apps/frontend/src/pages/__tests__/FlashCardPage.test.tsx` — reduced to deprecation comment marker
- `apps/frontend/src/features/vocabulary/components/index.tsx` — removed NavBar export if orphaned
- `apps/frontend/src/features/vocabulary/index.ts` — cleaned up exports
- `apps/backend/prisma/schema.prisma` — added FoundationProgress + PhaseGate models
- `apps/backend/prisma/migrations/` — migration for new models
- `apps/backend/src/app/container.js` — registered ProgressionController
- `apps/backend/src/app/routes.js` — registered progression routes
- `packages/shared-constants/src/index.js` — exported foundations module
- `packages/shared-constants/src/index.d.ts` — type declarations for foundations
- `packages/shared-types/src/index.ts` — exported FoundationProgress + PhaseGate types

## Implementation Details

```typescript
// FoundationsPage.tsx — Main orchestration component with inline tab bar
// Uses <div> with role="tab" instead of ContentBrowser's TabBar to avoid
// type incompatibility and URL search param coupling.
function FoundationsPage() {
  const [activeTab, setActiveTab] = useState<FoundationSectionId>("pinyin");
  // FoundationsProgressBar handles its own data fetching internally
  return (
    <div className="foundations-page">
      <div className="foundations-tab-bar">
        {FOUNDATION_SECTIONS.map((id) => (
          <div
            key={id}
            className={`foundations-tab ${activeTab === id ? "foundations-tab--active" : ""}`}
            onClick={() => setActiveTab(id)}
            aria-selected={activeTab === id}
            role="tab"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setActiveTab(id);
            }}
          >
            <span className="foundations-tab-icon">{SECTION_ICONS[id]}</span>
            <span className="foundations-tab-label">{FOUNDATION_SECTION_LABELS[id]}</span>
          </div>
        ))}
      </div>
      <div className="foundations-tab-content" role="tabpanel">
        {activeTab === "pinyin" && <PinyinTab />}
        {activeTab === "tones" && <TonesTab />}
        {activeTab === "strokes" && <StrokeReferenceTab />}
        {activeTab === "animations" && <StrokeAnimationTab />}
      </div>
      <FoundationsProgressBar />
    </div>
  );
}
```

```typescript
// LearnLayout.tsx — Restored as route navigation tab bar with phase gating
// Uses <Link> elements with role="tab" for SPA navigation
function LearnLayout() {
  const { phaseGate } = usePhaseGate();
  const currentPhase = phaseGate?.currentPhase ?? 1;

  const LEARN_TABS = [
    { id: "foundations", requiredPhase: 1, path: "/learn/foundations", ... },
    { id: "radicals", requiredPhase: 2, path: "/learn/radicals", ... },
    // ...locked tabs show 🔒 icon and tooltip
  ];

  return (
    <div className="learn-layout">
      <nav className="learn-phase-nav" role="tablist">
        {LEARN_TABS.map(tab => (
          <Link
            key={tab.id}
            to={isLocked ? "#" : tab.path}
            role="tab"
            aria-selected={isActive}
            className={isLocked ? "learn-phase-tab--locked" : ""}
          >
            ...
          </Link>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
```

## Architecture Integration

```
Frontend                                  Backend
───────────────────────                   ───────────────────────
pages/learn/FoundationsPage.tsx
  ├── Inline tab bar (4 <div role="tab">)
  ├── [PinyinTab | TonesTab | StrokeRefTab | StrokeAnimationTab]
  └── FoundationsProgressBar
       └── features/foundations/services/foundationsService.ts
            └── HTTP GET /api/v1/progression/foundation-progress

shared/layouts/LearnLayout.tsx
  └── Route-level nav bar with phase gating
       └── shared/hooks/usePhaseGate.ts
            └── HTTP GET /api/v1/progression/phase-gate

packages/shared-constants/src/foundations.ts
  └── FOUNDATION_SECTIONS — imported by both frontend and backend
      Backend uses to validate sectionId and auto-initialize records
```

## Technical Challenges & Solutions

### Challenge 1: Dual TabBar Conflict

**Problem:** LearnLayout's phase-gated navigation (using route-level `<Link>` elements) and FoundationsPage's content sub-tabs (using state-based tab switching) created confusion about which component was responsible for tab behavior. Initially attempted to reuse the ContentBrowser's `TabBar` for both, but the shared component was tightly coupled to URL search params and `CONTENT_TABS` type definitions.

**Root Cause:** The ContentBrowser TabBar was designed for freeroam content browsing with URL-persisted state, while the Foundations page needed simple local state tab switching. Forcing reuse would have required significant refactoring of the ContentBrowser's TabBar contract.

**Solution:**

- LearnLayout uses `<Link>` elements with `role="tab"` for SPA route navigation — this is route-level, phase-gated navigation.
- FoundationsPage uses an inline tab bar with `<div>` elements and `role="tab"` for local state tab switching.
- Each has a different concern: LearnLayout navigates between content domains; FoundationsPage switches between sub-sections within a single domain.

**Lesson:** Shared UI components should only be reused when they share the same architectural contract. Navigation-level tabs (routes) and content-level tabs (state) are fundamentally different even though they look similar visually.

### Challenge 2: Cross-Layer Import Violation

**Problem:** LearnLayout initially imported `usePhaseGate()` from `features/foundations/hooks/`, creating a Clean Architecture violation — a shared layout should not depend on a feature module.

**Root Cause:** The phase gate hook was initially placed in the `foundations` feature folder because phase gating was scoped to the foundations epic. However, phase gating is a cross-cutting concern that other epics will need.

**Solution:** Extracted `usePhaseGate()` to `shared/hooks/usePhaseGate.ts`. The hook uses `ROUTE_PATTERNS` from shared-constants and `PhaseGate` from shared-types, maintaining Clean Architecture boundaries.

```typescript
// shared/hooks/usePhaseGate.ts — Clean Architecture compliant
export function usePhaseGate() {
  const [phaseGate, setPhaseGate] = useState<PhaseGate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get(ROUTE_PATTERNS.progressionPhaseGate)
      .then((response) => setPhaseGate(response.data))
      .catch(() => setPhaseGate(null))
      .finally(() => setIsLoading(false));
  }, []);

  return { phaseGate, isLoading };
}
```

### Challenge 3: Global Button CSS Interference

**Problem:** Global CSS reset styles `button { border-radius: 8px; border: 1px solid transparent; }` conflicted with Foundations sub-tab styling, causing visual artifacts (unwanted borders, inconsistent border-radius on tab elements).

**Root Cause:** The global `button` reset in the frontend's CSS base stylesheet applies to all `<button>` elements. Reusing the ContentBrowser TabBar (which uses `<button>` elements) would bring these global styles into the Foundations context.

**Solution:** Switched from `<button>` to `<div>` elements with `role="tab"` for the Foundations inline tab bar. This avoids the global button CSS reset entirely. Keyboard accessibility maintained via `tabIndex={0}` and `onKeyDown` handlers.

```tsx
// Inline tab using <div> instead of <button> to avoid global CSS reset
<div
  className={`foundations-tab ${activeTab === id ? "foundations-tab--active" : ""}`}
  onClick={() => setActiveTab(id)}
  aria-selected={activeTab === id}
  role="tab"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") setActiveTab(id);
  }}
>
```

### Challenge 4: Backend 500 Error on First API Call

**Problem:** After creating the Prisma schema migration for `FoundationProgress` and `PhaseGate` models, the first API call to `/api/v1/progression/foundation-progress` returned a 500 error.

**Root Cause:** The Prisma client binary hadn't been regenerated after the schema migration. The migration was applied to the database, but the application was still using an outdated Prisma client that didn't know about the new models.

**Solution:** Ran `npx prisma generate` in the backend directory to regenerate the Prisma client with the new models. This is now a required step after any schema change.

```
cd apps/backend && npx prisma generate
```

**Lesson:** Always regenerate the Prisma client (`prisma generate`) after schema migrations. This should be part of the schema change checklist documented in `docs/guides/references/code-conventions.md`.

## Testing Implementation

- Unit test: FoundationsPage renders all 4 tabs (verify via role="tab" elements)
- Unit test: Tab click switches content (verify conditional rendering of tab content)
- Integration test: GET /foundation-progress returns 4 auto-initialized records
- Unit test: LearnLayout shows correct phase-gated tabs for Phase 1 user
- E2E: Navigate to /learn/foundations → verify 4 tabs visible
- E2E: Navigate to /learn/flashcards → verify redirect to /learn/foundations

## Implementation Status

- **Status**: Completed
- **Last Update**: June 18, 2026
- **PR/Key Commit**: b7bbd3c (feat(epic-18): implement Story 18.1 Foundations Page Structure)
