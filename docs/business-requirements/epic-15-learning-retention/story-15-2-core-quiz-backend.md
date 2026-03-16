# Story 15.2: Core Quiz Backend Infrastructure

## Description

**As a** backend developer,
**I want to** expose API endpoints for due words, test results, and leech tracking,
**So that** the frontend can fetch vocabulary requiring review and save quiz answers.

## Business Value

This story provides the foundational backend APIs needed for the daily quiz system. It enables the frontend to fetch words that need review, save quiz answers with spaced repetition updates, and identify struggling vocabulary (leeches) for targeted practice.

**Impact:**

- Enables core quiz functionality (fetch questions → save answers → update progress)
- Supports leech identification for targeted review (addresses 15% of words causing 50% of failures)
- Provides clean API contract between frontend and backend teams (parallel development)

## Acceptance Criteria

- [x] `GET /api/progress/due?date=YYYY-MM-DD` endpoint returns array of words where `nextReview <= date`
- [x] Response includes word details (id, chinese, pinyin, english, nextReview, studyCount, lapseCount)
- [x] `POST /api/progress/test-result` endpoint accepts { wordId, correct, questionType, timeSpentMs }
- [x] Test result endpoint calls `ProgressService.recordQuizResult()` from Story 15.1
- [x] Response returns updated { nextReviewDate, lapseCount, isLeech } for frontend feedback
- [x] `GET /api/progress/leeches` endpoint returns words with `lapseCount >= 5`
- [x] Leech endpoint sorted by lapseCount descending (highest struggle first)
- [x] All endpoints require JWT authentication (userId extracted from token)
- [x] Input validation rejects invalid wordIds, dates, or missing required fields
- [x] API documentation updated in implementation doc with comprehensive code examples and testing patterns

## Business Rules

1. **Due Words Query:** Only return words belonging to authenticated user; filter by `nextReview <= requestedDate`; default to current date if no date parameter provided

2. **Test Result Validation:** Reject if `wordId` not found in user's studied vocabulary; reject if `questionType` not in ['multiple_choice', 'type_pinyin', 'type_character']

3. **Leech Threshold:** Words with `lapseCount >= 5` are considered leeches; threshold may be configurable in future

4. **Rate Limiting:** Test result endpoint limited to 100 requests/hour per user to prevent XP farming abuse

5. **Performance:** Due words query must return in <200ms; consider Redis caching for frequently accessed due word lists

## Related Issues

- [**Story 15.1: Progress System Adaptation**](./story-15-1-progress-system-adaptation.md) (Depends on: needs `recordQuizResult()` method and `lapseCount` column)
- [**Story 15.8: Core Quiz Backend Integration**](./story-15-8-core-quiz-integration.md) (Blocks: frontend needs these APIs)
- [**Epic 15 BR**](./README.md) (Parent epic)

## Implementation Status

- **Status**: Completed
- **Branch**: epic-15-learning-retention
- **Completed**: February 12, 2026
- **Implementation**: [Story 15.2 Implementation Doc](../../issue-implementation/epic-15-learning-retention/story-15-2-core-quiz-backend.md)
- **Test Results**: 32/32 controller tests passing, 40/40 service tests passing, 72/72 total backend tests passing

**Deliverables:**

- Phase 1: Database migration (500 VocabularyWords, 7 Categories, 1 VocabularyList)
- Phase 2: Quiz API implementation (3 endpoints: /due, /test-result, /leeches)
- 28 comprehensive tests (18 controller + 10 service)
- Documentation updates (implementation doc, testing guide, PostgreSQL KB)
