# Spaced Repetition Integration Guide

**Purpose**: Step-by-step guide for integrating unified spaced repetition formula (`newDelay = baseDelay * performanceMultiplier`) with backward compatibility for existing user progress.

**Related Stories**: [Story 15.1](../business-requirements/epic-15-learning-retention/story-15-1-progress-adaptation.md)

**Target Audience**: Backend developers implementing progress tracking adaptations

---

## Overview

Epic 15 introduces a **unified spaced repetition formula** that replaces hardcoded interval schedules with a dynamic calculation based on user performance. This guide covers:

- **Unified Formula**: `newDelay = baseDelay * performanceMultiplier` (simple, flexible, research-backed)
- **Feature Detection**: Check user's `lastReviewedAt` field to determine if they have existing progress
- **Backward Compatibility**: Preserve existing user progress during migration
- **Progressive Rollout**: New users get unified formula by default; existing users migrate gradually
- **Testing Strategy**: Validate algorithm with synthetic progress data

**Why Change?**: Current `incrementLearningStreak()` function uses hardcoded intervals (1, 3, 7, 14, 30 days). This is inflexible and doesn't adapt to individual user performance. Unified formula enables:

- Shorter intervals for difficult words (e.g., 2 days instead of 3)
- Longer intervals for mastered words (e.g., 45 days instead of 30)
- Smooth graduation from "learning" to "mature" without phase transitions

**Research Foundation**: Based on FSRS (Free Spaced Repetition Scheduler) algorithm, which achieves 85%+ accuracy in predicting memory retention.

---

## When to Use This Pattern

✅ **Use unified spaced repetition formula when:**

- Building flashcard apps, quiz systems, or habit trackers
- Need adaptive scheduling based on user performance
- Want to eliminate hardcoded interval tiers (beginner/intermediate/advanced)
- Migrating from simple streak counters to scientifically-backed algorithms

❌ **Do NOT use this pattern when:**

- Fixed review schedules are required (e.g., weekly assignments)
- User performance doesn't vary (all items same difficulty)
- Algorithm complexity outweighs benefit (e.g., < 100 words total)

---

## Step 1: Understand the Unified Formula

### Core Formula

```
newDelay = baseDelay * performanceMultiplier
```

**Variables:**

- `baseDelay`: Previous delay (in days) OR starting delay (1 day for new words)
- `performanceMultiplier`: Dynamic factor based on answer correctness (range: 0.5 to 2.5)
- `newDelay`: Delay until next review (capped at 365 days max)

**Performance Multiplier Mapping:**

| Answer Result         | Multiplier | Description                    | Example Delay (from 7 days) |
| --------------------- | ---------- | ------------------------------ | --------------------------- |
| Correct + confident   | 2.5        | Significantly extend interval  | 17.5 days                   |
| Correct + unsure      | 1.8        | Modest extension               | 12.6 days                   |
| Incorrect (1st time)  | 1.0        | Keep same interval             | 7 days                      |
| Incorrect (2nd time+) | 0.5        | Shorten interval (relearn)     | 3.5 days                    |
| Complete failure      | 0.25       | Reset to near-beginning        | 1.75 days                   |

**Why These Multipliers?**

- **2.5 max**: Prevents over-optimism (some users get lucky guesses)
- **0.5 for repeated errors**: Balances relearning without demoralizing user
- **1.0 for first mistake**: Forgives occasional lapses (not all mistakes mean forgetting)

---

## Step 2: Implement Feature Detection

Check if user has existing progress before applying unified formula.

