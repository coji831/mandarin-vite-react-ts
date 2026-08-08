# Implementation 23-3: Chengyu UI

> **BR Reference:** `docs/business-requirements/epic-23-idiom-database/story-23-3-chengyu-ui.md`
> **Epic IMP:** `docs/issue-implementation/epic-23-idiom-database/README.md`
> **Status:** Complete
> **Last Update:** August 8, 2026

## Technical Scope

Build the `features/chengyu` frontend feature (service → hooks → components → types), the Phase-4-gated `/learn/chengyu` page, the LexicalHub `ChengyuHub` detail panel, TTS audio for the idiom + example sentences, related-idiom cross-links, and character/word cross-linking. Wire the route, register the hub entity, and deliver Storybook (MSW) + tests. Depends on Story 23.2's endpoints + `ROUTE_PATTERNS` constants; UI can be scaffolded against `chengyu-handlers.ts` (MSW, scaffolded by 23.2) in parallel with 23.2.

**Files:**

- `apps/frontend/src/features/chengyu/index.ts` — **NEW**: barrel.
- `apps/frontend/src/features/chengyu/types/chengyu.ts` — **NEW**: frontend data types (`ChengyuSegmentEntityType`, `ChengyuSegment`, `ChengyuExample`, `ChengyuRelatedIdiom`, `ChengyuSummary`, `ChengyuDetail`, `ChengyuListResponse`, `ChengyuData`, `ChengyuFilter`).
- `apps/frontend/src/features/chengyu/services/chengyuService.ts` — **NEW**: the ONLY file importing `apiClient`; uses `ROUTE_PATTERNS.chengyuIdioms` / `chengyuIdiomById`; module-level cache (pattern: `radicalsService`).
- `apps/frontend/src/features/chengyu/hooks/useChengyu.ts` — **NEW**: `useChengyu` (list + debounced search + filter state) + `useChengyuDetail` (detail self-fetch for the hub); request-seq ref drops stale responses.
- `apps/frontend/src/features/chengyu/utils/chengyuData.ts` — **NEW**: pure helpers `mapChengyuApiToData`, `segmentToEntityRef` (unit-tested).
- `apps/frontend/src/features/chengyu/components/ChengyuFilterBar.tsx` — **NEW**: `SearchInput` + `FilterChip` (Theme + Era).
- `apps/frontend/src/features/chengyu/components/ChengyuList.tsx` — **NEW**: card list + loading/empty/error+retry shells.
- `apps/frontend/src/features/chengyu/components/ChengyuCard.tsx` — **NEW**: idiom card (chengyu, pinyin, figurative meaning, era/theme badges).
- `apps/frontend/src/features/chengyu/components/ChengyuHub.tsx` — **NEW**: hub detail panel (re-exported via the feature barrel).
- `apps/frontend/src/features/chengyu/components/ChengyuHub.stories.tsx` — **NEW**: hub Storybook story (MSW).
- `apps/frontend/src/features/chengyu/**/__tests__/*.test.ts(x)` — **NEW**: unit + integration tests.
- `apps/frontend/src/pages/learn/chengyu/ChengyuPage.tsx` — **NEW**: page container (`usePhaseGate`, filter bar + list, opens hub).
- `apps/frontend/src/pages/learn/chengyu/ChengyuPageFull.stories.tsx` — **NEW**: page Storybook story (MSW; mirrors `pages/learn/grammar/GrammarPageFull.stories.tsx`).
- `apps/frontend/src/router/LearnRoutes.tsx` — **UPDATE**: replace `<ContentPlaceholderPage title="Chengyu" />` with `<PhaseGate requiredPhase={4}><ChengyuPage /></PhaseGate>`.
- `apps/frontend/src/features/lexical-hub/entityHubRegistry.tsx` — **UPDATE**: `chengyu` → `lazy(() => import("features/chengyu").then((m) => ({ default: m.ChengyuHub })))`.
- `apps/frontend/src/mocks/handlers/chengyu-handlers.ts` — **USED**: 23.3 imports `chengyuHandlers.default()` in stories (consumption contract — see Technical Challenges); handlers owned/registered by 23.2, never re-created here.

