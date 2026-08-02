# Implementation 21-20: Classification-Aware Mnemonic UI

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-20-classification-aware-mnemonic-ui.md`
>
> **Architect Review:** July 31, 2026 — Resolved 7 issues (folder placement, classification labels, 3-vs-4 layout gap, Storybook location, service naming, integration plan, backend response)

## Technical Scope

Create a new `MnemonicCard` component in `shared/components/MnemonicCard/` with 4 distinct layouts based on character classification. Integrate it into the existing `HubMnemonicSection` state machine. Add `classification` to the backend mnemonic API response.

## File Manifest

### NEW — `apps/frontend/src/shared/components/MnemonicCard/`

| File                                   | Purpose                                                                                                                                            |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MnemonicCard.tsx`                     | Main component: receives `classification`, `story`, `radicalIds`, `character`, action props; selects layout via `resolveEffectiveClassification()` |
| `MnemonicCard.css`                     | Shared card styles                                                                                                                                 |
| `PictographLayout.tsx`                 | Layout A: etymology + oracle bone + "Try visualizing" note                                                                                         |
| `PhonoSemanticLayout.tsx`              | Layout B: two-column meaning clue / sound clue grid + story below                                                                                  |
| `CompoundIdeographLayout.tsx`          | Layout C: "Component A + Component B → Combined meaning" breakdown + story                                                                         |
| `SimpleIdeographLayout.tsx`            | Layout D: concise direct explanation + optional AI story                                                                                           |
| `regenerationGuidance.ts`              | Pure function: returns tip text by classification string                                                                                           |
| `index.ts`                             | Barrel — re-exports `MnemonicCard`                                                                                                                 |
| `__stories__/MnemonicCard.stories.tsx` | 4 layouts × 3 states (loading, populated, error)                                                                                                   |
| `__tests__/MnemonicCard.test.tsx`      | Layout selection + guidance logic unit tests                                                                                                       |

### MODIFIED — Frontend

| File                                                                 | Change                                                                                                                                                                                                                                                                                            |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared/components/index.tsx`                                        | Add `export { MnemonicCard } from "./MnemonicCard"`                                                                                                                                                                                                                                               |
| `character-hub/stores/mnemonicStore.ts`                              | Add `classification: string \| null` and `radicalIds: string[]` to `Display` state type. Update `loadMnemonic` to store classification from API response. Keep `Pictograph` state as shortcut routing to `MnemonicCard` with `classification="pictograph"`.                                       |
| `character-hub/components/HubMnemonicSection/HubMnemonicSection.tsx` | Replace `MnemonicDisplay` + `MnemonicPictograph` → `MnemonicCard`. Pass `classification`, `radicalIds`, `character`, `story`, `isEdited` props. Use `MnemonicCard` with `isLoading`/`isGenerating` for Loading/Generating states. Keep `MnemonicEditing`, `MnemonicEmpty`, `MnemonicError` as-is. |
| `character-hub/components/HubMnemonicSection/index.ts`               | Remove `MnemonicDisplay` and `MnemonicPictograph` exports.                                                                                                                                                                                                                                        |
| `character-hub/services/characterService.ts`                         | Add `classification?: string \| null` to `MnemonicResponse` interface.                                                                                                                                                                                                                            |

### MODIFIED — Backend

| File                                             | Change                                                                                                                                                                    |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `modules/mnemonics/types/mnemonics.ts`           | Add `classification?: string \| null` to `MnemonicStoryResponse` interface                                                                                                |
| `modules/mnemonics/services/MnemonicsService.ts` | In `toResponse()`, accept optional `classification` param and include it. In `getMnemonic()` and `generateMnemonic()`, pass `charData?.classification` to `toResponse()`. |

## Implementation Details

### `resolveEffectiveClassification()` Heuristic

```typescript
function resolveEffectiveClassification(
  classification: string | null | undefined,
  radicalIds: string[],
): "pictograph" | "phono_semantic" | "compound_ideograph" | "simple_ideograph" | "default" {
  if (classification === "pictograph") return "pictograph";
  if (classification === "phono_semantic") return "phono_semantic";
  // ideograph → check if compound by radical count
  if (classification === "ideograph" && radicalIds.length >= 2) {
    return "compound_ideograph";
  }
  if (classification === "ideograph") return "simple_ideograph";
  return "default";
}
```

### Four Layout Components

**PictographLayout**: Large glyph + oracle bone illustration + etymology + "Try visualizing" note. No AI story column.

**PhonoSemanticLayout**: CSS Grid 2-column layout. Left: "Meaning clue" with semantic radical glyph + meaning. Right: "Sound clue" with phonetic component + pinyin. AI story renders full-width below the grid.

**CompoundIdeographLayout**: "Meaning A: [component1] + Component B: [component2] → Combined: [meaning]". Each component shown with glyph. Story below explaining combination logic.

**SimpleIdeographLayout**: Single column minimal layout. Concise explanation paragraph + AI story. No component breakdown columns.

### Regeneration Guidance

```typescript
const REGENERATION_TIPS: Record<string, string> = {
  pictograph:
    "Ask for a story that emphasizes visual imagery and the object this character depicts.",
  phono_semantic: "Ask for a story that connects the sound clue to the meaning clue.",
  compound_ideograph:
    "Ask for a story that explains how the components combine to create the meaning.",
  simple_ideograph: "Ask for a story that makes the abstract concept concrete and memorable.",
  default: "Ask for a story that makes this character easier to remember.",
};
```

### Updated State Flow

```
loadMnemonic(glyph)
  ├─ PICTOGRAPH_CHARS.has(glyph) → "Pictograph" → MnemonicCard{pictograph layout}
  ├─ getMnemonic() → null        → "Empty" → MnemonicEmpty (unchanged)
  ├─ getMnemonic() → isPictograph → "Pictograph" → MnemonicCard{pictograph, story}
  ├─ getMnemonic() → has data    → "Display" (now includes classification + radicalIds)
  │                                    └→ MnemonicCard{classification, story, radicalIds, ...}
  └─ "Cached" → MnemonicCard (without classification — will show default layout)
