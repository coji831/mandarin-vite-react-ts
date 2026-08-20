# Implementation 21-18: IME Simulator Phonetic Hints

> **BR Reference:** `docs/business-requirements/archive/epic-21-graded-readers/story-21-18-ime-simulator-phonetic-hints.md`

## Technical Scope

Extend the IME Simulator with phonetic hint display on wrong answers, a radical hint toggle with score penalty, and score breakdown by character type.

**Files:**

- `apps/frontend/src/features/quiz/services/hintService.ts` — **NEW**: hint generation logic with Characters Module API integration
- `apps/frontend/src/features/quiz/services/__tests__/hintService.test.ts` — **NEW**: 6 unit tests (phonetic, radical, character detail, fallback, error handling)
- `apps/frontend/src/features/quiz/types/engine.ts` — modified: hint pool, penalty, and score-by-type logic in quiz engine
- `apps/frontend/src/features/quiz/types/session.ts` — modified: hint state, penalty tracking, score-by-classification types
- `apps/frontend/src/features/quiz/types/index.ts` — modified: barrel export for new types
- `apps/frontend/src/features/quiz/stores/quizSessionStore.ts` — modified: hint pool, penalty accumulation, score-by-type tracking
- `apps/frontend/src/features/quiz/components/ime-input/IMEQuestionView.tsx` — modified: phonetic hint display on wrong answer, radical hint toggle
- `apps/frontend/src/features/quiz/components/ime-input/IMEQuestionView.css` — modified: styles for hint UI elements
- `apps/frontend/src/features/quiz/components/FeedbackView.tsx` — modified: score breakdown by character type
- `apps/frontend/src/features/quiz/components/results/QuizResults.tsx` — modified: results display with classification breakdown
- `apps/frontend/src/features/quiz/index.ts` — modified: barrel export for hint service
- `apps/frontend/src/pages/practices/QuizPageFull.stories.tsx` — modified: Storybook stories covering hint UI states

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
// In quizSessionStore
interface QuizSessionState {
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
├── Frontend — features/quiz/
│   ├── IMEQuestionView — hint UI + toggle + score breakdown
│   ├── hintService — hint generation (API-first with fallback)
│   └── quizSessionStore — hint pool, penalties, score by type
└── Dependencies
    ├── 21.10 Characters Module API — phonetic component lookup
    ├── 21.15 ClassificationBadge — score breakdown rows
    └── Epic 19 IME Simulator — existing quiz infrastructure
```

## Technical Challenges & Solutions

### Hint data availability

**Problem:** The phonetic hint wants the Characters Module API, but it can be unavailable or the character may lack a phonetic component (e.g., pictographs).

**Root Cause:** Hint generation depends on an external API + data that isn't guaranteed per character.

**Solution:** API-first with graceful fallback — try `GET /api/v1/characters/:glyph/phonetic`, then fall back to local character data (a pictograph note, or a generic sound-association hint). Failures degrade silently.

### Radical hint score penalty

**Problem:** The radical hint should cost the learner without breaking the existing scoring model.

**Root Cause:** The IME Simulator scores per answer; a per-hint penalty needed to accumulate across the session.

**Solution:** Tracked `hintsRemaining` (starts at 3) and `maxScorePenalty` (accumulates -5% per radical-hint use) in `quizSessionStore`, and surfaced score-by-character-type breakdown in results via the shared `ClassificationBadge` (Story 21.15).

### Doc Truth-Check (Verify Against Code)

- [x] Endpoints documented exist verbatim in `ROUTE_PATTERNS` (`packages/shared-constants/src/index.js`)
- [x] Feature/module/component names match `src/features/` / `src/modules/` listings
- [x] Data-source claims (content JSON vs Postgres/API) verified in the backing service
- [x] Every internal link resolves to an existing file
- [x] Last Updated date is current
