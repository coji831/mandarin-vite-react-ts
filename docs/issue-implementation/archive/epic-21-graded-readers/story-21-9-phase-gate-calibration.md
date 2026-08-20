# Implementation 21-9: Phase Gate Calibration

> **BR Reference:** `docs/business-requirements/archive/epic-21-graded-readers/story-21-9-phase-gate-calibration.md`

**Last Update:** July 30, 2026

## Technical Scope

Raise IME Simulator threshold from 70%→80%, implement Phase 3→4 comprehension gate with template-based `ComprehensionQuizStrategy`, add character count ≥500 gate check via `CharacterProgress` (user-level). All gate-check methods live directly on `ProgressionService` (no new `PhaseGateService`). Add `QualificationQuizStrategy` for fallback when no passage exists. Add `passageId` field to `QuizAttempt` model.

**Files:**

- `apps/backend/src/config/gate-thresholds.ts` — **NEW**: centralized gate threshold constants
- `apps/backend/src/modules/progression/services/ProgressionService.ts` — **UPDATE**: add gate-check methods directly
- `apps/backend/src/modules/progression/types/progression.ts` — **UPDATE**: add comprehension gate types, GateResult type
- `apps/backend/src/modules/quiz/types/quiz.ts` — **UPDATE**: add `"comprehension"` and `"qualification"` to quizType union
- `apps/backend/prisma/schema.prisma` — **UPDATE**: add `passageId String?` field to QuizAttempt model
- `apps/backend/src/modules/readers/services/ReadersService.ts` — **UPDATE**: add `selectPassageForGate(hskLevel)` method
- `apps/backend/src/modules/quiz/services/QuizService.ts` — **UPDATE**: add `getComprehensionQuizResult(userId, passageId)` method
- `apps/backend/src/modules/quiz/repositories/QuizRepository.ts` — **UPDATE**: add `findQuizAttemptByUserAndType(userId, quizType)` method
- `apps/backend/src/modules/quiz/strategies/ComprehensionQuizStrategy.ts` — **NEW**: template-based question generator from passage sentences
- `apps/backend/src/modules/quiz/strategies/QualificationQuizStrategy.ts` — **NEW**: basic HSK-level-appropriate quiz strategy for fallback
- `apps/backend/src/modules/progression/container.ts` — **UPDATE**: wire ReadersService and QuizService dependencies
- `apps/backend/src/modules/progression/services/__tests__/ProgressionService.test.ts` — **UPDATE**: add tests for 3 gate checks

## Configuration Changes

### New Config File: `gate-thresholds.ts`

```typescript
export const GATE_THRESHOLDS = {
  /** Phase 2 → 3: IME Simulator minimum correct answers (out of 25) */
  IME_SIMULATOR_MIN_SCORE: 20, // 80% (was 18 = 70%)

  /** Phase 2 → 3: Minimum characters LEARNED (CharacterProgress) before unlocking Phase 3 */
  CHARACTER_COUNT_MINIMUM: 500,

  /** Phase 3 → 4: Comprehension gate — minimum passage quiz score */
  COMPREHENSION_QUIZ_MIN_SCORE: 0.6, // 60%

  /** Phase 3 → 4: Comprehension gate — minimum known word ratio in passage */
  COMPREHENSION_KNOWN_WORD_RATIO: 0.9, // 90%

  /** Comprehension gate: number of passage questions */
  COMPREHENSION_QUESTION_COUNT: 5,

  /** Qualification quiz: number of questions */
  QUALIFICATION_QUIZ_QUESTION_COUNT: 5,
} as const;
```

## Implementation Details

### 1. IME Threshold Change (70%→80%)

Replace hardcoded `score >= 18` check in `ProgressionService` with:

```typescript
import { GATE_THRESHOLDS } from "../../../config/gate-thresholds";
const imePassed = score >= GATE_THRESHOLDS.IME_SIMULATOR_MIN_SCORE;
```

### 2. Comprehension Gate (Phase 3→4)

Gate method added directly to `ProgressionService`:

