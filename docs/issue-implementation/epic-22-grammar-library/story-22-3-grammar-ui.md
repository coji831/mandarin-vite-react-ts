# Implementation 22-3: Grammar UI

> **BR Reference:** `docs/business-requirements/epic-22-grammar-library/story-22-3-grammar-ui.md`
> **Status:** Planned
> **Last Update:** August 4, 2026

## Technical Scope

Build the `features/grammar` frontend feature (service → hooks → components → types), the Phase-2-gated `/learn/grammar` page, the LexicalHub `GrammarHub` detail panel, TTS example-sentence audio, and character cross-linking. Wire the route, register the hub entity, and deliver Storybook (MSW) + tests. Depends on Story 22.2's endpoints + `ROUTE_PATTERNS` constants; UI can be scaffolded against `grammar-handlers.ts` (MSW) in parallel with 22.2.

**Files:**

- `apps/frontend/src/features/grammar/index.ts` — **NEW**: barrel.
- `apps/frontend/src/features/grammar/types/grammar.ts` — **NEW**: frontend data types (`GrammarPattern`, `GrammarPatternSummary`, `GrammarExample`, `GrammarSegment`).
- `apps/frontend/src/features/grammar/services/grammarService.ts` — **NEW**: the ONLY file importing `apiClient`; uses `ROUTE_PATTERNS.grammarPatterns` / `grammarPatternById`; module-level cache (pattern: `radicalsService`).
- `apps/frontend/src/features/grammar/hooks/useGrammar.ts` — **NEW**: list/detail load, loading/error/refetch, filter state (search/hsk/phase).
- `apps/frontend/src/features/grammar/components/GrammarFilterBar.tsx` — **NEW**: `SearchInput` + `FilterChip` (HSK + Phase).
- `apps/frontend/src/features/grammar/components/GrammarList.tsx` — **NEW**: card list + loading/empty/error+retry shells.
- `apps/frontend/src/features/grammar/components/GrammarCard.tsx` — **NEW**: pattern card (name, structure, HSK badge, phase lock badge).
- `apps/frontend/src/features/grammar/components/GrammarHub.tsx` — **NEW**: hub detail panel (re-exported via the feature barrel).
- `apps/frontend/src/features/grammar/components/GrammarHub.stories.tsx` — **NEW**: hub Storybook story (MSW).
- `apps/frontend/src/features/grammar/**/__tests__/*.test.ts(x)` — **NEW**: unit + integration tests.
- `apps/frontend/src/pages/learn/grammar/GrammarPage.tsx` — **NEW**: page container (`usePhaseGate`, filter bar + list, opens hub).
- `apps/frontend/src/pages/learn/grammar/GrammarPageFull.stories.tsx` — **NEW**: page Storybook story (MSW; mirrors `pages/learn/readers/ReadersPageFull.stories.tsx`).
- `apps/frontend/src/pages/learn/foundations/index.ts` — **UPDATE**: re-export `GrammarPage`.
- `apps/frontend/src/router/LearnRoutes.tsx` — **UPDATE**: replace `<ContentPlaceholderPage title="Grammar" />` with `<PhaseGate requiredPhase={2}><GrammarPage /></PhaseGate>`.
- `apps/frontend/src/features/lexical-hub/entityHubRegistry.tsx` — **UPDATE**: `grammar` → `lazy(() => import("features/grammar").then((m) => ({ default: m.GrammarHub })))`.
- `apps/frontend/src/mocks/handlers/grammar-handlers.ts` — **USED**: stories import directly from this module via `msw: { handlers: [grammarHandlers.default()] }` (pattern: `PhoneticClustersPage.stories.tsx`); 22.3 does **not** create or duplicate handlers (owned by 22.2, registered in `src/mocks/server.ts`).

## Implementation Details

### Data mapping — `mapGrammarApiToData`

The service maps API payloads to the feature's display model (pure function, unit-tested):

```typescript
export interface GrammarPatternData {
  id: string; // content_id "gr_XXXX"
  name: string;
  structure: string;
  phase: number; // 2 | 3 | 4
  hskLevel: number | null;
  exampleCount: number;
  previewExample?: string;
  examples?: GrammarExampleData[];
  relatedPatterns?: { id: string; name: string }[];
}

export function mapGrammarApiToData(item: GrammarPatternSummary): GrammarPatternData {
  return {
    id: item.id,
    name: item.name,
    structure: item.structure,
    phase: item.phase,
    hskLevel: item.hskLevel,
    exampleCount: item.exampleCount,
    previewExample: item.previewExample,
  };
}
```

### Filter state + lock derivation

- `useGrammar` holds `{ search, hskLevel, phase }`; the service composes `params` from non-empty filters and refetches on change.
- Lock derivation is a pure function sourced from the phase gate (never `userStore`):

```typescript
// phase source: usePhaseGate() → currentPhase (numeric 2|3|4; guests = 4)
export function isPatternLocked(patternPhase: number, currentPhase: number): boolean {
  return patternPhase > currentPhase; // Phase 3/4 patterns → locked/preview cards for Phase-2 users
}
```

### Segment → token click → openHub

Each example renders `segments[]`; tokens with `entityId` are clickable and open the Character Hub through the single entry point:

```typescript
import { openHub } from "shared/hub-entry";

// inside GrammarHub example segment render
function onTokenClick(seg: GrammarSegment) {
  if (!seg.entityId || !seg.entityType) return; // plain text / non-linked token
  openHub({ entityType: seg.entityType, entityId: seg.entityId, label: seg.pinyin ?? seg.text });
}
```

Token clicks navigate the existing hub stack (word→character), never a bespoke modal. Non-linked tokens render as plain text.

