# Gemini API Integration Guide

**Purpose**: Step-by-step guide for integrating Google Gemini API to generate AI-powered error explanations for incorrect quiz answers.

**Related Stories**: [Story 15.4](../business-requirements/epic-15-learning-retention/story-15-4-ai-feedback-backend.md)

**Target Audience**: Backend developers implementing AI feedback service

---

## Overview

The AI Feedback Service uses Google Gemini API to generate contextual explanations when users answer quiz questions incorrectly. Features include:

- **Smart Error Explanations**: Analyze user mistakes and explain why the correct answer is right
- **Tone-Sensitive Feedback**: Explain Mandarin tone errors (e.g., "mā vs mǎ")
- **Redis Caching**: 24-hour TTL to reduce API costs (same mistake → cached explanation)
- **Rate Limiting**: 10 requests/minute per user to prevent abuse
- **Timeout Handling**: 3-second timeout with fallback to generic message
- **Graceful Degradation**: Quiz continues even if AI service fails

**Cost Optimization**: With caching, estimated cost is $2-5/month for 100 daily active users (Gemini Flash tier: $0.00002/request).

---

## When to Use This Pattern

✅ **Use Gemini API integration when:**

- Building educational apps with contextual error explanations
- Need natural language generation for dynamic content
- Want to reduce content creation burden (AI generates explanations vs manual authoring)
- Have budget for AI API costs ($2-10/month for small apps)

❌ **Do NOT use this pattern when:**

- Explanations can be prewritten (simpler and free)
- App targets markets with strict data privacy laws (GDPR, CCPA concerns for API calls)
- Cannot tolerate occasional API outages (mission-critical features)
- Budget constraints prohibit any recurring costs

---

## Step 1: API Key Setup

### Option A: Development (Local Backend)

1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create `.env` file in `apps/backend/`:

```env
GEMINI_API_KEY=your_api_key_here
```

3. Add to `.gitignore` (prevent accidental commit):

```gitignore
# apps/backend/.gitignore
.env
.env.local
```

### Option B: Production (Railway Deployment)

1. Navigate to Railway project → Variables
2. Add environment variable:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: `your_api_key_here`
3. Redeploy backend (automatic if Railway connected to GitHub)

**Security Best Practice**: Never hardcode API keys in source code; always use environment variables.

---

## Step 2: Install Gemini SDK

```bash
# Navigate to backend directory
cd apps/backend

# Install Google Generative AI SDK
npm install @google/generative-ai
```

**Why this SDK?** Official Google library with built-in retry logic, streaming support, and TypeScript types.

---

## Step 3: Implement AI Feedback Service

```typescript
// apps/backend/src/services/AIFeedbackService.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { RedisCacheService } from "./RedisCacheService";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const CACHE_PREFIX = "ai_feedback:";
const CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds
const REQUEST_TIMEOUT = 3000; // 3 seconds
const FALLBACK_MESSAGE = "Try reviewing the correct answer and practice again.";

export interface FeedbackRequest {
  wordId: string;
  questionType: "multiple_choice" | "type_pinyin" | "type_character";
  userAnswer: string;
  correctAnswer: string;
  wordData: {
    chinese: string;
    pinyin: string;
    english: string;
  };
}

export class AIFeedbackService {
  private redisCache: RedisCacheService;

  constructor(redisCache: RedisCacheService) {
    this.redisCache = redisCache;
  }

  /**
   * Generate AI explanation for incorrect answer
   * Returns cached explanation if available, otherwise calls Gemini API
   */
  async generateExplanation(request: FeedbackRequest): Promise<string> {
    // Check cache first
    const cacheKey = this.buildCacheKey(request);
    const cached = await this.redisCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Generate new explanation via Gemini API
      const explanation = await this.callGeminiAPI(request);

      // Cache for 24 hours
      await this.redisCache.set(cacheKey, explanation, CACHE_TTL);

      return explanation;
    } catch (error) {
      console.error("AI feedback generation failed:", error);
      return FALLBACK_MESSAGE; // Graceful degradation
    }
  }

  /**
   * Call Gemini API with timeout
   */
  private async callGeminiAPI(request: FeedbackRequest): Promise<string> {
    const prompt = this.buildPrompt(request);

    // Timeout wrapper
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Gemini API timeout")), REQUEST_TIMEOUT);
    });

    const apiCallPromise = model.generateContent(prompt);

    try {
      const result = await Promise.race([apiCallPromise, timeoutPromise]);
      const response = await result.response;
      return response.text();
    } catch (error) {
      throw new Error("Gemini API error: " + error.message);
    }
  }

  /**
   * Build prompt optimized for Mandarin learning context
   */
  private buildPrompt(request: FeedbackRequest): string {
    const { wordData, questionType, userAnswer, correctAnswer } = request;

    // Question type-specific context
    let questionContext = "";
    switch (questionType) {
      case "multiple_choice":
        questionContext = `The user chose "${userAnswer}" but the correct meaning is "${correctAnswer}".`;
        break;
      case "type_pinyin":
        questionContext = `The user typed "${userAnswer}" but the correct pinyin is "${correctAnswer}".`;
        break;
      case "type_character":
        questionContext = `The user typed "${userAnswer}" but the correct character is "${correctAnswer}".`;
        break;
    }

    return `