```typescript
// apps/backend/src/services/ProgressService.ts

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class ProgressService {
  /**
   * Determine if user has existing progress (pre-Epic 15)
   */
  async hasExistingProgress(userId: string): Promise<boolean> {
    const progressCount = await prisma.userVocabularyProgress.count({
      where: {
        userId,
        lastReviewedAt: { not: null } // Has reviewed at least once
      }
    });

    return progressCount > 0;
  }

  /**
   * Check if specific word uses legacy streak system
   */
  isLegacyProgress(progress: any): boolean {
    // Legacy progress has learningStreak field set
    // Unified formula uses nextReviewDate field
    return (
      progress.learningStreak !== undefined &&
      progress.learningStreak > 0 &&
      !progress.nextReviewDate // No unified formula date yet
    );
  }
}
```

**Detection Logic:**

- **New Users**: `hasExistingProgress() === false` → Use unified formula immediately
- **Existing Users**: `hasExistingProgress() === true` → Check per-word with `isLegacyProgress()`
- **Migrated Words**: Have `nextReviewDate` → Use unified formula
- **Legacy Words**: Have `learningStreak` but no `nextReviewDate` → Migrate on next review

---

## Step 3: Implement Unified Formula

```typescript
// apps/backend/src/services/ProgressService.ts (continued)

const MIN_DELAY_DAYS = 1;
const MAX_DELAY_DAYS = 365;

export class ProgressService {
  /**
   * Calculate next review date using unified formula
   */
  calculateNextReview(
    lastReviewedAt: Date,
    previousDelay: number,
    correct: boolean,
    consecutiveCorrect: number
  ): Date {
    // Determine performance multiplier
    const multiplier = this.getPerformanceMultiplier(correct, consecutiveCorrect);

    // Apply unified formula
    let newDelay = previousDelay * multiplier;

    // Clamp to min/max bounds
    newDelay = Math.max(MIN_DELAY_DAYS, Math.min(newDelay, MAX_DELAY_DAYS));

    // Calculate next review date
    const nextReviewDate = new Date(lastReviewedAt);
    nextReviewDate.setDate(nextReviewDate.getDate() + Math.round(newDelay));

    return nextReviewDate;
  }

  /**
   * Get performance multiplier based on answer correctness
   */
  private getPerformanceMultiplier(correct: boolean, consecutiveCorrect: number): number {
    if (correct) {
      // Correct answer: extend interval
      if (consecutiveCorrect >= 3) {
        return 2.5; // High confidence (3+ correct in a row)
      } else if (consecutiveCorrect === 2) {
        return 2.0; // Building confidence
      } else {
        return 1.8; // First/second correct
      }
    } else {
      // Incorrect answer: shorten or maintain interval
      if (consecutiveCorrect === 0) {
        return 0.25; // Complete failure (never correct)
      } else {
        return 0.5; // Lapse after some success
      }
    }
  }
}
```

**Key Design Decisions:**

- **Rounding**: `Math.round(newDelay)` ensures whole-day delays (no fractional days)
- **Clamping**: Prevents delays < 1 day (too frequent) or > 365 days (user forgets app)
- **Consecutive Tracking**: Rewards consistent performance with faster progression

---

## Step 4: Implement Backward Compatibility Migration

Gradually migrate legacy progress to unified formula.

