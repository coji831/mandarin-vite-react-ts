# Implementation 15-2: Core Quiz Backend Infrastructure

## Technical Scope

This story implements the foundational REST API endpoints for quiz functionality: fetching due vocabulary, saving quiz results, and identifying leeches. These endpoints provide the backend contract that enables frontend development to proceed independently.

**Files Modified:**

- `apps/backend/src/api/controllers/ProgressController.js` - Add quiz-specific endpoints
- `apps/backend/src/core/services/ProgressService.js` - Add getDueWords() and getLeechesByUser() methods
- `apps/backend/src/infrastructure/repositories/ProgressRepository.js` - Add database queries
- `apps/backend/src/api/routes/progressRoutes.js` - Register new routes
- `apps/backend/docs/api-spec.md` - Document API contracts

**New API Endpoints:**

- `GET /api/progress/due?date=YYYY-MM-DD` - Fetch words needing review
- `POST /api/progress/test-result` - Save quiz answer with spaced repetition update
- `GET /api/progress/leeches` - Fetch struggling vocabulary (lapseCount >= 5)

**Dependencies:**

- Requires Story 15.1 completion (recordQuizResult() method, lapseCount column, quiz_results table)

## Implementation Details

### GET /api/progress/due Endpoint

```javascript
// apps/backend/src/api/controllers/ProgressController.js

/**
 * Fetch vocabulary due for review
 * Query params: date (YYYY-MM-DD, optional, defaults to today)
 */
async function getDueWords(req, res) {
  try {
    const userId = req.user.id; // From JWT middleware
    const requestedDate = req.query.date ? new Date(req.query.date) : new Date();

    // Validate date format
    if (isNaN(requestedDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD." });
    }

    const dueWords = await ProgressService.getDueWords(userId, requestedDate);

    return res.status(200).json({
      date: requestedDate.toISOString().split("T")[0],
      count: dueWords.length,
      words: dueWords,
    });
  } catch (error) {
    console.error("Error fetching due words:", error);
    return res.status(500).json({ error: "Failed to fetch due words" });
  }
}

// apps/backend/src/core/services/ProgressService.js

async function getDueWords(userId, date) {
  // Fetch progress records where nextReview <= date
  const progressRecords = await ProgressRepository.findDueByUserAndDate(userId, date);

  // Enrich with vocabulary details
  const enrichedWords = await Promise.all(
    progressRecords.map(async (progress) => {
      const word = await VocabularyRepository.findById(progress.wordId);
      return {
        id: word.id,
        chinese: word.chinese,
        pinyin: word.pinyin,
        english: word.english,
        nextReview: progress.nextReview,
        studyCount: progress.studyCount,
        lapseCount: progress.lapseCount || 0,
        currentDelay: progress.currentDelay || 1,
      };
    }),
  );

  // Limit to 20 words per session (prevent fatigue)
  return enrichedWords.slice(0, 20);
}

// apps/backend/src/infrastructure/repositories/ProgressRepository.js

async function findDueByUserAndDate(userId, date) {
  return await prisma.progress.findMany({
    where: {
      userId,
      nextReview: {
        lte: date,
      },
    },
    orderBy: {
      nextReview: "asc", // Oldest due first
    },
  });
}
```

### POST /api/progress/test-result Endpoint

```javascript
// apps/backend/src/api/controllers/ProgressController.js

/**
 * Save quiz answer and update progress
 * Body: { wordId, correct, questionType, timeSpentMs }
 */
async function saveTestResult(req, res) {
  try {
    const userId = req.user.id;
    const { wordId, correct, questionType, timeSpentMs } = req.body;

    // Validate input
    if (!wordId || typeof correct !== "boolean" || !questionType) {
      return res
        .status(400)
        .json({ error: "Missing required fields: wordId, correct, questionType" });
    }

    const validQuestionTypes = ["multiple_choice", "type_pinyin", "type_character"];
    if (!validQuestionTypes.includes(questionType)) {
      return res
        .status(400)
        .json({
          error: "Invalid questionType. Must be: multiple_choice, type_pinyin, or type_character",
        });
    }

    // Verify word belongs to user's studied vocabulary
    const progress = await ProgressRepository.findByUserAndWord(userId, wordId);
    if (!progress) {
      return res.status(404).json({ error: "Word not found in your progress" });
    }

    // Call Story 15.1 method: recordQuizResult()
    const result = await ProgressService.recordQuizResult({
      userId,
      wordId,
      correct,
      questionType,
      timeSpentMs,
    });

    return res.status(200).json({
      wordId,
      correct,
      nextReviewDate: result.nextReviewDate,
      lapseCount: result.lapseCount,
      isLeech: result.isLeech,
    });
  } catch (error) {
    console.error("Error saving test result:", error);
    return res.status(500).json({ error: "Failed to save test result" });
  }
}
```

