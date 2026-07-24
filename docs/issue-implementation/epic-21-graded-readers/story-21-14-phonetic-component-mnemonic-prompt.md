# Implementation 21-14: Phonetic Component in Mnemonic Prompt

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-14-phonetic-component-mnemonic-prompt.md`

## Technical Scope

Modify the AI mnemonic prompt template in the backend mnemonic generation service to include classification and phonetic component data. Add pictograph skip logic.

**Files:**

- `apps/backend/src/services/MnemonicService.ts` (or `CachedAIFeedbackService.ts`) — update: extend prompt template with classification + phonetic data, add pictograph early-return
- `apps/backend/src/services/__tests__/MnemonicService.test.ts` — update: tests for enhanced prompt and pictograph skip

## Implementation Details

### Prompt Template Enhancement

The current prompt is: "Generate a memorable story for the Chinese character [glyph]..."

Updated prompt:

```
Generate a memorable story for the Chinese character [glyph] (pinyin: [pinyin], meaning: [meaning]).

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
async generateMnemonic(character: CharacterData): Promise<string> {
  // Pictograph check — early return for visual-origin characters
  if (character.classification === 'pictograph') {
    return `This is a pictograph — its meaning comes from its visual form. Try to visualize ${character.etymologyDescription ?? 'the object it depicts'} when you see this character.`;
  }

  // Build enhanced prompt for non-pictograph characters
  const prompt = this.buildEnhancedPrompt(character);

  // Call AI service with enhanced prompt
  return this.aiService.generate(prompt);
}
```

### Data Flow

```
Request: mnemonic for character 河 (hé, "river")
→ Check classification: "phono-semantic"
→ Fetch phonetic component: 可 (kě, "can/allow")
→ Enhanced prompt includes:
    classification: phono-semantic
    semantic component: 氵 (water radical)
    phonetic component: 可 (kě, meaning: "can/allow")
→ AI returns mnemonic that connects water + "can" → "river"
```

## Architecture Integration

```
[Story 21.14: Mnemonic Prompt Enhancement]
├── Backend
│   └── MnemonicService (or CachedAIFeedbackService)
│       ├── buildEnhancedPrompt() — adds classification + phonetic data
│       └── pictographSkip() — early return for pictographs
└── Data Sources
    ├── Character.classification (populated by 21.2)
    ├── CharacterComponent (phonetic component — populated by 21.2)
    └── CharacterReading (pinyin data — populated by 21.2)
```

## Technical Challenges & Solutions

```
Problem: Pictographs need to be identified reliably — classification may not
         be populated for all characters in the initial 500-character milestone.
Solution: If classification is null/undefined, fall through to normal AI
         generation (current behavior). Pictograph skip only triggers when
         classification === "pictograph" explicitly.
```