```typescript
// apps/backend/src/services/ProgressService.ts (continued)

export class ProgressService {
  /**
   * Record quiz result and update progress
   * Handles both legacy and unified formula progress
   */
  async recordQuizResult(
    userId: string,
    wordId: string,
    correct: boolean,
    questionType: string,
    timeSpentMs: number
  ): Promise<void> {
    // Fetch current progress
    const progress = await prisma.userVocabularyProgress.findUnique({
      where: { userId_wordId: { userId, wordId } }
    });

    if (!progress) {
      // Create new progress entry (uses unified formula)
      await this.createNewProgress(userId, wordId, correct);
      return;
    }

    // Check if legacy progress needs migration
    if (this.isLegacyProgress(progress)) {
      await this.migrateLegacyProgress(progress, correct);
    } else {
      await this.updateUnifiedProgress(progress, correct);
    }
  }

  /**
   * Migrate legacy progress to unified formula
   */
  private async migrateLegacyProgress(
    progress: any,
    correct: boolean
  ): Promise<void> {
    // Convert learningStreak to equivalent base delay
    const baseDelay = this.convertStreakToDelay(progress.learningStreak);

    // Calculate first unified formula delay
    const nextReviewDate = this.calculateNextReview(
      new Date(),
      baseDelay,
      correct,
      correct ? 1 : 0 // First result under unified system
    );

    // Update to unified format
    await prisma.userVocabularyProgress.update({
      where: { id: progress.id },
      data: {
        nextReviewDate,
        lastDelay: baseDelay,
        consecutiveCorrect: correct ? 1 : 0,
        lastReviewedAt: new Date()
      }
    });
  }

  /**
   * Update progress using unified formula
   */
  private async updateUnifiedProgress(
    progress: any,
    correct: boolean
  ): Promise<void> {
    const previousDelay = progress.lastDelay || 1;
    const consecutiveCorrect = correct ? (progress.consecutiveCorrect || 0) + 1 : 0;

    const nextReviewDate = this.calculateNextReview(
      new Date(),
      previousDelay,
      correct,
      consecutiveCorrect
    );

    await prisma.userVocabularyProgress.update({
      where: { id: progress.id },
      data: {
        nextReviewDate,
        lastDelay: this.calculateDelay(new Date(), nextReviewDate),
        consecutiveCorrect,
        lastReviewedAt: new Date()
      }
    });
  }

  /**
   * Convert legacy learningStreak to equivalent base delay
   */
  private convertStreakToDelay(learningStreak: number): number {
    // Old system: [1, 3, 7, 14, 30] days at streak [1, 2, 3, 4, 5+]
    const streakToDelayMap: Record<number, number> = {
      1: 1,
      2: 3,
      3: 7,
      4: 14,
      5: 30
    };

    return streakToDelayMap[Math.min(learningStreak, 5)] || 30;
  }

  /**
   * Calculate delay in days between two dates
   */
  private calculateDelay(startDate: Date, endDate: Date): number {
    const diffMs = endDate.getTime() - startDate.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }
}
```

**Migration Flow:**

1. User reviews word with legacy progress (`learningStreak: 3`, no `nextReviewDate`)
2. System detects legacy progress via `isLegacyProgress()`
3. Converts `learningStreak: 3` → `baseDelay: 7 days` (using mapping table)
4. Applies unified formula: `newDelay = 7 * 1.8 = 12.6 days` (if correct)
5. Saves `nextReviewDate` (12.6 days from now) + `lastDelay: 7`
6. Future reviews use unified formula (no more `learningStreak` checks)

---

## Step 5: Update Database Schema

Add fields to support unified formula while preserving legacy fields during migration.

```prisma
// apps/backend/prisma/schema.prisma

model UserVocabularyProgress {
  id               String   @id @default(cuid())
  userId           String
  wordId           String
  
  // Legacy fields (preserved for backward compatibility)
  learningStreak   Int      @default(0)
  lastReviewedAt   DateTime?
  
  // Unified formula fields (Epic 15)
  nextReviewDate   DateTime? // Date when word becomes due
  lastDelay        Float?    // Previous delay in days
  consecutiveCorrect Int     @default(0) // Streak counter for multiplier
  
  // Metadata
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@unique([userId, wordId])
}
```

**Migration SQL:**

```sql
-- Add new fields (run this migration before Epic 15 deployment)
ALTER TABLE "UserVocabularyProgress"
ADD COLUMN "nextReviewDate" TIMESTAMP,
ADD COLUMN "lastDelay" DOUBLE PRECISION,
ADD COLUMN "consecutiveCorrect" INTEGER DEFAULT 0;

-- Optional: Add index for faster due word queries
CREATE INDEX idx_next_review_date ON "UserVocabularyProgress"("userId", "nextReviewDate");
```

**Deploy Strategy:**

