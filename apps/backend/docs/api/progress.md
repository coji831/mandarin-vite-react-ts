# Progress Tracking Endpoints

All progress endpoints require authentication via JWT Bearer token (`Authorization: Bearer <access_token>`).

## CRUD Endpoints

### GET /api/v1/progress

Get all progress records for authenticated user.

**Response (200 OK):** Array of progress records with `id`, `wordId`, `studyCount`, `correctCount`, `confidence`, `nextReview`, `createdAt`, `updatedAt`.

### GET /api/v1/progress/:wordId

Get progress for specific word.

**Errors:** `401 UNAUTHORIZED`, `404 PROGRESS_NOT_FOUND`

### PUT /api/v1/progress/:wordId

Update or create progress for specific word (upsert).

**Request Body:**

```json
{
  "studyCount": 6,
  "correctCount": 5,
  "confidence": 0.9
}
```

All fields optional. `nextReview` calculated server-side using spaced repetition.

**Validation:** `studyCount` ≥ 0, `correctCount` ≥ 0, `confidence` 0-1

**Errors:** `400 INVALID_CONFIDENCE`, `400 INVALID_STUDY_COUNT`, `401 UNAUTHORIZED`

### DELETE /api/v1/progress/:wordId

Delete progress record for specific word ("toggle mastery" feature).

**Response (204 No Content).**

### POST /api/v1/progress/batch

Batch update progress for multiple words. Atomic transaction (all succeed or all fail).

**Request Body:**

```json
{
  "updates": [
    { "wordId": "hsk1_001", "studyCount": 5, "correctCount": 3, "confidence": 0.6 },
    { "wordId": "hsk1_002", "studyCount": 2, "correctCount": 1, "confidence": 0.3 }
  ]
}
```

**Errors:** `400 EMPTY_UPDATES`, `400 INVALID_UPDATES`, `400 MISSING_WORD_ID`

### GET /api/v1/progress/stats

Get summary statistics for authenticated user.

**Response:**

```json
{
  "totalWords": 150,
  "studiedWords": 45,
  "masteredWords": 12,
  "totalStudyCount": 230,
  "averageConfidence": 0.72,
  "wordsToReviewToday": 8
}
```

- `masteredWords`: Confidence ≥ 0.8
- `wordsToReviewToday`: `nextReview` ≤ current time

---

## Learning Endpoints

### GET /api/v1/progress/due

Get vocabulary words due for review based on spaced repetition schedule.

**Query Parameters:** `date` (YYYY-MM-DD, optional, defaults to today)

**Response (200 OK):**

```json
{
  "date": "2026-02-12",
  "count": 15,
  "words": [
    {
      "id": "hsk3-band1-001",
      "simplified": "你好",
      "pinyin": "nǐ hǎo",
      "english": "hello",
      "nextReview": "2026-02-10T08:00:00.000Z",
      "studyCount": 5,
      "lapseCount": 1,
      "currentDelay": 3,
      "categories": ["Greetings", "Daily Communication"]
    }
  ]
}
```

**Business Rules:** Max 20 words, sorted by `nextReview` ascending, user-scoped only.

### POST /api/v1/progress/test-result

Save quiz answer and update progress using quiz-specific spaced repetition algorithm.

**Request Body:**

```json
{
  "wordId": "hsk3-band1-042",
  "correct": true,
  "questionType": "multiple_choice",
  "timeSpentMs": 3500
}
```

- `questionType`: `multiple_choice`, `type_pinyin`, or `type_character`
- `timeSpentMs` optional

**Response (200 OK):**

```json
{
  "nextReviewDate": "2026-03-14T08:00:00.000Z",
  "lapseCount": 0,
  "isLeech": false,
  "xpEarned": 15,
  "newBadges": [],
  "freezeAwarded": true,
  "mysteryBox": null
}
```

**Business Rules:** Correct → 30 day interval, Incorrect → 1 day interval. Rate limited to 100/hour.

### GET /api/v1/learning/leeches

Get struggling vocabulary words with high lapse counts.

**Query Parameters:** `minLapseCount` (optional, defaults to 5)

**Response (200 OK):** Max 20 words, sorted by `lapseCount` descending.

---

## Spaced Repetition Algorithm

**Unified formula** supporting both flashcard (confidence-based) and quiz (performance-based) modes:

```
newDelay = baseDelay * performanceMultiplier
finalDays = 1 + (30 - 1) * multiplier
```

**Performance Multipliers:**

| Activity Type  | Multiplier                     |
| -------------- | ------------------------------ |
| Flashcard      | `confidence²` (0.8 → ~19 days) |
| Quiz Correct   | 1.0 (fixed → 30 days max)      |
| Quiz Incorrect | 0.0 (fixed → 1 day)            |

**Feature Detection:** System auto-detects which algorithm to use based on most recent activity timestamp.

**Leech Detection:** Words with `lapseCount >= 5` flagged as leeches. Targets 15% of words causing 50% of failures (Pareto principle).

> **Full details:** See [Spaced Repetition Algorithms](../../../docs/knowledge-base/spaced-repetition-algorithms.md).
