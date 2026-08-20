# Story 17.3: Extract Progress Module (Backend)

## Description

**As a** developer,
**I want to** extract `ProgressController`, `ProgressService`, `ProgressRepository`, `StreakService`, and `StreakRepository` from `modules/quiz/` into a new `modules/progress/` with a generic `POST /api/progress/event` endpoint,
**So that** the backend progress API is feature-agnostic and any feature can record progress without depending on the quiz module.

## Business Value

The backend quiz module currently owns progress tracking logic, forcing features like reading and radicals to either depend on the quiz module or implement their own progress tracking. Extracting progress into its own module with a generic event endpoint enables any feature to record progress via a single API call. The old quiz-progress endpoints are kept as deprecated wrappers, ensuring zero disruption during migration.

Benefits:

- Reading and radicals features record progress without importing from quiz module
- Single `POST /api/progress/event` endpoint for all progress events (future-proof)
- Clean Architecture preserved — same patterns as other modules
- Old endpoints remain functional during migration (deprecated wrappers)
- Quiz module becomes single-purpose (quiz sessions only)

## Acceptance Criteria

- [x] New `modules/progress/` directory created with Clean Architecture structure: `api/`, `domain/`, `repositories/`, `use-cases/`
- [x] `ProgressController.js` moved from `modules/quiz/api/` to `modules/progress/api/` — all handlers preserved
- [x] `progressRoutes.js` moved from `modules/quiz/api/` to `modules/progress/api/` — all routes preserved
- [x] `ProgressService.js` moved from `modules/quiz/use-cases/` to `modules/progress/use-cases/`
- [x] `StreakService.js` moved from `modules/quiz/use-cases/` to `modules/progress/use-cases/`
- [x] `ProgressRepository.js` moved from `modules/quiz/repositories/` to `modules/progress/repositories/`
- [x] `StreakRepository.js` moved from `modules/quiz/repositories/` to `modules/progress/repositories/`
- [x] Domain entities moved: `Progress.js`, `StudyStreak.js` from `modules/quiz/domain/entities/` to `modules/progress/domain/entities/`
- [x] Domain interfaces moved: `IProgressRepository.js` from `modules/quiz/domain/interfaces/` to `modules/progress/domain/interfaces/`
- [x] New `POST /api/progress/event` endpoint created — accepts `{ type, feature, data }` and routes to correct handler
- [x] Old quiz progress endpoints kept as deprecated wrappers — delegate to the same ProgressService
- [x] `modules/progress/index.js` exports `ProgressService` and `StreakService`
- [x] `container.js` updated to instantiate `modules/progress/` dependencies
- [x] Route registration updated to mount `modules/progress/` routes under `/api`
- [x] Quiz module's `index.js` no longer exports `ProgressService` (consumers import from progress module)
- [x] All existing progress API tests pass unchanged
- [x] Backend starts and all progress endpoints respond correctly

## Business Rules

1. **Zero behavioral changes**: All moved files preserve identical logic — only file locations change
2. **Deprecated wrapper pattern**: Old quiz-progress endpoints remain functional for 2 weeks after migration, then removed
3. **Event routing**: The `POST /api/progress/event` endpoint routes by `type` field to the correct handler
4. **Quiz module unchanged**: Quiz session endpoints remain in `modules/quiz/` untouched

## Related Issues

- Epic 17: [State Restructure & Zustand Migration](README.md) (Epic parent)
- Story 17.2: [Extract Progress Feature (Frontend)](story-17-2-extract-progress-feature-frontend.md) (Frontend counterpart)

## Implementation Status

- **Status**: Completed
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: `f97b8a8`