You are a Mandarin Chinese tutor helping a student understand their mistake.

Word: ${wordData.chinese} (${wordData.pinyin}) meaning "${wordData.english}"

${questionContext}

Provide a brief, encouraging explanation (2-3 sentences) that:
1. Explains why the correct answer is right
2. If tone error (e.g., mā vs mǎ), explain the tone difference and meaning change
3. Offer a memory tip or mnemonic if relevant
4. Keep tone friendly and encouraging

Do NOT:
- Be condescending or overly formal
- Provide lengthy grammar lessons
- Use Chinese characters the student hasn't learned yet
`.trim();
  }

  /**
   * Build cache key from request
   */
  private buildCacheKey(request: FeedbackRequest): string {
    // Cache key unique to mistake type (not user-specific)
    const { wordId, questionType, userAnswer } = request;
    return `${CACHE_PREFIX}${wordId}:${questionType}:${userAnswer}`;
  }
}
```

**Key Design Decisions:**

- **Cache Key Strategy**: Key includes `wordId`, `questionType`, and `userAnswer` (not user ID). This means if 100 users make the same mistake, only 1 API call is needed.
- **Timeout**: 3 seconds balances user experience (no long waits) vs API reliability (Gemini usually responds in 1-2 seconds).
- **Fallback Message**: Generic message ensures quiz never breaks due to AI failure.

---

## Step 4: Implement Redis Caching Layer

```typescript
// apps/backend/src/services/RedisCacheService.ts

import { createClient, RedisClientType } from "redis";

export class RedisCacheService {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
    });

    this.client.on("error", (err) => {
      console.error("Redis Client Error:", err);
    });

    // Connect asynchronously
    this.client.connect().catch(console.error);
  }

  /**
   * Get value from cache
   * Returns null if key doesn't exist or Redis unavailable
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error("Redis GET error:", error);
      return null; // Graceful degradation (cache miss)
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    try {
      await this.client.setEx(key, ttlSeconds, value);
    } catch (error) {
      console.error("Redis SET error:", error);
      // Silent fail (explanation generated but not cached)
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error("Redis DELETE error:", error);
    }
  }

  /**
   * Close Redis connection (call on server shutdown)
   */
  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}
```

**Redis Setup (Local Development):**

```bash
# Option 1: Install Redis locally via Homebrew (macOS)
brew install redis
brew services start redis

# Option 2: Run Redis in Docker
docker run -d -p 6379:6379 redis:alpine
```

**Redis Setup (Production - Railway):**

1. Add Redis plugin in Railway project dashboard
2. Railway auto-configures `REDIS_URL` environment variable
3. No manual configuration needed

---

## Step 5: Add Rate Limiting Middleware

Prevent abuse by limiting requests to 10/minute per user.

```typescript
// apps/backend/src/middleware/rateLimiter.ts

import rateLimit from "express-rate-limit";

export const aiFeedbackRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: { error: "Too many AI explanation requests. Try again in 1 minute." },
  standardHeaders: true, // Include `RateLimit-*` headers
  legacyHeaders: false,
  // Use user ID from JWT token as identifier
  keyGenerator: (req) => {
    return req.user?.id || req.ip; // Fallback to IP if not authenticated
  },
});
```

**Apply to AI Feedback Route:**

```typescript
// apps/backend/src/routes/aiRoutes.ts

import express from "express";
import { aiFeedbackRateLimiter } from "../middleware/rateLimiter";
import { AIFeedbackService } from "../services/AIFeedbackService";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();
const redisCache = new RedisCacheService();
const aiFeedbackService = new AIFeedbackService(redisCache);

router.post(
  "/feedback",
  authenticateToken, // Require login
  aiFeedbackRateLimiter, // Apply rate limit
  async (req, res) => {
    try {
      const { wordId, questionType, userAnswer, correctAnswer, wordData } = req.body;

      // Validate request
      if (!wordId || !questionType || !userAnswer || !correctAnswer || !wordData) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Generate explanation
      const explanation = await aiFeedbackService.generateExplanation({
        wordId,
        questionType,
        userAnswer,
        correctAnswer,
        wordData,
      });

      res.json({ explanation });
    } catch (error) {
      console.error("AI feedback endpoint error:", error);
      res.status(500).json({ error: "Failed to generate explanation" });
    }
  },
);

export default router;
```

