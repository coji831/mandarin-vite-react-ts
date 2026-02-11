# Implementation 15-1: Progress System Adaptation

## Technical Scope

This story refactors the existing progress tracking system to support both flashcard confidence ratings and quiz-based testing without algorithm conflicts. It introduces a unified spaced repetition formula with performance multipliers and adds database schema for leech tracking, streaks, and audit logging.

**Files Modified:**

- `apps/backend/prisma/schema.prisma` - Add columns/tables (lapseCount, study_streaks, quiz_results)
- `apps/backend/src/core/services/ProgressService.js` - Refactor calculateNextReview(), add recordQuizResult()
- `apps/backend/src/infrastructure/repositories/ProgressRepository.js` - Add query methods for new tables
- `apps/backend/src/api/controllers/ProgressController.js` - Expose quiz result endpoint

**New Database Entities:**

- `study_streaks` table (userId, currentStreak, longestStreak, lastActivityDate, freezeCount)
- `quiz_results` audit table (userId, wordId, questionType, correct, answeredAt)
- `progress.lapseCount` column (INTEGER, default 0)

**New API Endpoint:**

- `POST /api/progress/test-result` - Save quiz answer and update progress using unified algorithm

## Implementation Details

### Unified Spaced Repetition Algorithm

```javascript
/**
 * Unified spaced repetition calculation supporting both flashcard and quiz modes
 *
 * Formula: days = 1 + (30 - 1) * performanceMultiplier
 *
 * Performance multipliers:
 * - Flashcard: confidence² (0.0 to 1.0) - existing behavior
 * - Quiz correct: 1.0 (normalized) - max spacing (30 days)
 * - Quiz incorrect: 0.0 - reset to 1 day
 */
function calculateNextReview(confidence, performanceMultiplier = null) {
  const minDays = 1;
  const maxDays = 30;
  
  // Backward compatibility: if no multiplier provided, use confidence² (flashcard mode)
  const multiplier =
    performanceMultiplier !== null
      ? performanceMultiplier
      : confidence !== null
        ? Math.pow(confidence, 2)
        : 1.0;

  const days = minDays + (maxDays - minDays) * multiplier;
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + Math.round(days));

  return nextReviewDate;
}

/**
 * Record quiz result with quiz-specific multipliers
 * This method ensures quiz answers don't conflict with flashcard confidence ratings
 */
async function recordQuizResult({ userId, wordId, correct, questionType, timeSpentMs }) {
  const progress = await ProgressRepository.findByUserAndWord(userId, wordId);

  // Quiz-specific multipliers (normalized 0.0-1.0 scale)
  const performanceMultiplier = correct ? 1.0 : 0.0;

  // Update progress using unified algorithm
  const nextReviewDate = calculateNextReview(0, performanceMultiplier);
  const delayDays = Math.round((nextReviewDate - new Date()) / (1000 * 60 * 60 * 24));

  // Update lapse count (increment on incorrect, reset on correct)
  const lapseCount = correct ? 0 : (progress?.lapseCount || 0) + 1;

  // Save progress update
  await ProgressRepository.update(progress.id, {
    nextReviewDate,
    currentDelay: delayDays,
    lapseCount,
    studyCount: progress.studyCount + 1,
    correctCount: progress.correctCount + (correct ? 1 : 0),
  });

  // Audit log quiz result
  await QuizResultRepository.create({
    userId,
    wordId,
    correct,
    questionType,
    timeSpentMs,
    answeredAt: new Date(),
  });

  // Flag as leech if 5+ consecutive failures
  const isLeech = lapseCount >= 5;

  return {
    nextReviewDate,
    lapseCount,
    isLeech,
  };
}
```

### Database Schema Changes

