# Story 22.3: Grammar UI

**Last Update:** August 5, 2026 (Story 22.3 complete — grammar UI delivered)

## Description

**As a** learner,
**I want to** browse and search grammar patterns with detail views, audio, and character cross-linking,
**So that** I can reference sentence structures while studying — bridging vocabulary study and connected reading.

## Business Value

This story delivers the learner-facing value of the epic. It replaces the `/learn/grammar` placeholder with a real, Phase-2-gated reference library: searchable by keyword/pattern name, filterable by HSK level and phase, with Phase 3/4 patterns visible as locked/preview cards (the platform's "discovery, not gate" stance). The detail view (LexicalHub `GrammarHub`) cross-links every example word into the Character Hub and plays example-sentence audio on demand — turning isolated grammar reference into a connected learning surface. It is the first feature that ties vocabulary ↔ grammar ↔ reading together, and it reuses the existing hub, audio, phase-gate, and shared-component infrastructure rather than building bespoke UI.

## Acceptance Criteria

- [x] `features/grammar` feature created (service → hooks → components → types); `apiClient` used only in `features/grammar/services/grammarService.ts` (per `frontend-api-client.instructions.md`).
- [x] `/learn/grammar` renders the real Grammar page (`pages/learn/grammar/GrammarPage.tsx`, replaces `ContentPlaceholderPage`) wrapped in route-level `PhaseGate requiredPhase={2}` (mirrors the readers route at Phase 3).
- [x] Search by English keyword or pattern name; HSK level filter; phase filter with locked/preview states for higher-phase patterns (`isLocked` when `pattern.phase > currentPhase`).
- [x] Pattern card list → detail view showing `structure`, `explanation`, and examples (Chinese, pinyin, English).
- [x] `grammar` registered in `entityHubRegistry` → lazy-loaded `GrammarHub` detail panel (replaces the `NotImplemented` placeholder).
- [x] Example word tokens clickable → Character Detail Hub via `openHub({ entityType: "character", entityId, label })`.
- [x] Example sentences playable via the shared audio manager (`useAudioItemPlayback` → `POST /v1/tts`, optionalAuth); no stored audio fields in the data model.
- [x] Tests + Storybook stories with MSW per `testing-standards.instructions.md`; static gates pass (`npm run build`, `npm run lint`, design lint, `frontend-pre-delivery-checklist.instructions.md`).
- [x] BR ↔ IMP ↔ story files linked bidirectionally; all relative links resolve; Last Update current in the same commit.

## Business Rules

1. **Service-layer mandate** — all HTTP goes through `features/grammar/services/grammarService.ts`; hooks/components never import `apiClient` directly.
2. **Hub entry discipline** — every hub open goes through `openHub()` from `shared/hub-entry`; never call `useHubStore` directly from components.
3. **Audio reuse** — example-sentence audio uses `useAudioItemPlayback().play(chinese, { textIsChinese: true })` → `POST /v1/tts` (optionalAuth); no audio fields/assets added to the data model.
4. **Shared component reuse** — check `src/shared/components/` and `.github/component-registry.json` (Card, FilterChip, Tabs, SearchInput, ErrorScreen, LoadingScreen, Skeleton, Badge) before creating new UI; never reimplement shared components.
5. **Phase source** — lock states and gating source the phase from `usePhaseGate()` → `/v1/progression/phase-gate` (numeric), never from `userStore`.
6. **Data-resilient shells** — every data surface covers loading (skeleton), empty, and error+retry states per `frontend-api-client.instructions.md` and the pre-delivery checklist.
7. **Custom feature page, not ContentBrowser** — `ContentBrowser` stays the freeroam `/library` surface; grammar gets a real feature page (its `ContentItem` shape cannot carry structure/examples/segments).

## Related Issues

- Epic 22: Grammar Pattern Library — BR (`../README.md`) (epic parent)
- **Story 22.2: Grammar Backend API** ([BR](story-22-2-grammar-backend-api.md)) (dependency — endpoints + `ROUTE_PATTERNS`; scaffoldable against MSW in parallel)
- **Story 22.1: Grammar Data** ([BR](story-22-1-grammar-data.md)) (dependency — content, transitive via 22.2)

## Implementation Status

- **Status**: Complete
- **PR**: N/A (direct commit — no PR)
- **Merge Date**: N/A
- **Key Commit**: `49d29f36`
