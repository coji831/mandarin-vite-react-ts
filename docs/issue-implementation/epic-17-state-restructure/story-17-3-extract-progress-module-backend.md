# Implementation 17-3: Extract Progress Module (Backend)

## Technical Scope

**Files to create:**

- `apps/backend/src/modules/progress/api/ProgressController.js` — moved from `modules/quiz/api/ProgressController.js`
- `apps/backend/src/modules/progress/api/progressRoutes.js` — moved from `modules/quiz/api/progressRoutes.js`
- `apps/backend/src/modules/progress/api/eventRoutes.js` — NEW: generic event endpoint
- `apps/backend/src/modules/progress/domain/entities/Progress.js` — moved from `modules/quiz/domain/entities/Progress.js`
- `apps/backend/src/modules/progress/domain/entities/StudyStreak.js` — moved from `modules/quiz/domain/entities/StudyStreak.js`
- `apps/backend/src/modules/progress/domain/interfaces/IProgressRepository.js` — moved from `modules/quiz/domain/interfaces/IProgressRepository.js`
- `apps/backend/src/modules/progress/repositories/ProgressRepository.js` — moved from `modules/quiz/repositories/ProgressRepository.js`
- `apps/backend/src/modules/progress/repositories/StreakRepository.js` — moved from `modules/quiz/repositories/StreakRepository.js`
- `apps/backend/src/modules/progress/use-cases/ProgressService.js` — moved from `modules/quiz/use-cases/ProgressService.js`
- `apps/backend/src/modules/progress/use-cases/StreakService.js` — moved from `modules/quiz/use-cases/StreakService.js`
- `apps/backend/src/modules/progress/index.js` — module barrel export
- `apps/backend/src/modules/progress/README.md` — optional

**Files to modify:**

- `apps/backend/src/app/container.js` — add progress module DI registration
- `apps/backend/src/app/routes.js` — add progress module route mounting
- `apps/backend/src/modules/quiz/index.js` — remove ProgressService export

**Files to retain in quiz module (NOT moved):**

- `modules/quiz/api/progressRoutes.js` — kept as deprecated wrapper (delegates to ProgressService)
- `modules/quiz/api/ProgressController.js` — kept as deprecated wrapper (or removed if routes now point to new module)

## Implementation Details

### Step 1: Create Module Structure

Copy files from `modules/quiz/` to `modules/progress/` preserving their exact content. The structure mirrors other modules:

```
modules/progress/
├── api/
│   ├── ProgressController.js   ← copied from quiz
│   ├── progressRoutes.js       ← copied from quiz (route paths unchanged)
│   └── eventRoutes.js          ← NEW
├── domain/
│   ├── entities/
│   │   ├── Progress.js         ← copied from quiz
│   │   └── StudyStreak.js      ← copied from quiz
│   └── interfaces/
│       └── IProgressRepository.js ← copied from quiz
├── repositories/
│   ├── ProgressRepository.js   ← copied from quiz
│   └── StreakRepository.js     ← copied from quiz
├── use-cases/
│   ├── ProgressService.js      ← copied from quiz
│   └── StreakService.js        ← copied from quiz
└── index.js                    ← NEW barrel export
```

### Step 2: Create Event Router

```javascript
// modules/progress/api/eventRoutes.js
import express from "express";
import { authenticateToken } from "../../../shared/middleware/authMiddleware.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";

const router = express.Router();

/**
 * POST /api/progress/event
 * Generic progress event endpoint — routes events to correct handler.
 *
 * Body: { type: string, feature: string, data: object }
 *
 * Event types:
 *   - "record-answer"   → ProgressService.recordQuizResult
 *   - "update-streak"   → StreakService.updateStreak
 *   - "batch-update"    → ProgressService.batchUpdateProgress
 */
router.post(
  "/",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { type, feature, data } = req.body;
    const userId = req.userId;

    switch (type) {
      case "record-answer":
        await req.progressService.recordQuizResult(userId, data.wordId, data.correct, feature);
        break;
      case "update-streak":
        await req.streakService.updateStreak(userId, data.date ? new Date(data.date) : new Date());
        break;
      case "batch-update":
        await req.progressService.batchUpdateProgress(userId, data.updates);
        break;
      default:
        return res.status(400).json({ error: `Unknown event type: ${type}` });
    }

    res.status(200).json({ success: true });
  }),
);

export { router as eventRoutes };
```

### Step 3: Update Module Barrel

```javascript
// modules/progress/index.js
export { ProgressService } from "./use-cases/ProgressService.js";
export { StreakService } from "./use-cases/StreakService.js";
```

### Step 4: Update DI Container (`container.js`)

```javascript
// Add progress module dependencies
import { ProgressController } from "../modules/progress/api/ProgressController.js";
import { ProgressService } from "../modules/progress/use-cases/ProgressService.js";
import { StreakService } from "../modules/progress/use-cases/StreakService.js";
import { ProgressRepository } from "../modules/progress/repositories/ProgressRepository.js";
import { StreakRepository } from "../modules/progress/repositories/StreakRepository.js";

// Instantiate
const progressRepository = new ProgressRepository(prisma);
const streakRepository = new StreakRepository(prisma);
const progressService = new ProgressService(progressRepository);
const streakService = new StreakService(streakRepository);
const progressController = new ProgressController(
  progressService,
  streakService,
  gamificationService,
);
```

### Step 5: Update Route Registration

```javascript
// routes.js — add progress module routes
import { progressRoutes } from "../modules/progress/api/progressRoutes.js";
import { eventRoutes } from "../modules/progress/api/eventRoutes.js";

router.use("/api/progress", authenticateToken, progressRoutes);
router.use("/api/progress/event", authenticateToken, eventRoutes);
```

### Step 6: Keep Deprecated Quiz Wrappers

In `modules/quiz/api/progressRoutes.js`, add a deprecation notice to each handler:

```javascript
// DEPRECATED: Will be removed after migration to modules/progress/
// Use /api/progress/event endpoint for new development.
```

## Architecture Integration

```
Before:
  modules/quiz/
    api/ProgressController.js     ← progress HTTP handlers mixed with quiz
    api/progressRoutes.js         ← progress routes mixed with quiz
    use-cases/ProgressService.js  ← progress business logic
    use-cases/StreakService.js    ← streak business logic
    repositories/ProgressRepository.js
    repositories/StreakRepository.js

After:
  modules/progress/               ← NEW dedicated module
    api/ProgressController.js     ← moved
    api/progressRoutes.js         ← moved
    api/eventRoutes.js            ← NEW: generic event endpoint
    use-cases/ProgressService.js  ← moved
    use-cases/StreakService.js    ← moved
    repositories/ProgressRepository.js ← moved
    repositories/StreakRepository.js   ← moved

  modules/quiz/                   ← now single-purpose
    (progress files removed from index.js export, kept as deprecated wrappers)
```

## Technical Challenges & Solutions

```
Problem: DI container needs to instantiate progress module services while quiz module
still references old locations
Solution: Create new progress module with clean DI registration. Keep quiz module's
progress references as deprecated wrappers that delegate to the new module's services.
Both point to the same Prisma database — no data duplication.

Problem: Route ordering — /api/progress/event must not be captured by /api/progress/:wordId
Solution: Register eventRoutes BEFORE progressRoutes in route registration, similar to
how /streak routes come before /:wordId in the existing codebase.
```

## Testing Implementation

- Move existing progress-related backend tests alongside new module
- Add test for `POST /api/progress/event` routing (all event types)
- Verify deprecated quiz progress endpoints still work
- All existing progress tests pass unchanged