## Implementation Details

### Architecture decisions (owning story 23.3)

1. **Frontend: custom `features/chengyu` feature page** (not the shared `ContentBrowser`) — `ChengyuPage` composes feature-specific components (`ChengyuFilterBar`, `ChengyuList`, `ChengyuCard`, `ChengyuHub`).
   - Rationale: Same rationale as grammar (Epic 22) — `ContentBrowser` is used only at `/library` with a mock source and has no detail-view wiring; its `ContentItem` shape cannot carry story/literal/figurative meanings/examples/segments. The established pattern for real learn pages is a custom feature (`pages/learn/grammar/GrammarPage.tsx`, `pages/learn/radicals/RadicalsPage.tsx`).
   - Alternatives considered: Implementing a real `ContentSource` for `ContentBrowser` (rejected — would require extending `ContentItem`/`ContentCard`/detail flow).
   - Implications: New feature folder `apps/frontend/src/features/chengyu/`; page at `apps/frontend/src/pages/learn/chengyu/ChengyuPage.tsx`; route in `LearnRoutes.tsx` swaps `ContentPlaceholderPage` for `<PhaseGate requiredPhase={4}><ChengyuPage /></PhaseGate>`.

2. **Detail view via LexicalHub `ChengyuHub`** — register `chengyu` in `entityHubRegistry` (lazy `import("features/chengyu")`) so `openHub({ entityType: "chengyu", entityId, label })` opens the idiom detail; the idiom's 4 characters and example tokens call `openHub({ entityType: "character" | "word", entityId, label })`.
   - Rationale: The hub already owns entity detail with modal + navigation stack; `chengyu` is already a valid `EntityType` (`apps/frontend/src/shared/types/hub.ts`) with a `NotImplemented` placeholder.
   - Alternatives considered: Local expandable detail panel (rejected — duplicates hub; breaks cross-linking).
   - Implications: All hub opens go through `openHub()` from `shared/hub-entry` — never direct `useHubStore` calls.

3. **Related-idiom cross-links — rendering from `relatedIdioms[]`** — the hub renders `relatedIdioms[]` (each `{ id: cy_XXXX, chengyu, relationType }`) sourced from the detail endpoint's `relatedIdioms[]` (which 23.1 seeds via `ChengyuRelation` and 23.2 returns), and opens the related idiom's hub on click — mirroring `GrammarPatternRelation`'s `relatedPatterns`. **The `ChengyuRelation` model half of this decision lives in story-23.1 (Prisma spec).**
   - Rationale: Relationally-clean related-idiom cross-links with FK integrity and a `relationType`; consistent with the BR's related-idioms plan.
   - Implications: `ChengyuRelation` is seeded in dependency order after `Chengyu` (23.1); the detail endpoint includes `relatedIdioms[]` (23.2); the hub renders them (23.3).

4. **Audio on-demand via shared audio manager** — the full idiom and each example sentence get a play button backed by `useAudioItemPlayback().play(chinese, { textIsChinese: true })` → shared AudioManager → `POST /v1/tts` (optionalAuth, GCS-backed).
   - Rationale: Same mechanism as word audio, readers per-sentence audio, and grammar example audio; `POST /v1/tts` is `optionalAuth` so guests and users both work.
   - Alternatives considered: Stored/pre-generated audio fields in the data model (rejected — asset lifecycle complexity for a reference dataset).
   - Implications: No data-model audio fields; audio is a pure UI concern in story 23.3.

### Data mapping — `mapChengyuApiToData`

The service maps API payloads to the feature's display model (pure function, unit-tested), mirroring `mapGrammarApiToData`:

```typescript
export interface ChengyuData {
  id: string; // content_id "cy_XXXX"
  chengyu: string;
  pinyin: string;
  literalMeaning: string;
  figurativeMeaning: string;
  era: string;
  theme: string;
  exampleCount: number;
  previewExample?: string;
  examples?: ChengyuExampleData[];
  relatedIdioms?: { id: string; chengyu: string; relationType: string }[];
}
```

### Segment → token click → openHub

