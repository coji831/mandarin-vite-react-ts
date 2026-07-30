# Implementation 21-14: Phonetic Component in Mnemonic Prompt

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-14-phonetic-component-mnemonic-prompt.md`

## Technical Scope

Modify the AI mnemonic prompt template in the backend mnemonic generation service to include classification and phonetic component data. Add pictograph skip logic.

**Files:**

- `apps/backend/src/modules/mnemonics/repositories/MnemonicsRepository.ts` — add `getCharacterByGlyph()` and `getPhoneticComponent()` methods
- `apps/backend/src/modules/mnemonics/services/MnemonicsService.ts` — refactor: extend prompt template with classification + phonetic data, add pictograph skip using repository
- `apps/backend/src/modules/mnemonics/services/__tests__/MnemonicsService.test.ts` — update: tests for enhanced prompt, pictograph skip, and repository method behavior
- `apps/backend/src/modules/mnemonics/api/MnemonicsController.ts` — remove `PICTOGRAPH_CHARS` 422 check (controller no longer blocks pictographs)
- `apps/frontend/src/features/character-hub/components/HubMnemonicSection/MnemonicPictograph.tsx` — update: accept dynamic `story` prop from backend response instead of hardcoded message

## Implementation Details

### Prompt Template Enhancement

The current prompt is built via the module-level function `buildMnemonicPrompt(character: string, radicalIds: string[])` which accepts a character glyph and radical IDs.

Refactored signature:

```typescript
interface PromptContext {
  character: string;
  radicalIds: string[];
  classification?: string;
  phoneticComponent?: {
    glyph: string;
    pinyin: string;
    meaning: string;
  };
  etymology?: string;
}

// Module-level function — not a class method
function buildMnemonicPrompt(context: PromptContext): string;
```

Updated prompt template:

```
Generate a memorable story for the Chinese character [character] (pinyin: [pinyin], meaning: [meaning]).

Character classification: [classification]
- If phono-semantic: The semantic component is [radicalGlyph] ([radicalMeaning]).
  The phonetic component is [phoneticGlyph] ([phoneticPinyin], meaning: [phoneticMeaning]).
  The story should connect both the meaning clue and the sound clue.
- If compound ideograph: The components are [componentList]. The story should explain
  how these components combine to create the meaning.
- If simple ideograph: The story should focus on the abstract meaning directly.
```

### Pictograph Skip Logic

```typescript
async generateMnemonic(glyph: string): Promise<MnemonicResponse> {
  // Fetch character data from repository
  const char = await this.repository.getCharacterByGlyph(glyph);

  // Pictograph check — early return for visual-origin characters
  if (char?.classification === 'pictograph') {
    return {
      story: `This is a pictograph — its meaning comes from its visual form. Try to visualize ${char.etymology ?? 'the object it depicts'} when you see this character.`,
      isPictograph: true,
    };
  }

  // Fetch phonetic component data
  const phoneticComponent = char?.phoneticComponentId
    ? await this.repository.getPhoneticComponent(char.phoneticComponentId)
    : undefined;

  // Build enhanced prompt
  const prompt = buildMnemonicPrompt({
    character: glyph,
    radicalIds: [],
    classification: char?.classification,
    phoneticComponent,
    etymology: char?.etymology,
  });

  // Call AI service with enhanced prompt
  const story = await this.aiService.generate(prompt);
  return { story, isPictograph: false };
}
```

> **Note:** The controller (`MnemonicsController.ts`) currently has a hardcoded `PICTOGRAPH_CHARS` Set that returns 422 for pictographs. This check must be removed — the service now handles pictographs by returning a 200 OK with `isPictograph: true`.

### Data Flow

```
Request: mnemonic for character 河 (hé, "river")
→ MnemonicsRepository.getCharacterByGlyph("河")
    → Query Character table: classification = "phono-semantic", phoneticComponentId = "ke-4"
→ MnemonicsRepository.getPhoneticComponent("ke-4")
    → Query character 可: glyph = "可", pinyin = "kě", meaning = "can/allow"
→ buildMnemonicPrompt({
    character: "河",
    classification: "phono-semantic",
    phoneticComponent: { glyph: "可", pinyin: "kě", meaning: "can/allow" },
    radicalIds: ["water-radical-id"],
  })
→ Enhanced prompt includes:
    classification: phono-semantic
    semantic component: 氵 (water radical)
    phonetic component: 可 (kě, meaning: "can/allow")
→ AI returns mnemonic that connects water + "can" → "river"
→ Response: { story: "...", isPictograph: false }
```

## Architecture Integration

```
[Story 21.14: Mnemonic Prompt Enhancement]
├── Backend
│   └── MnemonicsService (modules/mnemonics/services/)
│       ├── buildMnemonicPrompt() — module-level function, accepts PromptContext
│       └── generateMnemonic() — calls repository, handles pictograph skip
│   └── MnemonicsRepository (modules/mnemonics/repositories/)
│       ├── getCharacterByGlyph(glyph) — fetches classification, phoneticComponentId, etymology
│       └── getPhoneticComponent(id) — fetches glyph, pinyin, meaning for phonetic component
│   └── MnemonicsController (modules/mnemonics/api/)
│       └── remove PICTOGRAPH_CHARS 422 check — pictographs now return 200 OK
├── Frontend
│   └── MnemonicPictograph component
│       └── accept dynamic `story` prop from backend response
└── Data Sources
    ├── Character.classification (populated by 21.2)
    ├── Character.phoneticComponentId (populated by 21.2)
    ├── Character.etymology (populated by 21.2)
    ├── CharacterComponent (phonetic component — populated by 21.2)
    └── CharacterReading (pinyin data — populated by 21.2)
```

## Technical Challenges & Solutions

```
Challenge 1: Classification may be null for some characters
───────────────────────────────────────────────────────────
Problem: Character.classification may not be populated for all characters in
         the initial 500-character milestone.
Solution: If classification is null/undefined, fall through to normal AI
         generation (current behavior). Pictograph skip only triggers when
         classification === "pictograph" explicitly.

Challenge 2: Dual pictograph sources must stay in sync
──────────────────────────────────────────────────────
Problem: The frontend has a hardcoded PICTOGRAPH_CHARS Set (in MnemonicsController
         or MnemonicPictograph) as a local optimization, while the authoritative
         source is Character.classification in the database. These can drift.
Solution: The controller's PICTOGRAPH_CHARS 422 check is removed — the backend
         now determines pictograph status from the database (authoritative).
         The frontend PICTOGRAPH_CHARS (if any) is a local rendering hint;
         the backend response's `isPictograph` boolean is the source of truth.
```

## Implementation Status

**Status:** ✅ Implemented
**Date Completed:** July 30, 2026