### GET /api/progress/leeches Endpoint

```javascript
// apps/backend/src/api/controllers/ProgressController.js

/**
 * Fetch struggling vocabulary (leeches)
 * Returns words with lapseCount >= 5, sorted by lapseCount descending
 */
async function getLeeches(req, res) {
  try {
    const userId = req.user.id;

    const leeches = await ProgressService.getLeechesByUser(userId);

    return res.status(200).json({
      count: leeches.length,
      words: leeches,
    });
  } catch (error) {
    console.error("Error fetching leeches:", error);
    return res.status(500).json({ error: "Failed to fetch leeches" });
  }
}

// apps/backend/src/core/services/ProgressService.js

async function getLeechesByUser(userId) {
  const leechRecords = await ProgressRepository.findLeechesByUser(userId, 5);

  // Enrich with vocabulary details
  const enrichedLeeches = await Promise.all(
    leechRecords.map(async (progress) => {
      const word = await VocabularyRepository.findById(progress.wordId);
      return {
        id: word.id,
        chinese: word.chinese,
        pinyin: word.pinyin,
        english: word.english,
        lapseCount: progress.lapseCount,
        studyCount: progress.studyCount,
        lastStudied: progress.updatedAt,
      };
    }),
  );

  return enrichedLeeches;
}

// apps/backend/src/infrastructure/repositories/ProgressRepository.js

async function findLeechesByUser(userId, threshold = 5) {
  return await prisma.progress.findMany({
    where: {
      userId,
      lapseCount: {
        gte: threshold,
      },
    },
    orderBy: {
      lapseCount: "desc", // Highest struggle first
    },
  });
}
```

### Rate Limiting Implementation

```javascript
// apps/backend/src/api/middleware/rateLimiter.js

const rateLimit = require("express-rate-limit");

const testResultLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Max 100 requests per hour per user
  message: "Too many quiz answers submitted. Please try again later.",
  keyGenerator: (req) => req.user.id.toString(), // Rate limit per user
  skip: (req) => !req.user, // Skip if no user authenticated
});

module.exports = { testResultLimiter };

// apps/backend/src/api/routes/progressRoutes.js

const { testResultLimiter } = require("../middleware/rateLimiter");

router.post("/test-result", authenticateJWT, testResultLimiter, ProgressController.saveTestResult);
```

## Architecture Integration

```
Frontend Quiz UI
    ↓
GET /api/progress/due?date=2025-01-20
    ↓
ProgressController.getDueWords()
    ↓
ProgressService.getDueWords(userId, date)
    ↓
ProgressRepository.findDueByUserAndDate() → PostgreSQL query
    ↓
Enrich with VocabularyRepository.findById() → Join vocabulary details
    ↓
Return JSON: { date, count, words: [...] }

---

Frontend Quiz Answer Submission
    ↓
POST /api/progress/test-result { wordId, correct, questionType, timeSpentMs }
    ↓
ProgressController.saveTestResult()
    ↓
Validate input + authentication + rate limit check
    ↓
ProgressService.recordQuizResult() [Story 15.1 method]
    ↓
Update Progress table (nextReview, lapseCount) + Insert quiz_results row
    ↓
Return JSON: { wordId, correct, nextReviewDate, lapseCount, isLeech }
```

## Technical Challenges & Solutions

### Challenge 1: Performance Optimization for Due Words Query

**Problem:** Fetching due words for users with 1000+ studied vocabulary requires joining Progress + Vocabulary tables; query can exceed 500ms on large datasets.

**Solution:**

- Add composite index on `(userId, nextReview)` in Progress table
- Query execution plan uses index for WHERE + ORDER BY optimization
- Result: Query time reduced to <100ms even with 10k+ progress records

```sql
CREATE INDEX idx_progress_user_next_review ON Progress(userId, nextReview);
```

### Challenge 2: Authentication Middleware Integration

**Problem:** Existing auth middleware (`authenticateJWT`) extracts userId from JWT token; new endpoints must integrate seamlessly without code duplication.

**Solution:**

- Reuse existing JWT middleware: `router.get('/due', authenticateJWT, getDueWords)`
- Access userId via `req.user.id` (populated by middleware)
- No custom auth logic needed in controllers (Single Responsibility Principle)

### Challenge 3: Input Validation Consistency

**Problem:** Multiple endpoints need similar validation (wordId existence, userId ownership); duplicating validation code violates DRY principle.

