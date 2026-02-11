# Implementation 15-4: AI Feedback Backend Service

## Technical Scope

Integrates Gemini API to generate personalized error explanations for incorrect quiz answers with Redis caching for cost optimization.

**Files Modified:**

- `apps/backend/src/core/services/AIFeedbackService.js` - New service for Gemini API integration
- `apps/backend/src/api/controllers/QuizController.js` - New controller for feedback endpoint
- `apps/backend/src/infrastructure/cache/RedisClient.js` - Redis caching layer
- `.env` - Add GEMINI_API_KEY

**New API Endpoint:**

- `POST /api/quiz/feedback` - Generate AI explanation for error

**Dependencies:**

- Requires Story 15.2 (quiz answer context)
- Requires Gemini API key and Redis (Upstash) connection

## Implementation Details

### Gemini API Integration

```javascript
// apps/backend/src/core/services/AIFeedbackService.js

const { GoogleGenerativeAI } = require("@google/generative-ai");
const RedisClient = require("../../infrastructure/cache/RedisClient");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateFeedback({ wordId, userAnswer, correctAnswer, wordDetails, questionType }) {
  // Check cache first
  const cacheKey = `quiz:feedback:${wordId}:${userAnswer}`;
  const cached = await RedisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Construct prompt
  const prompt = `
You are a Mandarin Chinese tutor. A student confused "${userAnswer}" with the correct answer "${correctAnswer}" 
for the word: ${wordDetails.chinese} (${wordDetails.pinyin}) meaning "${wordDetails.english}".

Explain why this confusion happened in 2-3 sentences. Focus on:
- Tone differences (if tones differ)
- Character similarities (if characters look similar)
- Semantic confusion (if meanings are related)

Provide a helpful learning tip. Use simple language suitable for beginners.
  `.trim();

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const explanation = response.text();

    // Classify error type
    const errorType = classifyError(userAnswer, correctAnswer, wordDetails);

    const feedback = {
      explanation,
      errorType,
    };

    // Cache for 24 hours
    await RedisClient.setex(cacheKey, 86400, JSON.stringify(feedback));

    return feedback;
  } catch (error) {
    console.error("Gemini API error:", error);
    return getFallbackFeedback(errorType);
  }
}

function classifyError(userAnswer, correctAnswer, wordDetails) {
  // Tone error detection (same pinyin, different tone)
  const userTone = extractTone(userAnswer);
  const correctTone = extractTone(correctAnswer);
  if (removeTone(userAnswer) === removeTone(correctAnswer) && userTone !== correctTone) {
    return "tone";
  }

  // Character error (visual similarity)
  if (wordDetails.chinese !== userAnswer && isSimilarCharacter(wordDetails.chinese, userAnswer)) {
    return "character";
  }

  return "meaning"; // Semantic confusion
}

function getFallbackFeedback(errorType) {
  const fallbacks = {
    tone: {
      explanation:
        "Remember, tone marks change meaning in Chinese. Practice distinguishing the four tones.",
      errorType: "tone",
    },
    character: {
      explanation:
        "These characters look similar but have different meanings. Notice the small differences.",
      errorType: "character",
    },
    meaning: {
      explanation: "Review this word again to reinforce your memory. Consider creating a mnemonic.",
      errorType: "meaning",
    },
  };
  return fallbacks[errorType] || fallbacks.meaning;
}
```

### API Endpoint with Rate Limiting

```javascript
// apps/backend/src/api/controllers/QuizController.js

const rateLimit = require("express-rate-limit");

const feedbackLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: "Too many feedback requests. Please try again later.",
});

async function generateFeedback(req, res) {
  try {
    const userId = req.user.id;
    const { wordId, userAnswer, correctAnswer, questionType } = req.body;

    // Validate input
    if (!wordId || !userAnswer || !correctAnswer) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Sanitize input (prevent prompt injection)
    const sanitized = {
      wordId: wordId.trim(),
      userAnswer: sanitize(userAnswer),
      correctAnswer: sanitize(correctAnswer),
      questionType: questionType,
    };

    // Fetch word details
    const word = await VocabularyRepository.findById(wordId);
    if (!word) {
      return res.status(404).json({ error: "Word not found" });
    }

    // Set 3-second timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 3000),
    );

    const feedbackPromise = AIFeedbackService.generateFeedback({
      ...sanitized,
      wordDetails: word,
    });

    const feedback = await Promise.race([feedbackPromise, timeoutPromise]);

    return res.status(200).json(feedback);
  } catch (error) {
    console.error("Feedback generation error:", error);

    // Return fallback on timeout or error
    const fallback = AIFeedbackService.getFallbackFeedback("meaning");
    return res.status(200).json(fallback); // Still return 200 with fallback
  }
}

function sanitize(input) {
  // Remove potential prompt injection patterns
  return input.replace(/[<>{}[\]]/g, "").slice(0, 100); // Max 100 chars
}

// Route registration
router.post("/feedback", authenticateJWT, feedbackLimiter, generateFeedback);
```

## Architecture Integration

```
Frontend: User answers incorrectly
    ↓
POST /api/quiz/feedback { wordId, userAnswer, correctAnswer, questionType }
    ↓
Rate limiter: max 10/min per user
    ↓
AIFeedbackService.generateFeedback()
    ↓
Check Redis cache (key: quiz:feedback:{wordId}:{userAnswer})
    ↓
Cache miss → Call Gemini API (3s timeout)
    ↓
Classify error type (tone/character/meaning)
    ↓
Cache result (TTL: 24h)
    ↓
Return { explanation, errorType }
```

## Technical Challenges & Solutions

### Challenge: API Cost Control

**Problem:** Gemini API charges per request; uncached requests could cost $X per 1000 users.

**Solution:** Redis caching with 24h TTL; common errors (e.g., "mā vs mǎ") cached once and reused across all users; target >60% cache hit rate after 1 week.

---

**Related Documentation:**

- [Story 15.4 BR](../../business-requirements/epic-15-learning-retention/story-15-4-ai-feedback-backend.md)
- [Epic 15 Implementation](./README.md)