### Audio wiring

Per-example play buttons reuse the shared audio manager — no stored audio fields:

```typescript
const { play } = useAudioItemPlayback();
// <button onClick={() => play(example.chinese, { textIsChinese: true })}>🔊</button>
```

`play` → shared AudioManager → `POST /v1/tts` (optionalAuth, GCS-backed); loading/paused states handled by the hook.

### Route + phase gate

`LearnRoutes.tsx` (mirrors the readers route at Phase 3):

```tsx
<Route
  path="grammar"
  element={
    <PhaseGate requiredPhase={2}>
      <GrammarPage />
    </PhaseGate>
  }
/>
```

`pages/learn/foundations/index.ts` adds `export { GrammarPage } from "../grammar/GrammarPage";`.

### Hub registration

`entityHubRegistry.tsx` replaces the `grammar: NotImplemented` entry:

```tsx
grammar: lazy(() =>
  import("features/grammar").then((m) => ({ default: m.GrammarHub })),
),
```

## Architecture Integration

```
[Story 22.3: Grammar UI]
├── features/grammar/ (service → hooks → components → types)
│   ├── grammarService.ts  → apiClient → ROUTE_PATTERNS.grammarPatterns / grammarPatternById
│   └── useGrammar() → GrammarPage (pages/learn/grammar/GrammarPage.tsx)
│       ├── GrammarFilterBar / GrammarList / GrammarCard
│       └── card click → openHub({entityType:"grammar", entityId}) → LexicalHub modal
├── LexicalHub (AppLayout modal)
│   └── entityHubRegistry.grammar → lazy GrammarHub
│       ├── examples render (Chinese/pinyin/English) + play (useAudioItemPlayback → POST /v1/tts)
│       └── segment token click → openHub({entityType:"character", entityId}) → CharacterHub
├── Routing → LearnRoutes.tsx: PhaseGate requiredPhase={2} + GrammarPage
└── Phase source → usePhaseGate() → /v1/progression/phase-gate (numeric; guests = 4)

Dependencies:
└── 22.2 → endpoints + ROUTE_PATTERNS constants (scaffoldable against MSW in parallel)
```

## Technical Challenges & Solutions

```
Problem: Locked/preview state could drift if phase is sourced from the wrong place.
Solution: Derive `isLocked` from usePhaseGate()'s numeric currentPhase (guests = 4),
         never from userStore; pure `isPatternLocked()` is unit-tested.

Problem: Hub opens scattered across components would break cross-entity navigation.
Solution: All opens route through openHub() from shared/hub-entry; never useHubStore
         directly (enforced by convention + code review).

Problem: Example-sentence audio edge cases (multi-char sentence, token mis-segmentation).
Solution: Reuse the shared useAudioItemPlayback hook — play the full example.chinese with
         { textIsChinese: true }; the shared AudioManager/TTS handles fallback and
         arbitration (pattern proven in readers).

Problem: 22.3 starts before 22.2 ships (dependency chain).
Solution: MSW handlers (grammar-handlers.ts, owned by 22.2 and registered in
         apps/frontend/src/mocks/server.ts) give 22.3 a realistic contract to develop
         against in parallel — stories import grammarHandlers.default() directly via
         msw: { handlers: [...] } (pattern: PhoneticClustersPage.stories.tsx), never
         re-creating handlers; switch to live endpoints once 22.2 lands.
```

### Doc Truth-Check

- [ ] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (`grammarPatterns`, `grammarPatternById` — added in 22.2; `grammarService.ts` calls these verbatim)
- [ ] Feature/module/component names verified against `apps/frontend/src/features/` (`features/grammar/` new; `entityHubRegistry` `grammar` key wired to `GrammarHub`)
- [ ] Data source (static JSON vs Postgres/API) matches the backing service/repository code — API-driven via `apiClient` (all-in-DB)
- [ ] All relative markdown links resolve (this story → `../README.md`, `story-22-1-grammar-data.md`, `story-22-2-grammar-backend-api.md`, IMP twin)
- [ ] Last Updated / Last Update date is current (August 4, 2026 — same commit as the edit)

> **Note:** PR / Merge Date / Key Commit stay literal `TBD` until commit, filled same-commit; never merge with TBD.

## Testing Implementation

Per `testing-standards.instructions.md` (Testing Trophy):

- **Unit** — `mapGrammarApiToData` (mapping happy path + missing optional fields), `isPatternLocked` (phase boundaries: equal → false, greater → true), segment→`openHub` ref mapping (linked vs null-entity tokens).
- **Integration (MSW)** — using `renderWithProviders` + `src/mocks/server` + `grammar-handlers.ts`:
  - `grammarService`: list with filters, detail, error/retry, module-level cache invalidation;
  - `useGrammar`: hook + MSW (happy path + filter change + error);
  - `GrammarPage`: search/HSK/phase filtering, locked cards render for higher-phase patterns, loading/empty/error+retry states;
  - `GrammarHub`: detail render (structure, explanation, examples), audio play button invokes `useAudioItemPlayback`, word-token click opens CharacterHub (assert `openHub` called with `entityType: "character"`);
  - `LearnRoutes`: Phase-2 gate redirect (currentPhase 1 → `/learn/foundations`).
- **Storybook (MSW)** — `GrammarPageFull` (mirror `pages/learn/readers/ReadersPageFull.stories.tsx`) + `GrammarHub` stories; `npm run test-storybook`.
- **Static** — `npm run build`, `npm run lint`, `npx @google/design.md lint DESIGN.md`, `npm run design-audit`, `frontend-pre-delivery-checklist.instructions.md`.