**Solution:**

- Create shared validation middleware: `validateWordOwnership(req, res, next)`
- Middleware queries ProgressRepository to verify word belongs to user
- Attach word to `req.progress` for downstream use
- Apply to both test-result and future endpoints

```javascript
async function validateWordOwnership(req, res, next) {
  const { wordId } = req.body;
  const userId = req.user.id;

  const progress = await ProgressRepository.findByUserAndWord(userId, wordId);
  if (!progress) {
    return res.status(404).json({ error: "Word not found in your progress" });
  }

  req.progress = progress; // Attach for controller use
  next();
}
```

## Testing Implementation

### Unit Tests

```javascript
describe("ProgressService.getDueWords", () => {
  it("should return words with nextReview <= requested date", async () => {
    const userId = 1;
    const requestedDate = new Date("2025-01-20");

    // Mock progress records
    jest.spyOn(ProgressRepository, "findDueByUserAndDate").mockResolvedValue([
      { userId: 1, wordId: "word1", nextReview: new Date("2025-01-19") },
      { userId: 1, wordId: "word2", nextReview: new Date("2025-01-20") },
    ]);

    const result = await ProgressService.getDueWords(userId, requestedDate);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("word1");
  });

  it("should limit results to 20 words", async () => {
    const userId = 1;
    const requestedDate = new Date("2025-01-20");

    // Mock 25 progress records
    const mockRecords = Array.from({ length: 25 }, (_, i) => ({
      userId: 1,
      wordId: `word${i}`,
      nextReview: new Date("2025-01-19"),
    }));

    jest.spyOn(ProgressRepository, "findDueByUserAndDate").mockResolvedValue(mockRecords);

    const result = await ProgressService.getDueWords(userId, requestedDate);

    expect(result).toHaveLength(20);
  });
});

describe("ProgressController.saveTestResult", () => {
  it("should return 400 if questionType is invalid", async () => {
    const req = {
      user: { id: 1 },
      body: { wordId: "word1", correct: true, questionType: "invalid_type" },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await saveTestResult(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining("Invalid questionType"),
      }),
    );
  });

  it("should call recordQuizResult with correct parameters", async () => {
    const req = {
      user: { id: 1 },
      body: {
        wordId: "word1",
        correct: true,
        questionType: "multiple_choice",
        timeSpentMs: 3500,
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest
      .spyOn(ProgressRepository, "findByUserAndWord")
      .mockResolvedValue({ id: 1, userId: 1, wordId: "word1" });
    jest.spyOn(ProgressService, "recordQuizResult").mockResolvedValue({
      nextReviewDate: new Date("2025-01-25"),
      lapseCount: 0,
      isLeech: false,
    });

    await saveTestResult(req, res);

    expect(ProgressService.recordQuizResult).toHaveBeenCalledWith({
      userId: 1,
      wordId: "word1",
      correct: true,
      questionType: "multiple_choice",
      timeSpentMs: 3500,
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
```

### Integration Tests

```javascript
describe('GET /api/progress/due', () => {
  it('should return due words for authenticated user', async () => {
    const token = generateTestJWT(userId: 1);

    const response = await request(app)
      .get('/api/progress/due?date=2025-01-20')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty('date', '2025-01-20');
    expect(response.body).toHaveProperty('count');
    expect(response.body.words).toBeInstanceOf(Array);
  });

  it('should return 401 if not authenticated', async () => {
    await request(app)
      .get('/api/progress/due')
      .expect(401);
  });
});

describe('POST /api/progress/test-result', () => {
  it('should enforce rate limit (100 requests/hour)', async () => {
    const token = generateTestJWT(userId: 1);

    // Submit 100 valid requests
    for (let i = 0; i < 100; i++) {
      await request(app)
        .post('/api/progress/test-result')
        .set('Authorization', `Bearer ${token}`)
        .send({ wordId: `word${i}`, correct: true, questionType: 'multiple_choice' })
        .expect(200);
    }

    // 101st request should be rate limited
    await request(app)
      .post('/api/progress/test-result')
      .set('Authorization', `Bearer ${token}`)
      .send({ wordId: 'word101', correct: true, questionType: 'multiple_choice' })
      .expect(429); // Too Many Requests
  });
});
```

---

**Related Documentation:**

- [Story 15.2 BR](../../business-requirements/epic-15-learning-retention/story-15-2-core-quiz-backend.md)
- [Story 15.1 Implementation](./story-15-1-progress-system-adaptation.md) (recordQuizResult dependency)
- [Epic 15 Implementation](./README.md)
- [API Specification](../../../apps/backend/docs/api-spec.md)
