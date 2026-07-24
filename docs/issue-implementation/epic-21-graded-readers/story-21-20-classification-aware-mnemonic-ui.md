# Implementation 21-20: Classification-Aware Mnemonic UI

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-20-classification-aware-mnemonic-ui.md`

## Technical Scope

Create a new MnemonicCard component with 4 distinct layouts based on character classification. May require a new `features/mnemonics/` feature folder.

**Files:**

- `apps/frontend/src/features/mnemonics/components/MnemonicCard.tsx` — **NEW**: main mnemonic card component with 4 layouts
- `apps/frontend/src/features/mnemonics/components/PictographMnemonicLayout.tsx` — **NEW**: pictograph layout
- `apps/frontend/src/features/mnemonics/components/PhonoSemanticMnemonicLayout.tsx` — **NEW**: phono-semantic layout
- `apps/frontend/src/features/mnemonics/components/CompoundIdeographMnemonicLayout.tsx` — **NEW**: compound ideograph layout
- `apps/frontend/src/features/mnemonics/components/SimpleIdeographMnemonicLayout.tsx` — **NEW**: simple ideograph layout
- `apps/frontend/src/features/mnemonics/components/index.ts` — **NEW**: barrel file
- `apps/frontend/src/features/mnemonics/components/__stories__/MnemonicCard.stories.tsx` — **NEW**: stories for all 4 layouts
- `apps/frontend/src/features/mnemonics/components/__tests__/MnemonicCard.test.tsx` — **NEW**: unit tests
- `apps/frontend/src/features/mnemonics/services/mnemonicCardService.ts` — **NEW**: layout selection + regeneration guidance logic
- `apps/frontend/src/features/mnemonics/services/__tests__/mnemonicCardService.test.ts` — **NEW**: unit tests

## Implementation Details

### Layout Selection

```typescript
function selectLayout(classification: string): MnemonicLayout {
  switch (classification) {
    case "pictograph":
      return "pictograph";
    case "phono-semantic":
      return "phono-semantic";
    case "compound-ideograph":
      return "compound-ideograph";
    case "simple-ideograph":
      return "simple-ideograph";
    default:
      return "default"; // fallback to current layout
  }
}
```

### Four Layout Components

**PictographLayout**: Large glyph + oracle bone image + etymology + "Try visualizing" note
**PhonoSemanticLayout**: Two-column grid (Meaning clue | Sound clue) + story below
**CompoundIdeographLayout**: "Component A + Component B → Meaning" breakdown + story
**SimpleIdeographLayout**: Concise explanation + AI story (minimal layout)

### Regeneration Guidance

```typescript
const REGENERATION_TIPS: Record<string, string> = {
  pictograph:
    "Ask for a story that emphasizes visual imagery and the object this character depicts.",
  "phono-semantic":
    "Ask for a story that connects the sound clue [phonetic] to the meaning clue [radical].",
  "compound-ideograph":
    "Ask for a story that explains how the components combine to create the meaning.",
  "simple-ideograph": "Ask for a story that makes the abstract concept concrete and memorable.",
};
```

## Architecture Integration

```
[Story 21.20: Classification-Aware Mnemonic UI]
├── Frontend — features/mnemonics/ (NEW feature folder)
│   ├── MnemonicCard — main card with 4 layout variants
│   ├── PictographMnemonicLayout — etymology-focused layout
│   ├── PhonoSemanticMnemonicLayout — meaning/sound columns
│   ├── CompoundIdeographMnemonicLayout — component breakdown
│   ├── SimpleIdeographMnemonicLayout — concise layout
│   └── mnemonicCardService — layout selection + guidance
└── Dependencies
    ├── 21.14 Enhanced Mnemonic Prompt — consumed by AI
    ├── 21.15 ClassificationBadge — badge pill in card header
    └── Character.classification — layout selection
```