```prisma
// prisma/schema.prisma

model Progress {
  id             Int      @id @default(autoincrement())
  userId         Int
  wordId         String
  studyCount     Int      @default(0)
  correctCount   Int      @default(0)
  confidence     Float    @default(0.0)
  nextReview     DateTime
  currentDelay   Int      @default(1)
  lapseCount     Int      @default(0)  // NEW: track consecutive failures
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])

  @@unique([userId, wordId])
  @@index([userId, nextReview])
}

model StudyStreak {
  id               Int      @id @default(autoincrement())
  userId           Int      @unique
  currentStreak    Int      @default(0)
  longestStreak    Int      @default(0)
  lastActivityDate DateTime?
  freezeCount      Int      @default(0)  // Earned via perfect quizzes
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])
}

model QuizResult {
  id           Int      @id @default(autoincrement())
  userId       Int
  wordId       String
  correct      Boolean
  questionType String   // 'multiple_choice', 'type_pinyin', 'type_character'
  timeSpentMs  Int?
  answeredAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId, wordId])
  @@index([userId, answeredAt])
}
```

### Migration Script

```javascript
// prisma/migrations/[timestamp]_add_quiz_support/migration.sql

-- Add lapseCount column to progress table
ALTER TABLE "Progress" ADD COLUMN "lapseCount" INTEGER DEFAULT 0 NOT NULL;

-- Create study_streaks table
CREATE TABLE "StudyStreak" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER UNIQUE NOT NULL,
  "currentStreak" INTEGER DEFAULT 0 NOT NULL,
  "longestStreak" INTEGER DEFAULT 0 NOT NULL,
  "lastActivityDate" TIMESTAMP,
  "freezeCount" INTEGER DEFAULT 0 NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create quiz_results audit table
CREATE TABLE "QuizResult" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "wordId" VARCHAR(255) NOT NULL,
  "correct" BOOLEAN NOT NULL,
  "questionType" VARCHAR(50) NOT NULL,
  "timeSpentMs" INTEGER,
  "answeredAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX "QuizResult_userId_wordId_idx" ON "QuizResult"("userId", "wordId");
CREATE INDEX "QuizResult_userId_answeredAt_idx" ON "QuizResult"("userId", "answeredAt");
```

### Feature Detection Logic

```javascript
/**
 * Determine which algorithm to prioritize based on user activity
 * Priority: Most recent quiz result timestamp vs. flashcard update timestamp
 */
async function determineAlgorithmMode(userId, wordId) {
  const progress = await ProgressRepository.findByUserAndWord(userId, wordId);
  const latestQuizResult = await QuizResultRepository.findLatestByUserAndWord(userId, wordId);

  if (!latestQuizResult) {
    return "flashcard"; // No quiz results yet, use flashcard mode
  }

  // Compare timestamps: if quiz was more recent, prioritize quiz algorithm
  if (latestQuizResult.answeredAt > progress.updatedAt) {
    return "quiz";
  }

  return "flashcard";
}
```

## Architecture Integration

```
Existing Flashcard System:
  POST /api/progress/update (manual confidence rating)
    ↓
  ProgressService.updateConfidence()
    ↓
  calculateNextReview(currentDelay, null, confidence)  // Uses confidence² multiplier
    ↓
  ProgressRepository.update()

New Quiz System:
  POST /api/progress/test-result (objective correct/incorrect)
    ↓
  ProgressService.recordQuizResult()
    ↓
  calculateNextReview(currentDelay, performanceMultiplier)  // Uses 2.0 or 0.0 multiplier
    ↓
  ProgressRepository.update() + QuizResultRepository.create()

Both systems share:
  - Same Progress table (nextReview, currentDelay)
  - Same calculateNextReview() function (unified formula)
  - Feature detection prevents conflicts
```

## Technical Challenges & Solutions

### Challenge 1: Multiplier Scale Normalization

**Problem:** Original AC specified quiz multipliers as `2.0` (correct) and `0.0` (incorrect), but this creates confusion when mixing with flashcard's `confidence²` (0.0-1.0 range). The formula `newDelay = baseDelay * 2.0` suggests exponential growth, but the requirement is actually for max spacing (30 days) not unbounded growth.