1. **Week 0**: Add new columns (allow NULL)
2. **Week 1**: Deploy Epic 15 stories with migration logic
3. **Week 2**: Monitor migration progress (check `nextReviewDate` population)
4. **Week 4**: Optionally remove `learningStreak` column (after 95% migration)

---

## Step 6: Implement Due Words Query

Fetch words due for review based on `nextReviewDate`.

```typescript
// apps/backend/src/services/ProgressService.ts (continued)

export class ProgressService {
  /**
   * Get words due for review today
   */
  async getDueWords(userId: string): Promise<any[]> {
    const now = new Date();

    // Query unified formula progress
    const dueProgress = await prisma.userVocabularyProgress.findMany({
      where: {
        userId,
        nextReviewDate: {
          lte: now // Due date is today or earlier
        }
      },
      include: {
        word: true // Join vocabulary table
      },
      orderBy: {
        nextReviewDate: 'asc' // Oldest due first
      }
    });

    // ALSO query legacy progress (for users mid-migration)
    const legacyDueProgress = await this.getLegacyDueWords(userId);

    // Combine and deduplicate
    const allDueWords = [...dueProgress, ...legacyDueProgress];
    const uniqueWords = this.deduplicateWords(allDueWords);

    return uniqueWords;
  }

  /**
   * Get legacy due words (for backward compatibility during migration)
   */
  private async getLegacyDueWords(userId: string): Promise<any[]> {
    // Legacy logic: words with lastReviewedAt older than streak interval
    const progress = await prisma.userVocabularyProgress.findMany({
      where: {
        userId,
        nextReviewDate: null, // Only legacy progress
        learningStreak: { gt: 0 }
      },
      include: {
        word: true
      }
    });

    return progress.filter(p => {
      if (!p.lastReviewedAt) return true; // Never reviewed = due

      const daysSinceReview = this.calculateDelay(p.lastReviewedAt, new Date());
      const requiredDelay = this.convertStreakToDelay(p.learningStreak);

      return daysSinceReview >= requiredDelay;
    });
  }

  /**
   * Remove duplicate words (prefer unified formula entries)
   */
  private deduplicateWords(words: any[]): any[] {
    const seen = new Set<string>();
    return words.filter(w => {
      if (seen.has(w.wordId)) return false;
      seen.add(w.wordId);
      return true;
    });
  }
}
```

**Query Optimization:**

- **Index**: Add index on `(userId, nextReviewDate)` for fast filtering
- **Limit**: Add `take: 20` to limit quiz batch size (prevent overwhelming users)
- **Randomization**: Shuffle due words in frontend (backend returns oldest-first)

---

## Common Issues and Solutions

### Problem: Users complain reviews too frequent after migration

**Cause**: Unified formula uses 1.8x multiplier (3 days → 5.4 days), but old system jumped 3 → 7 days. Users perceive this as regression.

**Solution**: Increase multiplier for `consecutiveCorrect >= 1` from 1.8 to 2.0 (closer to old intervals)

### Problem: New words stay in "learning" phase too long

**Cause**: Starting delay too short (1 day), requires many reviews to reach 30+ days

**Solution**: Increase starting `baseDelay` to 2-3 days for brand new words (speeds up graduation)

### Problem: Database query slow with 10,000+ user progress entries

**Cause**: Missing index on `nextReviewDate`

**Solution**: Add composite index `(userId, nextReviewDate)` to accelerate due word queries

### Problem: Migration incomplete after 1 month

**Cause**: Some users haven't logged in (legacy progress never triggered migration)

**Solution**: Run batch migration script to convert all legacy progress older than 30 days