```typescript
async checkPhase3To4Gate(userId: string): Promise<GateResult> {
  // 1. Determine user's HSK level via existing ReadersService method
  const hskLevel = await this.readersService.getUserKnownLevel(userId);

  // 2. Select passage at learner's HSK level
  const passage = await this.readersService.selectPassageForGate(hskLevel);

  if (!passage) {
    return {
      passed: false,
      reason: 'NO_PASSAGE_AVAILABLE',
      fallback: 'QUALIFICATION_QUIZ',
      details: 'No cached passage at your level. Take a 5-question qualification quiz instead.'
    };
  }

  // 3. Check known word ratio (≥90%)
  const knownWordRatio = await this.computeKnownWordRatio(userId, passage.id);
  if (knownWordRatio < GATE_THRESHOLDS.COMPREHENSION_KNOWN_WORD_RATIO) {
    return {
      passed: false,
      reason: 'KNOWN_WORD_RATIO_TOO_LOW',
      details: `Known word ratio: ${(knownWordRatio * 100).toFixed(1)}% (needs ≥90%)`
    };
  }

  // 4. Check comprehension quiz score (≥60%)
  const quizResult = await this.quizService.getComprehensionQuizResult(userId, passage.id);

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

#### `selectPassageForGate(hskLevel)` — on ReadersService

```typescript
/**
 * Selects a passage for the comprehension gate at the given HSK level.
 * Picks the least-recently-accessed passage at that level to distribute load.
 * Returns null if no passage exists at the level.
 */
async selectPassageForGate(hskLevel: number): Promise<Passage | null>
```

#### Known word ratio computation (private method on ProgressionService)

```typescript
private async computeKnownWordRatio(userId: string, passageId: string): Promise<number> {
  const passage = await prisma.passage.findUnique({
    where: { id: passageId },
    include: { words: { include: { word: { include: { characters: true } } } } }
  });

  const passageCharIds = [...new Set(
    passage.words.flatMap(w => w.word.characters.map(c => c.characterId))
  )];

  const knownCount = await prisma.characterProgress.count({
    where: {
      userId,
      characterId: { in: passageCharIds },
      confidence: { gt: 0 }
    }
  });

  return passageCharIds.length > 0 ? knownCount / passageCharIds.length : 0;
}
```

### 3. Character Count Gate (Phase 2→3)

User-level check — counts characters the user has learned via `CharacterProgress`:

```typescript
async checkCharacterCountGate(userId: string): Promise<GateResult> {
  const learnedCharCount = await prisma.characterProgress.count({
    where: { userId, confidence: { gt: 0 } }
  });

  if (learnedCharCount < GATE_THRESHOLDS.CHARACTER_COUNT_MINIMUM) {
    return {
      passed: false,
      reason: 'INSUFFICIENT_CHARACTER_COVERAGE',
      details: `Characters learned: ${learnedCharCount} (needs ≥${GATE_THRESHOLDS.CHARACTER_COUNT_MINIMUM})`
    };
  }
  return { passed: true };
}
```

### 4. QuizAttempt Schema Update

Add to `schema.prisma`:

```prisma
model QuizAttempt {
  // ... existing fields ...
  passageId String?   // NEW: links comprehension quizzes to passages
}
```

`quizType` is a String field — adding `"comprehension"` and `"qualification"` requires no Prisma enum changes.

### 5. Comprehension Quiz Strategy

```typescript
export class ComprehensionQuizStrategy implements QuizStrategy {
  readonly type = "comprehension" as const;

  async generate(passage: Passage, userId: string): Promise<QuizQuestion[]> {
    const sentences = passage.text.split(/[。！？\n]/).filter(Boolean);
    const targetSentences = shuffle(sentences).slice(
      0,
      GATE_THRESHOLDS.COMPREHENSION_QUESTION_COUNT,
    );

    return targetSentences.map((sentence) => {
      const question = this.buildQuestion(sentence);
      const choices = this.generateChoices(sentence, passage);
      return { question, choices, correctIndex: 0 };
    });
  }

  private buildQuestion(sentence: string): { text: string; type: QuestionType } {
    // Pattern matching for Chinese sentence structure
  }

  private generateChoices(sentence: string, passage: Passage): string[] {
    // One correct answer + 3 distractors from other passage elements
  }
}
```

- **No LLM dependency** — pure pattern-based extraction
- **Distractors**: Drawn from other elements in the same passage
- **Score**: `correctAnswers / totalQuestions`

### 6. Qualification Quiz Strategy

```typescript
export class QualificationQuizStrategy implements QuizStrategy {
  readonly type = "qualification" as const;

  async generate(userId: string, hskLevel: number): Promise<QuizQuestion[]> {
    const characters = await prisma.character.findMany({
      where: { hskLevels: { some: { hskLevel } } },
      take: 20,
    });

    const selected = shuffle(characters).slice(
      0,
      GATE_THRESHOLDS.QUALIFICATION_QUIZ_QUESTION_COUNT,
    );

    return selected.map((char) => ({
      question: `What is the pinyin for "${char.glyph}"?`,
      choices: this.generatePinyinChoices(char, characters),
      correctIndex: 0,
    }));
  }
}
```

### 7. QuizService & Repository Methods

```typescript
// QuizService
async getComprehensionQuizResult(userId: string, passageId: string): Promise<{ score: number } | null> {
  const attempt = await this.quizRepository.findQuizAttemptByUserAndType(userId, 'comprehension');
  if (!attempt || attempt.passageId !== passageId) return null;
  return { score: attempt.correctCount / attempt.totalCount };
}