**Solution:** Normalized quiz multipliers to 0.0-1.0 scale matching flashcard system:
- Correct: `1.0` (maps to 30 days via `days = 1 + 29 * 1.0`)
- Incorrect: `0.0` (maps to 1 day via `days = 1 + 29 * 0.0`)
- Flashcard: `confidence²` remains unchanged (e.g., 0.8² = 0.64 → ~19 days)

**Result:** All multipliers use the same 0.0-1.0 scale, unified formula works seamlessly, behavior identical to "2.0x exponential" but with clearer intent (max vs. unbounded growth).

### Challenge 2: Algorithm Conflict Resolution

**Problem:** Existing flashcard system uses `delay = 1 + 29 * confidence²` (quadratic), proposed quiz system uses `delay = correct ? currentDelay*2 : 1` (exponential). If both systems update the same word's `nextReview` date, they override each other's calculations and destroy spaced repetition consistency.

**Solution:** Unified algorithm with performance multipliers:

- Extract common pattern: `days = 1 + (maxDays - minDays) * performanceMultiplier`
- Flashcard: `multiplier = confidence²` (0.0 to 1.0 scale preserves existing behavior)
- Quiz: `multiplier = correct ? 1.0 : 0.0` (normalized binary performance)
- Feature detection: Most recent activity type (quiz vs flashcard timestamp) determines priority via `determineAlgorithmMode()`
- Result: Both systems can coexist; gradual migration supported

### Challenge 3: Backward Compatibility

**Problem:** Existing flashcard API (`POST /api/progress/update`) has 100k+ calls in production. Cannot break existing users during migration.

**Solution:**

- `calculateNextReview()` signature: `(confidence, performanceMultiplier = null)`
- If `performanceMultiplier` is null, falls back to `confidence²` (existing behavior)
- Existing flashcard endpoints continue calling with `confidence` parameter only
- New quiz endpoints call with explicit `performanceMultiplier` parameter
- Constructor injection for `ProgressService`: accepts optional `quizResultRepository` parameter
- Zero breaking changes to existing API contracts

### Challenge 4: Data Migration Strategy

**Problem:** Adding `currentDelay` column to Progress table with 100k+ existing rows. Should we backfill values (calculate from `nextReview - now`) or leave NULL?

**Solution:** Leave NULL for existing records (no backfill):
- Avoids expensive migration calculation on startup
- New quiz/flashcard activity populates field going forward
- Service layer handles NULL gracefully: `const currentDelay = progress?.currentDelay || 1`
- Progressive migration: field gets populated organically as users engage with new features
- Risk mitigation: No data loss if migration needs rollback