Each example renders `segments[]`; tokens with `entityId` are clickable and open the hub through the single entry point. `segmentToEntityRef` (pure util, unit-tested) maps a segment to the hub `EntityRef`. ⚠️ **Apply the Epic 22 grammar→hub glyph contract (22.3 bug fix):** the seed/API stores `entityId` as the DB content_id (`ch_20070`, `w_00487`) while the character/word hubs + APIs are **glyph-keyed** (书, 桌子) — translate content_id → glyph (`segment.text`) for `character`/`word`; other entity types keep content_id. Re-verify in-browser once 23.2 lands.

### Audio wiring

Per-idiom + per-example play buttons reuse the shared audio manager — no stored audio fields:

```typescript
const { play } = useAudioItemPlayback();
// idiom:   <button onClick={() => play(idiom.chengyu, { textIsChinese: true })}>🔊</button>
// example: <button onClick={() => play(example.chinese, { textIsChinese: true })}>🔊</button>
```

`play` → shared AudioManager → `POST /v1/tts` (optionalAuth, GCS-backed); loading/paused states handled by the hook.

### Route + phase gate

`LearnRoutes.tsx` (verified: `/learn/chengyu` currently renders `<ContentPlaceholderPage title="Chengyu" />` with no phase gate — 23.3 swaps it):

```tsx
<Route
  path="chengyu"
  element={
    <PhaseGate requiredPhase={4}>
      <ChengyuPage />
    </PhaseGate>
  }
/>
```

The sidebar Learn-group Chengyu item already has `requiredPhase: 4` (`learnNav.ts`) — no nav change.

### Hub registration

`entityHubRegistry.tsx` replaces the `chengyu: NotImplemented` entry:

```tsx
chengyu: lazy(() =>
  import("features/chengyu").then((m) => ({ default: m.ChengyuHub })),
),
```

### Component Relationships (frontend slice)

- `services/chengyuService.ts` — **NEW**: all `apiClient` calls (`ROUTE_PATTERNS.chengyuIdioms`, `ROUTE_PATTERNS.chengyuIdiomById`); module-level cache (pattern: `radicalsService`).
- `hooks/useChengyu.ts` — **NEW**: load list/detail, loading/error/refetch, filter state (search/theme/era).
- `pages/learn/chengyu/ChengyuPage.tsx` — **NEW** page container: phase-aware (`usePhaseGate`), renders filter bar + list; opens detail via `openHub`.
- `components/ChengyuFilterBar.tsx` — **NEW**: `SearchInput` + `FilterChip` for Theme + Era; reuses shared components.
- `components/ChengyuList.tsx` / `components/ChengyuCard.tsx` — **NEW**: idiom cards (chengyu, pinyin, figurative meaning, era/theme badges); loading skeleton / empty / error+retry states.
- `components/ChengyuHub.tsx` — **NEW**: hub detail panel (story → literal → figurative → modern usage; audio play; related-idiom cross-links; clickable characters/tokens).

## Architecture Integration

```
[Story 23.3: Chengyu UI]
├── features/chengyu/ (service → hooks → components → types)
│   ├── chengyuService.ts  → apiClient → ROUTE_PATTERNS.chengyuIdioms / chengyuIdiomById
│   └── useChengyu() → ChengyuPage (pages/learn/chengyu/ChengyuPage.tsx)
│       ├── ChengyuFilterBar / ChengyuList / ChengyuCard
│       └── card click → openHub({entityType:"chengyu", entityId}) → LexicalHub modal
├── LexicalHub (AppLayout modal)
│   └── entityHubRegistry.chengyu → lazy ChengyuHub
│       ├── narrative + literal/figurative meanings + modern usage; audio play (useAudioItemPlayback → POST /v1/tts)
│       ├── related-idiom cross-links → openHub({entityType:"chengyu", entityId}) (from relatedIdioms[])
│       └── segment token click → openHub({entityType:"character"|"word", entityId}) → CharacterHub/WordHub
├── Routing → LearnRoutes.tsx: PhaseGate requiredPhase={4} + ChengyuPage
└── Phase source → usePhaseGate() → /v1/progression/phase-gate (numeric; guests = 4)

Dependencies:
└── 23.2 → endpoints + ROUTE_PATTERNS constants (scaffoldable against MSW in parallel);
    chengyu-handlers.ts owned + registered by 23.2 — 23.3 consumes via `chengyuHandlers.default()` (contract — see Technical Challenges)
```

