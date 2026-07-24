# Implementation 21-9: Phase Gate Calibration

> **BR Reference:** `docs/business-requirements/epic-21-graded-readers/story-21-9-phase-gate-calibration.md`

## Technical Scope

Raise IME Simulator threshold from 70%→80%, implement Phase 3→4 comprehension gate, add character count ≥500 gate check for Phase 2→3. All changes are configuration + service logic — no new models required.

**Files:**

- `apps/backend/src/config/gate-thresholds.ts` — **NEW**: centralized gate threshold constants
- `apps/backend/src/modules/progression/services/PhaseGateService.ts` — update gate logic: threshold, comprehension gate, character count gate
- `apps/backend/src/modules/progression/services/ProgressionService.ts` — update to pass passage state to gate check
- `apps/backend/src/modules/progression/types/progression.ts` — add comprehension gate types
- `apps/backend/src/modules/quiz/types/quiz.ts` — add `"comprehension"` to QuizAttempt.quizType enum
- `apps/backend/prisma/schema.prisma` — update QuizAttempt model if quizType is enum-based
- `apps/backend/src/shared/services/ReadersService.ts` — provide passage selection logic for comprehension gate
- `apps/backend/src/modules/progression/services/__tests__/PhaseGateService.test.ts` — updated unit tests

## Configuration Changes

### New Config File: `gate-thresholds.ts`

```typescript
export const GATE_THRESHOLDS = {
  /** Phase 2 → 3: IME Simulator minimum correct answers (out of 25) */
  IME_SIMULATOR_MIN_SCORE: 20, // 80% (was 18 = 70%)

  /** Phase 2 → 3: Minimum characters in DB before unlocking Phase 3 */
  CHARACTER_COUNT_MINIMUM: 500,

  /** Phase 3 → 4: Comprehension gate — minimum passage quiz score */
  COMPREHENSION_QUIZ_MIN_SCORE: 0.6, // 60%

  /** Phase 3 → 4: Comprehension gate — minimum known word ratio in passage */
  COMPREHENSION_KNOWN_WORD_RATIO: 0.9, // 90%

  /** Comprehension gate: number of passage questions */
  COMPREHENSION_QUESTION_COUNT: 5,
} as const;
```

## Implementation Details

### 1. IME Threshold Change (70%→80%)

**Before:** `PhaseGateService.ts` checks `score >= 18` for IME Simulator.
**After:** Check `score >= GATE_THRESHOLDS.IME_SIMULATOR_MIN_SCORE` (20).

```typescript
// Current (to be replaced):
// const imePassed = score >= 18;

// New:
import { GATE_THRESHOLDS } from "../../../config/gate-thresholds";
const imePassed = score >= GATE_THRESHOLDS.IME_SIMULATOR_MIN_SCORE;
```

### 2. Phase 3→4 Comprehension Gate

New gate logic added to `PhaseGateService.checkPhase3To4Gate()`:

```typescript
async checkPhase3To4Gate(userId: string): Promise<GateResult> {
  // 1. Select passage at learner's HSK level
  const passage = await this.readersService.selectPassageForGate(
    userHskLevel // derived from PhaseGate.phase1Retention or qualificationScore
  );

  if (!passage) {
    return {
      passed: false,
      reason: 'NO_PASSAGE_AVAILABLE',
      fallback: 'QUALIFICATION_QUIZ',
      details: 'No cached passage at your level. Take a 5-question qualification quiz instead.'
    };
  }

  // 2. Check known word ratio (≥90%)
  const knownWordRatio = await this.computeKnownWordRatio(userId, passage.id);
  if (knownWordRatio < GATE_THRESHOLDS.COMPREHENSION_KNOWN_WORD_RATIO) {
    return {
      passed: false,
      reason: 'KNOWN_WORD_RATIO_TOO_LOW',
      details: `Known word ratio: ${(knownWordRatio * 100).toFixed(1)}% (needs ≥90%)`
    };
  }

  // 3. Check comprehension quiz score (≥60%)
  const quizResult = await this.quizService.getLatestQuizResult(
    userId, passage.id, 'comprehension'
  );

  if (!quizResult || quizResult.score < GATE_THRESHOLDS.COMPREHENSION_QUIZ_MIN_SCORE) {
    return {
      passed: false,
      reason: 'COMPREHENSION_SCORE_TOO_LOW',
      details: quizResult
        ? `Score: ${(quizResult.score * 100).toFixed(0)}% (needs ≥60%)`
        : 'No comprehension quiz found. Generate a passage and take the comprehension quiz.'
    };
  }

  return { passed: true };
}
```

### 3. Character Count Gate (Phase 2→3)

```typescript
async checkCharacterCountGate(): Promise<GateResult> {
  const charCount = await prisma.character.count();

  if (charCount < GATE_THRESHOLDS.CHARACTER_COUNT_MINIMUM) {
    return {
      passed: false,
      reason: 'INSUFFICIENT_CHARACTER_COVERAGE',
      details: `Character count: ${charCount} (needs ≥${GATE_THRESHOLDS.CHARACTER_COUNT_MINIMUM})`
    };
  }

  return { passed: true };
}
```

This check runs during Phase 2→3 transition. It is a system-level check (same for all users) — the `Character` table is shared across all users.

### 4. QuizAttempt.quizType Extension

The `QuizAttempt` model needs `"comprehension"` added to its `quizType` field. If `quizType` is a String field (not an enum), this is a no-op — any string is valid. If it's an enum in Prisma, add the new value:

```prisma
// If quizType is modeled as an enum:
enum QuizType {
  quiz
  exam
  comprehension  // NEW
  ime_simulator
}
```

Update the QuizAttempt model if it uses a Prisma enum; otherwise just document the new string value.

### 5. Retroactive Application Logic

```typescript
// In PhaseGateService — only apply new thresholds to NEW attempts
async evaluatePhase2Gate(userId: string, attempt: QuizAttempt): Promise<boolean> {
  // If user already passed Phase 2 under old thresholds, don't regress
  const gate = await this.getPhaseGate(userId);
  if (gate.phase2Passed) {
    return true; // Already passed — grandfathered
  }

  // Apply new threshold
  return attempt.score >= GATE_THRESHOLDS.IME_SIMULATOR_MIN_SCORE;
}
```

## Architecture Integration

```
[Story 21.9: Phase Gate Calibration]
├── Config → gate-thresholds.ts (centralized constants)
├── Service → PhaseGateService (3 gate checks)
│   ├── checkPhase2Gate() — IME threshold 80%
│   ├── checkPhase2To3Gate() — character count ≥500 + IME
│   └── checkPhase3To4Gate() — comprehension gate
├── Quiz → QuizAttempt.quizType = "comprehension"
└── Readers → Passage selection for comprehension gate

No new models. No migration. No frontend changes.
```

## Technical Challenges & Solutions

```
Problem: Passage selection for comprehension gate requires a passage at the
         learner's HSK level, but passages may not exist yet.
Solution: Fetch the least-recently-accessed passage at the learner's HSK level.
         If none exists, present a qualification quiz fallback instead of
         blocking the gate entirely.

Problem: Retroactive application — users who passed Phase 2 at 70% should
         not be forced to re-pass at 80%.
Solution: Check `gate.phase2Passed` flag before applying new thresholds.
         Only new attempts use new thresholds. Grandfather existing passes.

Problem: Known word ratio computation requires knowing which words in a passage
         the user has encountered.
Solution: Use CharacterProgress records + Passage word set. For each unique
         character in the passage, check if the user has a CharacterProgress
         record with confidence > 0. Known word ratio = known chars / total chars.
```