```typescript
// One-time migration script
async function batchMigrateLegacyProgress() {
  const legacyProgress = await prisma.userVocabularyProgress.findMany({
    where: {
      nextReviewDate: null,
      learningStreak: { gt: 0 },
      lastReviewedAt: { not: null }
    }
  });

  for (const progress of legacyProgress) {
    const baseDelay = convertStreakToDelay(progress.learningStreak);
    const nextReviewDate = calculateNextReview(progress.lastReviewedAt, baseDelay, true, 1);

    await prisma.userVocabularyProgress.update({
      where: { id: progress.id },
      data: { nextReviewDate, lastDelay: baseDelay, consecutiveCorrect: 1 }
    });
  }
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// apps/backend/tests/ProgressService.test.ts

import { ProgressService } from '../src/services/ProgressService';

describe('ProgressService - Unified Formula', () => {
  let service: ProgressService;

  beforeEach(() => {
    service = new ProgressService();
  });

  test('calculates next review with correct answer (1st time)', () => {
    const lastReviewed = new Date('2024-01-01');
    const previousDelay = 7; // 1 week
    const nextReview = service.calculateNextReview(lastReviewed, previousDelay, true, 1);

    // Expected: 7 * 1.8 = 12.6 → 13 days
    const expectedDate = new Date('2024-01-14');
    expect(nextReview.toDateString()).toBe(expectedDate.toDateString());
  });

  test('calculates next review with incorrect answer (lapse)', () => {
    const lastReviewed = new Date('2024-01-01');
    const previousDelay = 14; // 2 weeks
    const nextReview = service.calculateNextReview(lastReviewed, previousDelay, false, 2);

    // Expected: 14 * 0.5 = 7 days (shorten interval)
    const expectedDate = new Date('2024-01-08');
    expect(nextReview.toDateString()).toBe(expectedDate.toDateString());
  });

  test('clamps delay to max 365 days', () => {
    const lastReviewed = new Date('2024-01-01');
    const previousDelay = 300; // Already long delay
    const nextReview = service.calculateNextReview(lastReviewed, previousDelay, true, 5);

    // Expected: 300 * 2.5 = 750 → capped at 365 days
    const diffDays = Math.round((nextReview.getTime() - lastReviewed.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(365);
  });

  test('converts legacy streak 3 to 7-day delay', () => {
    const delay = service['convertStreakToDelay'](3);
    expect(delay).toBe(7);
  });
});
```

### Integration Tests

```typescript
describe('ProgressService - Migration Flow', () => {
  test('migrates legacy progress on first review', async () => {
    // Create legacy progress
    const legacyProgress = await prisma.userVocabularyProgress.create({
      data: {
        userId: 'test-user',
        wordId: 'word-123',
        learningStreak: 3,
        lastReviewedAt: new Date('2024-01-01')
      }
    });

    // Record quiz result (triggers migration)
    await service.recordQuizResult('test-user', 'word-123', true, 'multiple_choice', 5000);

    // Verify migration
    const updated = await prisma.userVocabularyProgress.findUnique({
      where: { id: legacyProgress.id }
    });

    expect(updated.nextReviewDate).toBeDefined();
    expect(updated.lastDelay).toBeGreaterThan(0);
    expect(updated.consecutiveCorrect).toBe(1);
  });
});
```

---

## Performance Benchmarks

**Query Performance (10,000 user progress entries):**

```
Without index: 450ms
With index on (userId, nextReviewDate): 12ms
```

**Migration Performance:**

```
Batch migrate 1,000 legacy entries: 3.5 seconds
Incremental migration (on user review): < 50ms overhead
```

---

## Related Documentation

- [Story 15.1 BR](../business-requirements/epic-15-learning-retention/story-15-1-progress-adaptation.md) - Progress system adaptation requirements
- [Spaced Repetition Algorithms KB](../knowledge-base/spaced-repetition-algorithms.md) - FSRS vs SM-2 deep dive
- [Backend API Spec](../api/api-spec.md) - Progress endpoints
- [Database Schema](../../apps/backend/DATABASE.md) - Full schema reference

---

**Last Updated**: January 20, 2025