---

## Step 6: Frontend Integration Example

```typescript
// apps/frontend/src/services/AIFeedbackService.ts

import { apiClient } from '../utils/apiClient';

export interface AIFeedbackRequest {
  wordId: string;
  questionType: 'multiple_choice' | 'type_pinyin' | 'type_character';
  userAnswer: string;
  correctAnswer: string;
  wordData: {
    chinese: string;
    pinyin: string;
    english: string;
  };
}

export async function fetchAIExplanation(request: AIFeedbackRequest): Promise<string> {
  try {
    const response = await apiClient.post('/api/ai/feedback', request, {
      timeout: 4000 // 4 seconds (1 second buffer beyond backend timeout)
    });

    return response.data.explanation;
  } catch (error) {
    if (error.response?.status === 429) {
      return 'You've requested too many explanations. Try again in a minute.';
    }

    console.error('Failed to fetch AI explanation:', error);
    return 'Unable to load explanation. Review the correct answer and try again.';
  }
}
```

**Usage in Quiz Component:**

```typescript
// When user answers incorrectly
const handleIncorrectAnswer = async (userAnswer: string) => {
  const currentQuestion = state.questions[state.currentIndex];

  // Show loading spinner
  setLoadingExplanation(true);

  // Fetch AI explanation asynchronously (non-blocking)
  const explanation = await fetchAIExplanation({
    wordId: currentQuestion.wordId,
    questionType: currentQuestion.mode,
    userAnswer,
    correctAnswer: currentQuestion.pinyin, // or english, depending on mode
    wordData: {
      chinese: currentQuestion.word,
      pinyin: currentQuestion.pinyin,
      english: currentQuestion.english,
    },
  });

  setLoadingExplanation(false);
  setExplanation(explanation);
};
```

---

## Common Issues and Solutions

### Problem: Gemini API returns 429 Too Many Requests error

**Cause**: Hit Gemini API rate limit (free tier: 60 requests/minute)

**Solution**: Increase Redis cache TTL to 7 days (reduce repeat API calls), or upgrade to paid Gemini tier

### Problem: Redis connection fails in production

**Cause**: Railway Redis URL format mismatch (some plugins use `redis://` vs `rediss://` for TLS)

**Solution**: Check Railway environment variables; update `REDIS_URL` to include correct protocol and TLS settings

### Problem: Explanations are too verbose or generic

**Cause**: Prompt engineering needs tuning

**Solution**: Refine prompt with examples and constraints (e.g., "Keep under 50 words", "Provide 1 concrete example")

### Problem: Timeout errors during high traffic

**Cause**: Gemini API slow response times (occasionally 5-10 seconds)

**Solution**: Increase backend timeout to 5 seconds, cache more aggressively, or show cached explanation first and update asynchronously

---

## Cost Estimation

**Assumptions**:

- 100 daily active users
- Each user takes daily quiz (10 questions)
- 30% incorrect answer rate (3 mistakes/user/day)
- 50% cache hit rate (half of requests served from cache)

**Calculation**:

```
Daily API calls = 100 users × 3 mistakes × 50% cache miss = 150 requests/day
Monthly API calls = 150 × 30 = 4,500 requests/month
Cost = 4,500 × $0.00002 = $0.09/month (Gemini Flash tier)
```

**With Redis caching**: $0 (cache hits) + $0.09 (cache misses) + $5 (Railway Redis plugin) = ~$5/month total

---

## Testing Checklist

- [ ] API key loads from environment variable (not hardcoded)
- [ ] Gemini API returns explanation within 3 seconds
- [ ] Explanation cached in Redis with 24-hour TTL
- [ ] Cache key format correct (`ai_feedback:{wordId}:{type}:{answer}`)
- [ ] Rate limiter blocks after 10 requests/minute
- [ ] Timeout fallback returns generic message (no error thrown)
- [ ] Frontend shows loading spinner while fetching explanation
- [ ] Quiz continues even if AI service fails (graceful degradation)
- [ ] Explanation quality tested for tone errors (mā vs mǎ)
- [ ] Cost estimation validated with production traffic logs

---

## Related Documentation

- [Story 15.4 BR](../business-requirements/epic-15-learning-retention/story-15-4-ai-feedback-backend.md) - AI Feedback Backend requirements
- [Redis Caching Guide](./redis-caching-guide.md) - General Redis best practices
- [Gamification Psychology](../knowledge-base/gamification-psychology-learning.md) - Why feedback matters for retention
- [Backend API Spec](../api/api-spec.md) - Full API documentation

---

**Last Updated**: January 20, 2025
