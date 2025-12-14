# Implementation 13-4: Multi-User Progress API

## Technical Scope

Build REST API for per-user progress tracking (list, get, update, batch, stats). Implement ProgressService with business logic. Create data migration utility for localStorage → backend sync. Update frontend to use backend API.

## Implementation Details

```typescript
// apps/backend/src/core/services/ProgressService.ts
import { prisma } from "../../infrastructure/database/client";

export class ProgressService {
  async getProgressForUser(userId: string) {
    return prisma.progress.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
  }

  async getProgressForWord(userId: string, wordId: string) {
    return prisma.progress.findUnique({
      where: { userId_wordId: { userId, wordId } },
    });
  }

  async updateProgress(
    userId: string,
    wordId: string,
    data: {
      studyCount?: number;
      correctCount?: number;
      confidence?: number;
    }
  ) {
    // Calculate next review date based on spaced repetition algorithm
    const nextReview = this.calculateNextReview(data.confidence || 0);

    return prisma.progress.upsert({
      where: { userId_wordId: { userId, wordId } },
      update: {
        ...data,
        nextReview,
        updatedAt: new Date(),
      },
      create: {
        userId,
        wordId,
        studyCount: data.studyCount || 1,
        correctCount: data.correctCount || 0,
        confidence: data.confidence || 0,
        nextReview,
      },
    });
  }

  async batchUpdateProgress(
    userId: string,
    updates: Array<{
      wordId: string;
      studyCount?: number;
      correctCount?: number;
      confidence?: number;
    }>
  ) {
    // Use transaction for atomicity
    return prisma.$transaction(
      updates.map((update) => this.updateProgress(userId, update.wordId, update))
    );
  }

  async getProgressStats(userId: string) {
    const allProgress = await prisma.progress.findMany({ where: { userId } });

    const totalWords = await prisma.vocabularyWord.count();
    const studiedWords = allProgress.length;
    const masteredWords = allProgress.filter((p) => p.confidence >= 0.8).length;
    const totalStudyCount = allProgress.reduce((sum, p) => sum + p.studyCount, 0);
    const averageConfidence =
      studiedWords > 0 ? allProgress.reduce((sum, p) => sum + p.confidence, 0) / studiedWords : 0;

    return {
      totalWords,
      studiedWords,
      masteredWords,
      totalStudyCount,
      averageConfidence,
      wordsToReviewToday: allProgress.filter((p) => p.nextReview <= new Date()).length,
    };
  }

  private calculateNextReview(confidence: number): Date {
    // Spaced repetition algorithm
    const baseDelay = 1; // 1 day minimum
    const maxDelay = 30; // 30 days maximum
    const delay = Math.min(maxDelay, baseDelay * Math.pow(2, confidence * 5));

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + Math.floor(delay));
    return nextReview;
  }
}
```

```typescript
// apps/backend/src/api/controllers/ProgressController.ts
import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { ProgressService } from "../../core/services/ProgressService";

const progressService = new ProgressService();

export class ProgressController {
  async list(req: AuthRequest, res: Response) {
    try {
      const progress = await progressService.getProgressForUser(req.userId!);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress", code: "PROGRESS_FETCH_ERROR" });
    }
  }

  async get(req: AuthRequest, res: Response) {
    try {
      const { wordId } = req.params;
      const progress = await progressService.getProgressForWord(req.userId!, wordId);

      if (!progress) {
        return res.status(404).json({ error: "Progress not found", code: "PROGRESS_NOT_FOUND" });
      }

      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress", code: "PROGRESS_FETCH_ERROR" });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const { wordId } = req.params;
      const progress = await progressService.updateProgress(req.userId!, wordId, req.body);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to update progress", code: "PROGRESS_UPDATE_ERROR" });
    }
  }

  async batch(req: AuthRequest, res: Response) {
    try {
      const { updates } = req.body;
      const results = await progressService.batchUpdateProgress(req.userId!, updates);
      res.json(results);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to batch update progress", code: "PROGRESS_BATCH_ERROR" });
    }
  }

  async stats(req: AuthRequest, res: Response) {
    try {
      const stats = await progressService.getProgressStats(req.userId!);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats", code: "STATS_FETCH_ERROR" });
    }
  }
}
```

```typescript
// apps/frontend/src/utils/progressMigration.ts
import { API_PATHS } from "@mandarin/shared-constants";

export async function migrateLocalProgressToBackend(accessToken: string) {
  // Read localStorage progress
  const localProgress = JSON.parse(localStorage.getItem("userProgress") || "{}");

  if (Object.keys(localProgress).length === 0) {
    console.log("No local progress to migrate");
    return;
  }

  // Convert to batch update format
  const updates = Object.entries(localProgress).map(([wordId, data]: [string, any]) => ({
    wordId,
    studyCount: data.studyCount,
    correctCount: data.correctCount,
    confidence: data.confidence,
  }));

  // Send to backend
  const response = await fetch(API_PATHS.PROGRESS.BATCH, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ updates }),
  });

  if (!response.ok) {
    throw new Error("Migration failed");
  }

  // Backup localStorage and clear (keep backup for 30 days)
  localStorage.setItem("userProgress_backup", JSON.stringify(localProgress));
  localStorage.setItem("userProgress_backup_date", new Date().toISOString());
  localStorage.removeItem("userProgress");

  console.log(`Migrated ${updates.length} progress records to backend`);
}
```

## Architecture Integration

```
Frontend Progress UI
    ↓ GET/PUT /api/v1/progress/*
ProgressController (API Layer)
    ↓ requires auth (userId from JWT)
ProgressService (Business Logic)
    ↓ uses
ProgressRepository
    ↓ queries
PostgreSQL (strict userId filtering)
```

All progress queries filtered by authenticated `userId` to ensure data isolation. Spaced repetition logic encapsulated in ProgressService.

## Technical Challenges & Solutions

```
Problem: Data isolation (prevent cross-user progress leaks)
Solution: All queries filtered by authenticated userId:
- userId injected by auth middleware (from JWT)
- All service methods require userId parameter
- Database unique constraint on (userId, wordId)
- Integration tests verify isolation (create 2 users, check no overlap)
```

```
Problem: Batch updates performance (avoid N+1 queries)
Solution: Use Prisma transactions for atomicity:
- Wrap multiple upsert operations in $transaction
- All succeed or all fail (prevents partial updates)
- Execute in parallel where possible (independent operations)
```

## Testing Implementation

**Unit Tests:**

- ProgressService methods (isolated from database)
- Spaced repetition algorithm (nextReview calculation)
- Stats calculation accuracy

**Integration Tests:**

- Full CRUD cycle: create → read → update → delete
- Data isolation: user A cannot access user B's progress
- Batch updates atomic: partial failure rolls back all
- Migration utility: localStorage → backend sync successful
- Frontend integration: fetch progress → display → update → re-fetch