## Technical Challenges & Solutions

```
Problem: 23.3 starts before 23.2 ships (dependency chain).
Solution: MSW handlers (chengyu-handlers.ts, owned by 23.2 and registered in
         apps/frontend/src/mocks/server.ts) give 23.3 a realistic contract to develop
         against in parallel — stories import chengyuHandlers.default() directly via
         msw: { handlers: [...] } (pattern: PhoneticClustersPage.stories.tsx), never
         re-creating handlers; switch to live endpoints once 23.2 lands.

Problem: Related-idiom / segment tokens could carry null entityIds or the content_id↔glyph
         mismatch could break hub navigation (Epic 22's 22.2→22.3 hardening pattern).
Solution: 23.2's detail mapper guards null segments / null related rows (see story-23.2
         IMP); 23.3 applies segmentToEntityRef's content_id → glyph translation for
         character/word tokens and renders non-linked tokens as plain text. Re-verify
         in-browser after 23.2 lands.
```

Post-implementation deviations (recorded August 8, 2026):

```
Problem: Every idiom carries a UNIQUE theme (55 themes, 0 shared) while eras are compact
         (7: Warring States 32, Spring & Autumn 10, Qin–Han 4, Han 3, Three Kingdoms 4,
         Wei–Jin 1, Qin 1) — a FilterChip group for 55 themes would be unusable and each
         chip would select exactly one idiom.
Solution: Data-fact-driven split (documented in constants/chengyuFilters.ts): Theme = the
         shared `Dropdown` (55 options + "All themes"), Era = `FilterChip` group (7).
         Deviation from the IMP's "FilterChip (Theme + Era)" plan; both filter server-side
         via `?theme=` / `?era=` and are covered by ChengyuPage integration tests (era-chip
         + theme-dropdown filter paths).

Problem: `ChengyuHub.stories.tsx` lives in the feature folder (title `Features/Chengyu/...`),
         not under Pages/ — a Storybook location deviation.
Solution: Grandfathered as TD-005 in docs/guides/testing/known-failures.md (mirrors TD-004
         GrammarHub); do not flag or extend; migrate to a Pages/Layouts/Shared story when
         touched.

Problem: The Storybook iframe stays on `sb-preparing` for every story in this environment
         (confirmed identical for the pre-existing GrammarPage story) — the manager→preview
         channel never handshakes on a plain browser load, so pixel screenshots of the new
         chengyu stories could not be captured.
Solution: Environmental limitation, not a chengyu defect. Rendering is proven at the DOM
         level instead: 7/7 addon-vitest Storybook tests (ChengyuPageFull 4 + ChengyuHub 3)
         pass headlessly, asserting populated/loading/empty/error states and hub navigation.
```

Post-implementation — pagination & pager-detach (commit `c1b1c7b2`, August 8, 2026):

```
Problem: Browser full-flow test (PASS-with-issues) surfaced BUG-1 — the idiom list
         endpoint was already paginated server-side (page/pageSize), but the UI ignored
         it and the info + pager rendered inside the scrolling list region, scrolling
         out of view with the cards.
Solution: The UI now forwards page/pageSize with a page-scoped module cache, resets to
         page 1 on filter change, and renders a presentational ChengyuPagination footer
         as a flex sibling of the scroll container inside the page content Box — always
         visible while idioms scroll (populated state only; role="region" + aria-label
         "Chengyu list pagination"). No backend/MSW changes; ChengyuPage integration
         tests extended (footer sibling of scroll region; hidden in loading/empty/error);
         40 chengyu unit/integration + 5 Storybook tests pass. BUG-2 (900px responsive)
         is a pre-existing app-wide pattern, deferred (see epic IMP closure actuals).
```

### Doc Truth-Check