```

## Architecture Integration

```
[MnemonicCard — shared/components/MnemonicCard/]
├── MnemonicCard.tsx — layout selector + ClassificationBadge header
├── PictographLayout.tsx — etymology-focused layout
├── PhonoSemanticLayout.tsx — meaning/sound columns
├── CompoundIdeographLayout.tsx — component breakdown
├── SimpleIdeographLayout.tsx — concise layout
└── regenerationGuidance.ts — tip text per classification

[Integration targets]
├── character-hub/stores/mnemonicStore.ts — add classification to Display state
├── character-hub/components/HubMnemonicSection/ — replace MnemonicDisplay + MnemonicPictograph
└── Backend MnemonicsService — add classification to API response

[Reused dependencies]
├── ClassificationBadge (Story 21.15) — badge pill in card header
├── Character.classification + radicalIds — layout selection data
└── globals.css tokens — font, color, spacing variables
```

## Testing Requirements

| Test file                            | Scope                                                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `MnemonicCard.test.tsx`              | `resolveEffectiveClassification()` for all 5 paths. Regeneration tips return correct text per type.           |
| Storybook `MnemonicCard.stories.tsx` | 12 stories — 4 layouts × 3 states (populated, loading, error). Story title: `"Shared/MnemonicCard/[Layout]"`. |

## Summary

**Files created/changed:** 29 files (12 new MnemonicCard components, 17 modified across frontend/backend)

**Key decisions:**

- Created `MnemonicCard` as a shared component under `shared/components/MnemonicCard/` with 4 layout sub-components plus `layoutSelection.ts` and `regenerationGuidance.ts` as pure-function modules
- Added `renderStoryText.tsx` as a shared utility for consistent story rendering across all layouts (extracted to avoid duplication)
- Used `resolveEffectiveClassification()` heuristic: `ideograph` with `radicalIds.length >= 2` → compound, otherwise → simple
- Backend `MnemonicsService.toResponse()` now accepts optional `classification` param from `charData`, included in the API response
- `Pictograph` state in mnemonic store retained as shortcut routing — routes to `MnemonicCard` with `classification="pictograph"` and no AI story
- Removed `MnemonicDisplay`, `MnemonicPictograph`, and `MnemonicLoading` components entirely (replaced by `MnemonicCard`'s internal layout system)
- Classification-aware prompt enhancement (Story 21.14) integrated into `buildMnemonicPrompt()` — injects classification-specific guidance for each character type

**Deviations from plan:**

- Added `renderStoryText.tsx` — not in original manifest but needed for shared story rendering with loading/empty states across all 4 layouts
- `layoutSelection.ts` extracted from `MnemonicCard.tsx` as a separate pure-function module for testability, rather than inline
- HubMnemonicSection test file required extensive updates (151 line diff) to adapt tests from `MnemonicDisplay`/`MnemonicPictograph` to `MnemonicCard`

## Technical Challenges & Solutions

### 3 vs 4 layout gap for "ideograph"

**Problem:** The backend classification has 4 values but only three map 1:1 to layouts — plain `ideograph` was ambiguous between compound and simple ideograph.

**Root Cause:** `ideograph` doesn't distinguish compound (multi-component) from simple ideographs.

**Solution:** `resolveEffectiveClassification()` heuristic — `ideograph` with `radicalIds.length >= 2` renders the compound layout, otherwise the simple layout; `default` fallback covers null/unknown.

### Classification missing from mnemonic response

**Problem:** The frontend card needs `classification` to pick a layout, but the mnemonic API response didn't include it.

**Root Cause:** `MnemonicsService.toResponse()` only serialized story fields.

**Solution:** `toResponse()` now accepts an optional `classification` param (passed from `charData`) and includes it in `MnemonicStoryResponse`.

### Shared story rendering duplication

**Problem:** All 4 layouts render the story (loading/empty/populated) identically; duplicating it caused drift.

**Root Cause:** Layout components each needed the same story-rendering logic.

**Solution:** Extracted `renderStoryText.tsx` (shared story rendering) and `layoutSelection.ts` (pure `resolveEffectiveClassification`) as testable modules; HubMnemonicSection tests were updated (~151-line diff) from `MnemonicDisplay`/`MnemonicPictograph` to `MnemonicCard`.

### Doc Truth-Check (Verify Against Code)

- [x] Endpoints documented exist verbatim in `ROUTE_PATTERNS` (`packages/shared-constants/src/index.js`)
- [x] Feature/module/component names match `src/features/` / `src/modules/` listings
- [x] Data-source claims (content JSON vs Postgres/API) verified in the backing service
- [x] Every internal link resolves to an existing file
- [x] Last Updated date is current