// QuizRepository
async findQuizAttemptByUserAndType(userId: string, quizType: string): Promise<QuizAttempt | null> {
  return prisma.quizAttempt.findFirst({
    where: { userId, quizType },
    orderBy: { createdAt: 'desc' }
  });
}
```

### 8. User HSK Level Source

Uses existing `ReadersService.getUserKnownLevel(userId)` — determines the user's current HSK level based on their character knowledge.

### 9. ProgressionModuleDeps

```typescript
export interface ProgressionModuleDeps {
  progressionRepository: ProgressionRepository;
  reviewService: ReviewService;
  readersService: ReadersService; // NEW
  quizService: QuizService; // NEW
}
```

### 10. Retroactive Application

```typescript
async evaluatePhase2Gate(userId: string, attempt: QuizAttempt): Promise<boolean> {
  const gate = await this.getPhaseGate(userId);
  if (gate.phase2Passed) return true; // Grandfathered
  return attempt.score >= GATE_THRESHOLDS.IME_SIMULATOR_MIN_SCORE;
}
```

## Architecture Integration

```
[Story 21.9: Phase Gate Calibration]
├── Config → gate-thresholds.ts (centralized constants)
├── ProgressionService (3 gate-check methods)
│   ├── checkPhase2Gate() — IME threshold 80%
│   ├── checkCharacterCountGate() — CharacterProgress ≥500
│   └── checkPhase3To4Gate() — comprehension gate
├── Quiz
│   ├── QuizAttempt.passageId (new field)
│   ├── ComprehensionQuizStrategy (template-based questions)
│   ├── QualificationQuizStrategy (fallback questions)
│   └── QuizRepository.findQuizAttemptByUserAndType()
├── Readers → ReadersService.selectPassageForGate()
└── DI → ProgressionModuleDeps extended with readersService + quizService

No new models. Schema migration needed for QuizAttempt.passageId.
No frontend changes required (gate checks are server-side).
```

## Technical Challenges & Solutions

```
Problem: Comprehension questions need to be generated from passage text without an LLM or external API.
Solution: Implement a template-based ComprehensionQuizStrategy that extracts subjects, verbs, objects, and locations from passage sentences using simple Chinese text patterns. Generates 5 multiple-choice questions with one correct answer and three distractors. Distractors are drawn from other elements in the same passage to ensure plausibility.

Problem: Qualification quiz needs HSK-level-appropriate questions without an external question bank.
Solution: Implement a QualificationQuizStrategy that generates basic character-recognition and vocabulary questions using existing Character data filtered by HSK level. Questions are simple: "What is the pinyin for [character]?" with multiple choice options drawn from the same HSK level.

Problem: Passage selection for comprehension gate requires a passage at the learner's HSK level, but passages may not exist yet.
Solution: Fetch the least-recently-accessed passage at the learner's HSK level via ReadersService.selectPassageForGate(hskLevel). If none exists, present a qualification quiz fallback instead of blocking the gate entirely.

Problem: Retroactive application — users who passed Phase 2 at 70% should not be forced to re-pass at 80%.
Solution: Check `gate.phase2Passed` flag before applying new thresholds. Only new attempts use new thresholds. Grandfather existing passes.

Problem: Known word ratio computation requires knowing which words in a passage the user has encountered.
Solution: Use CharacterProgress records + Passage word set. For each unique character in the passage, check if the user has a CharacterProgress record with confidence > 0. Known word ratio = known chars / total chars.

Problem: Character count gate needs per-user character knowledge, not system-wide character availability.
Solution: Query CharacterProgress.count() with userId filter and confidence > 0 instead of Character.count(). This is a user-level check — different users may have different counts based on their learning progress.
```

## Implementation Status

- **Status**: Implemented
- **PR**: N/A (direct commit — no PR)
- **Merge Date**: N/A
- **Key Commit**: `5a136f77`

### Doc Truth-Check (Verify Against Code)

- [x] Endpoints documented exist verbatim in `ROUTE_PATTERNS` (`packages/shared-constants/src/index.js`)
- [x] Feature/module/component names match `src/features/` / `src/modules/` listings
- [x] Data-source claims (content JSON vs Postgres/API) verified in the backing service
- [x] Every internal link resolves to an existing file
- [x] Last Updated date is current