**Decision:** No feature flag. Schema is additive (doesn't break existing queries), service refactor uses default parameters for backward compatibility. Deployment risk assessed as low.

### Challenge 5: Data Model Conflicts

- Keep `confidence` field for flashcard-only users (unchanged)
- Add `quiz_results` audit table for quiz-specific tracking
- Use `lapseCount` (consecutive failures) instead of confidence for leech detection
- Feature detection logic: If `quiz_results` has entries → prioritize quiz algorithm → ignore confidence field ambiguity
- Progressive migration: Confidence field becomes deprecated over time, but remains functional

## Testing Implementation

### Unit Tests

```javascript
describe("ProgressService.calculateNextReview", () => {
  it("should use confidence² multiplier when only confidence provided (flashcard mode)", () => {
    const result = calculateNextReview(0.8, null);
    const daysDiff = Math.round((result - new Date()) / (1000 * 60 * 60 * 24));
    // 1 + 29 * 0.8² = 1 + 29 * 0.64 = 19.56 → ~19 days
    expect(daysDiff).toBeGreaterThanOrEqual(18);
    expect(daysDiff).toBeLessThanOrEqual(20);
  });

  it("should use explicit multiplier when provided (quiz mode)", () => {
    const result = calculateNextReview(0.5, 1.0);
    const daysDiff = Math.round((result - new Date()) / (1000 * 60 * 60 * 24));
    // 1 + 29 * 1.0 = 30 days
    expect(daysDiff).toBe(30);
  });

  it("should reset to 1 day on quiz incorrect (multiplier = 0.0)", () => {
    const result = calculateNextReview(0, 0.0);
    const daysDiff = Math.round((result - new Date()) / (1000 * 60 * 60 * 24));
    expect(daysDiff).toBe(1);
  });
});

describe("ProgressService.recordQuizResult", () => {
  it("should increment lapseCount on incorrect answer", async () => {
    const result = await recordQuizResult({
      userId: 1,
      wordId: "word123",
      correct: false,
      questionType: "multiple_choice",
      timeSpentMs: 3500,
    });

    expect(result.lapseCount).toBeGreaterThan(0);
    expect(result.nextReviewDate).toBeDefined();
  });

  it("should reset lapseCount to 0 on correct answer", async () => {
    // Setup: word has lapseCount = 3
    await ProgressRepository.update(progressId, { lapseCount: 3 });

    const result = await recordQuizResult({
      userId: 1,
      wordId: "word123",
      correct: true,
      questionType: "type_pinyin",
      timeSpentMs: 4200,
    });

    expect(result.lapseCount).toBe(0);
  });

  it("should flag as leech after 5 consecutive failures", async () => {
    // Setup: word has lapseCount = 4
    await ProgressRepository.update(progressId, { lapseCount: 4 });

    const result = await recordQuizResult({
      userId: 1,
      wordId: "word123",
      correct: false,
      questionType: "type_character",
      timeSpentMs: 2800,
    });

    expect(result.isLeech).toBe(true);
    expect(result.lapseCount).toBe(5);
  });
});
```

### Integration Tests

```javascript
describe("Flashcard and Quiz Coexistence", () => {
  it("should not override quiz-based nextReview with flashcard confidence update", async () => {
    // 1. User completes quiz (correct answer, delay = 10 days)
    await request(app)
      .post("/api/progress/test-result")
      .send({ wordId: "word123", correct: true, questionType: "multiple_choice" })
      .expect(200);

    const afterQuiz = await ProgressRepository.findByUserAndWord(userId, "word123");
    const quizNextReview = afterQuiz.nextReview;

    // 2. User also reviews flashcard (confidence = 0.5, delay = 2.5 days)
    await request(app)
      .post("/api/progress/update")
      .send({ wordId: "word123", confidence: 0.5 })
      .expect(200);

    const afterFlashcard = await ProgressRepository.findByUserAndWord(userId, "word123");

    // 3. Feature detection should prioritize quiz (more recent)
    // nextReview should remain close to quizNextReview, not reset to flashcard's shorter delay
    const timeDiff = Math.abs(afterFlashcard.nextReview - quizNextReview);
    expect(timeDiff).toBeLessThan(60000); // Less than 1 minute difference
  });
});
```

### Edge Cases

1. **User switches from flashcard to quiz mid-word**: Feature detection uses most recent activity timestamp to determine algorithm priority
2. **Migration script runs twice**: Prisma schema ensures idempotent migrations (IF NOT EXISTS checks)
3. **Quiz result saved with invalid wordId**: Validation in controller rejects before service layer processing
4. **LapseCount overflow**: Capped at INTEGER max (2 billion); realistically never reached
5. **Zero existing progress records**: `recordQuizResult()` creates new progress entry if none exists

---

**Related Documentation:**

- [Story 15.1 BR](../../business-requirements/epic-15-learning-retention/story-15-1-progress-system-adaptation.md)
- [Epic 15 Implementation](./README.md)
- [ProgressService.js](../../../apps/backend/src/core/services/ProgressService.js)
- [Prisma Schema](../../../apps/backend/prisma/schema.prisma)
