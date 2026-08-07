# Story 23.3: Chengyu UI

**Last Update:** August 7, 2026

## Description

**As a** learner,
**I want to** browse idioms by theme/era, read their narrative origin stories, play audio, and follow related-idiom and character cross-links,
**So that** I understand cultural context beyond literal translations.

## Business Value

This story delivers the learner-facing value of the epic. It replaces the `/learn/chengyu` placeholder with a real, Phase-4-gated reference library: searchable by idiom/pinyin/English keyword, filterable by theme and era, with a narrative-first detail view. The detail view (LexicalHub `ChengyuHub`) presents historical context → literal meaning → figurative meaning → modern usage, cross-links every idiom's 4 characters into the Character Hub, follows related-idiom links from the DB junction, and plays idiom + example audio on demand — turning isolated idiom references into a connected cultural learning surface. It reuses the existing hub, audio, phase-gate, and shared-component infrastructure rather than building bespoke UI.

## Acceptance Criteria

- [ ] `features/chengyu` feature created (service → hooks → components → types); `apiClient` used only in `chengyuService.ts` (per `frontend-api-client.instructions.md`).
- [ ] `pages/learn/chengyu/ChengyuPage.tsx` created; `/learn/chengyu` route replaced from `ContentPlaceholderPage` to `<PhaseGate requiredPhase={4}><ChengyuPage /></PhaseGate>` in `LearnRoutes.tsx`; sidebar Learn-group item already `requiredPhase: 4` (no nav change).
- [ ] Search by idiom/pinyin/English keyword; theme filter and era filter (server-side via `GET /v1/chengyu/idioms`).
- [ ] Idiom card list → detail view showing `story` (narrative), `literalMeaning`, `figurativeMeaning`, pinyin, era/theme, and modern-usage examples (Chinese, pinyin, English).
- [ ] `chengyu` registered in `entityHubRegistry` → lazy-loaded `ChengyuHub` detail panel (replaces the `NotImplemented` placeholder); opened via `openHub({ entityType: "chengyu", entityId, label })` from `shared/hub-entry`.
- [ ] **Related-idiom cross-links** shown in `ChengyuHub` (from `ChengyuRelation` rows; each shows the related idiom + `relationType`) — consistent with the BR's related-idioms plan.
- [ ] The idiom's 4 characters are clickable → Character Hub via `openHub({ entityType: "character", entityId, label })`; modern-usage example tokens clickable per `segments`.
- [ ] Full idiom + example sentences playable via the shared audio manager (`useAudioItemPlayback` → `/v1/tts`, optionalAuth); no stored audio fields in the data model.
- [ ] Tests + Storybook stories with MSW per `testing-standards.instructions.md`; static gates pass (`npm run build`, `npm run lint`, design lint, `frontend-pre-delivery-checklist.instructions.md`).
- [ ] BR ↔ IMP ↔ story files linked bidirectionally; all relative links resolve; Last Update current in the same commit.

## Business Rules

1. **Service-layer mandate** — all HTTP goes through `features/chengyu/services/chengyuService.ts`; hooks/components never import `apiClient` directly.
2. **Hub entry discipline** — every hub open goes through `openHub()` from `shared/hub-entry`; never call `useHubStore` directly from components.
3. **Audio reuse** — idiom + example audio uses `useAudioItemPlayback().play(chinese, { textIsChinese: true })` → `POST /v1/tts` (optionalAuth); no audio fields/assets added to the data model.
4. **Shared component reuse** — check `src/shared/components/` and `.github/component-registry.json` (Card, FilterChip, Tabs, SearchInput, ErrorScreen, LoadingScreen, Skeleton, Badge) before creating new UI; never reimplement shared components.
5. **Phase source** — gating and any lock states source the phase from `usePhaseGate()` → `/v1/progression/phase-gate` (numeric), never from `userStore`.
6. **Pre-segmented tokens** — no runtime segmenter; tokens render from the seeded `segments` arrays; tokens with no linked entity render as plain text.
7. **Data-resilient shells** — every data surface covers loading (skeleton), empty, and error+retry states per `frontend-api-client.instructions.md` and the pre-delivery checklist.
8. **Custom feature page, not ContentBrowser** — `ContentBrowser` stays the freeroam `/library` surface; chengyu gets a real feature page (its `ContentItem` shape cannot carry story/literal/figurative meanings/examples/segments).

## Related Issues

- Epic 23: Chengyu (Idiom) Narratives — BR (`README.md`) (epic parent)
- **Story 23.2: Chengyu Backend API** ([BR](story-23-2-chengyu-backend-api.md)) (dependency — endpoints + `ROUTE_PATTERNS`; scaffoldable against MSW in parallel)
- **Story 23.1: Chengyu Data** ([BR](story-23-1-chengyu-data.md)) (dependency — content, transitive via 23.2)
- **Implementation (IMP twin):** `story-23-3-chengyu-ui.md` → `../../issue-implementation/epic-23-idiom-database/story-23-3-chengyu-ui.md`

## Implementation Status

- **Status**: Planned
- **PR**: TBD (pending)
- **Merge Date**: N/A
- **Key Commit**: N/A