- [x] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` — `chengyuIdioms: "/v1/chengyu/idioms"` and `chengyuIdiomById: (id) => `/v1/chengyu/idioms/${id}`` now **EXIST verbatim** (shipped by story 23.2); `chengyuService.ts` calls both (list composes search/theme/era params, detail via `chengyuIdiomById(id)`); `ttsAudio` = `/v1/tts` verified present
- [x] Feature/module/component names verified against `apps/frontend/src/features/` — **pre-implementation baseline** (superseded by the Shipped-state actuals below): no `chengyu` feature existed; `entityHubRegistry` `chengyu: NotImplemented`; `LearnRoutes.tsx` `/learn/chengyu` = `ContentPlaceholderPage`; `learnNav.ts` chengyu item `requiredPhase: 4` (still true); `EntityType` includes `"chengyu"` (`apps/frontend/src/shared/types/hub.ts`)
- [x] Data source (static JSON vs Postgres/API) matches the backing service/repository code — API-driven via `apiClient` (all-in-DB)
- [x] All relative markdown links resolve (this story → `../README.md`, `story-23-1-chengyu-data.md`, `story-23-2-chengyu-backend-api.md`, IMP twin)
- [x] Last Updated / Last Update date is current (August 8, 2026 — same commit as the edit)

- [x] Shipped-state actuals (August 8, 2026) — feature folder `features/chengyu/` ships `index.ts` barrel + `types/`, `services/`, `hooks/`, `utils/`, `constants/` (incl. `chengyuFilters.ts`: 55 themes / 7 eras) + `components/` (ChengyuFilterBar, ChengyuList, ChengyuCard, ChengyuHub + per-component CSS + `ChengyuHub.stories.tsx`); page `pages/learn/chengyu/ChengyuPage.tsx` (+ `ChengyuPage.css` + `ChengyuPageFull.stories.tsx`) re-exported via `pages/learn/foundations/index.ts`; `LearnRoutes.tsx` `/learn/chengyu` = `<PhaseGate requiredPhase={4}><ChengyuPage /></PhaseGate>`; `entityHubRegistry.tsx` `chengyu` = `lazy(() => import("features/chengyu").then((m) => ({ default: m.ChengyuHub })))`. Tests: 37 unit/integration (chengyuData 9, useChengyu 5, chengyuService 8, ChengyuHub 7, ChengyuPage.integration 6, LearnRoutes.chengyu 2) + 7 Storybook (ChengyuPageFull 4 + ChengyuHub 3) all pass. Gates: `npm run build` (ChengyuHub own lazy chunk 14.01 kB), `npm run lint` 0 errors, design lint clean, `npm run design-audit` 0 errors, pre-delivery checklist compliant. Glyph contract confirmed: `segmentToEntityRef` translates character/word `content_id` → `segment.text` glyph (unit + hub integration DOM tests); the IMP's data-mapping spec and segment→hub contract match shipped code.

> **Note:** PR / Merge Date / Key Commit stay literal `TBD` until commit, filled same-commit; never merge with TBD.

## Testing Implementation

Per `testing-standards.instructions.md` (Testing Trophy):

- **Unit** — `mapChengyuApiToData` (mapping happy path + missing optional fields), `segmentToEntityRef` (linked vs null-entity tokens; content_id → glyph translation for character/word).
- **Integration (MSW)** — using `renderWithProviders` + `src/mocks/server` + `chengyu-handlers.ts`:
  - `chengyuService`: list with filters, detail, error/retry, module-level cache invalidation;
  - `useChengyu`: hook + MSW (happy path + filter change + error);
  - `ChengyuPage`: search/theme/era filtering, loading/empty/error+retry states;
  - `ChengyuHub`: detail render (story → literal → figurative → modern usage), audio play button invokes `useAudioItemPlayback`, related-idiom link opens the chengyu hub, token click opens CharacterHub (assert `openHub` called with `entityType: "character"`);
  - `LearnRoutes`: Phase-4 gate redirect (currentPhase < 4 → foundations).
- **Storybook (MSW)** — `ChengyuPageFull` (mirror `pages/learn/grammar/GrammarPageFull.stories.tsx`) + `ChengyuHub` stories; `npm run test-storybook`.
- **Static** — `npm run build`, `npm run lint`, `npx @google/design.md lint DESIGN.md`, `npm run design-audit`, `frontend-pre-delivery-checklist.instructions.md`.
