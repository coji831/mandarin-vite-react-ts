# Implementation 21-18: IME Simulator Phonetic Hints

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-18-ime-simulator-phonetic-hints.md`

## Technical Scope

Extend the IME Simulator with phonetic hint display on wrong answers, a radical hint toggle with score penalty, and score breakdown by character type.

**Files:**

- `apps/frontend/src/features/radicals/components/IMESimulator.tsx` — update: add hint display after wrong answer, hint toggle, score breakdown
- `apps/frontend/src/features/radicals/services/hintService.ts` — **NEW**: hint generation logic
- `apps/frontend/src/features/radicals/services/__tests__/hintService.test.ts` — **NEW**: unit tests
- `apps/frontend/src/features/radicals/stores/imeStore.ts` — update: extend state with hint pool, score penalties
- `apps/frontend/src/features/radicals/components/__stories__/IMESimulator.stories.tsx` — update: stories with hint states
- `apps/frontend/src/features/radicals/services/radicalService.ts` — update: add API call for phonetic component lookup (or fallback to local data)

## Implementation Details

### Hint Generation

```typescript
class HintService {
  async getPhoneticHint(character: CharacterData): Promise<string> {
    // Try API first (21.10 Characters Module)
    try {
      const response = await apiClient.get(`/api/v1/characters/${character.glyph}/phonetic`);
      const phoneticComponent = response.data.phoneticComponent;
      return `Hint: This character contains phonetic component ${phoneticComponent.glyph} (pinyin: ${phoneticComponent.pinyin}, meaning: ${phoneticComponent.meaning}). Try to connect the sound!`;
    } catch {
      // Fallback: use local character data
      if (character.classification === "pictograph") {
        return "This character doesn't have a phonetic component — try memorizing it by its visual structure.";
      }
      return `Hint: Think about the sound of this character. What other characters do you know with similar pronunciation?`;
    }
  }
}
```

### Score Penalty Logic

```typescript
// In imeStore
interface IMEState {
  hintsRemaining: number; // starts at 3
  showRadicalHint: boolean;
  maxScorePenalty: number; // accumulates -5% per radical hint use
  scoreByType: Record<string, { correct: number; total: number }>;
}
```

### Score Breakdown Section

Renders a table after quiz completion:

| Type                  | Score |
| --------------------- | ----- |
| 🖼️ Pictograph         | 3/3   |
| 🔤 Phono-semantic     | 5/8   |
| 🧩 Compound ideograph | 2/2   |
| ⚡ Simple ideograph   | 1/1   |

Uses the `ClassificationBadge` component from Story 21.15 for each row.

## Architecture Integration

```
[Story 21.18: IME Simulator Phonetic Hints]
├── Frontend — features/radicals/
│   ├── IMESimulator — hint UI + toggle + score breakdown
│   ├── hintService — hint generation (API-first with fallback)
│   └── imeStore — hint pool, penalties, score by type
└── Dependencies
    ├── 21.10 Characters Module API — phonetic component lookup
    ├── 21.15 ClassificationBadge — score breakdown rows
    └── Epic 19 IME Simulator — existing quiz infrastructure
```
