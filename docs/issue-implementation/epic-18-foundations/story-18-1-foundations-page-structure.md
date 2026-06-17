# Implementation 18-1: Foundations Page Structure

> Template note: headings include markers like `[Required]` and `[Optional]` to indicate guidance. When creating published/read docs, remove those bracketed tokens from the headings.

## Technical Scope

Create the `foundations` feature folder, route, layout, navigation, and phase-gating infrastructure for Phase 1 learning.

**Files to create:**

- `apps/frontend/src/features/foundations/index.ts` — barrel exports
- `apps/frontend/src/features/foundations/components/FoundationsPage.tsx` — 4-tab page layout
- `apps/frontend/src/features/foundations/components/PinyinTab.tsx` — placeholder (Story 18.2)
- `apps/frontend/src/features/foundations/components/TonesTab.tsx` — placeholder (Story 18.3)
- `apps/frontend/src/features/foundations/components/StrokeReferenceTab.tsx` — placeholder (Story 18.4)
- `apps/frontend/src/features/foundations/components/StrokeAnimTab.tsx` — placeholder (Story 18.4)
- `apps/frontend/src/features/foundations/components/FoundationsProgressBar.tsx` — progress indicator
- `apps/frontend/src/features/foundations/services/foundationsService.ts` — API calls
- `apps/frontend/src/features/foundations/hooks/useFoundationsProgress.ts` — data hook
- `apps/frontend/src/features/foundations/types/index.ts` — type definitions
- `packages/shared-constants/src/foundations.ts` — FOUNDATION_SECTIONS constant

**Files to update:**

- `apps/frontend/src/router/LearnRoutes.tsx` — add `/foundations` route + flashcards redirect
- `apps/frontend/src/shared/layouts/LearnLayout.tsx` — phase-gated TabBar
- `apps/frontend/src/shared/layouts/AppLayout.tsx` — 5-item global nav
- `apps/frontend/src/shared/constants/paths.ts` — verify route constants exist
- `packages/shared-constants/src/index.js` — export new foundations module
- `apps/backend/src/modules/progression/` — new module (shared with Stories 18.6)

**Files to remove:**

- None yet (FlashCardPage removed in Story 18.5 when Character Detail Hub replaces it)

## Implementation Details

```typescript
// FoundationsPage.tsx — Main orchestration component
function FoundationsPage() {
  const [activeTab, setActiveTab] = useState<FoundationSectionId>("pinyin");
  const { progress, isLoading } = useFoundationsProgress();

  return (
    <div className="foundations-page">
      <TabBar
        tabs={FOUNDATION_SECTIONS.map(id => ({
          id,
          label: TAB_LABELS[id], // { pinyin: "📗 Pinyin", tones: "🎵 Tones", ... }
          completed: progress?.find(p => p.sectionId === id)?.completed ?? false,
        }))}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <div className="tab-content">
        {activeTab === "pinyin" && <PinyinTab />}
        {activeTab === "tones" && <TonesTab />}
        {activeTab === "strokes" && <StrokeReferenceTab />}
        {activeTab === "animations" && <StrokeAnimTab />}
      </div>
      <FoundationsProgressBar completed={completedCount} total={FOUNDATION_SECTIONS.length} />
    </div>
  );
}
```

```typescript
// foundationsService.ts — Backend API calls
async function getFoundationProgress(): Promise<FoundationProgress[]> {
  const response = await apiClient.get("/api/v1/progression/foundation-progress");
  return response.data;
}

async function markSectionCompleted(sectionId: FoundationSectionId): Promise<void> {
  await apiClient.put(`/api/v1/progression/foundation-progress/${sectionId}`, {
    completed: true,
  });
}
```

## Architecture Integration

```
Frontend                          Backend
───────────────────────           ───────────────────────
router/LearnRoutes.tsx
  └── /foundations
       └── FoundationsPage
            ├── TabBar (reused from shared/ContentBrowser)
            ├── [PinyinTab | TonesTab | StrokeRefTab | StrokeAnimTab]
            └── FoundationsProgressBar
                 └── foundationsService.ts ──HTTP──► GET /api/v1/progression/foundation-progress

shared/layouts/LearnLayout.tsx
  └── Phase-gated TabBar
       └── usePhaseGate() ──HTTP──► GET /api/v1/progression/phase-gate

packages/shared-constants/src/foundations.ts
  └── FOUNDATION_SECTIONS — imported by both frontend and backend
```

## Technical Challenges & Solutions

```
Problem: Backend needs to know which foundation sections exist to validate progress submissions,
but content is static JSON on the frontend.
Solution: Define FOUNDATION_SECTIONS in `packages/shared-constants/` — imported by both.
Backend auto-initializes records on first GET and validates sectionIds on PUT.
```

## Testing Implementation

- Unit test: FoundationsPage renders all 4 tabs
- Unit test: TabBar switches content on click
- Integration test: GET /foundation-progress returns 4 auto-initialized records
- Unit test: LearnLayout shows correct phase-gated tabs for Phase 1 user
- E2E: Navigate to /learn/foundations → verify 4 tabs visible
- E2E: Navigate to /learn/flashcards → verify redirect to /learn/foundations
