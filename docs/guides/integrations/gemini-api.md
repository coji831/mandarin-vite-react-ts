# Google Gemini API Integration Guide

**Last Updated:** June 3, 2026

**Purpose:** Step-by-step guide for integrating Google Gemini API for natural language generation, text analysis, and AI-powered features in your application

**Target Audience:** Backend developers integrating Gemini API for content generation, analysis, or intelligent features

---

## Overview

Google Gemini API provides powerful language models for natural language generation and understanding. Common use cases include:

- **Content Generation**: Generate explanations, summaries, responses dynamically
- **Text Analysis**: Analyze user input, classify content, extract information
- **Intelligent Assistants**: Build chatbots, Q&A systems, tutoring features
- **Error Analysis**: Explain mistakes or provide personalized feedback

### Key Features

- **Multiple Model Options**: Gemini 1.5 Flash (fast, cost-effective) or Pro (more capable)
- **Streaming Support**: Real-time response streaming for better UX
- **Caching**: Reduce costs by caching frequently requested content
- **Rate Limiting**: Control usage and prevent abuse
- **Timeout Handling**: Graceful degradation if API calls fail
- **Cost Effective**: Flash model: ~$0.00002 per request

### Basic Architecture

```
Application Request
     ↓
Check Cache (optional)
     ├─ Cache Hit → Return cached response
     └─ Cache Miss → Call Gemini API
                     ↓
                     Generate content/analysis
                     ↓
                     Cache result with TTL
                     ↓
                     Return to application
```

---

## When to Use Gemini API

**Use Gemini integration when you need:**

- Dynamic content generation (explanations, summaries, responses)
- Natural language understanding (classification, analysis, extraction)
- Personalized user feedback or recommendations
- AI-powered conversational features
- Have budget for API costs ($0.00001-0.001 per request depending on model)

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

## Step 3: Implement AI Service (Generic Pattern)

Create a reusable service for Gemini API calls with error handling and timeouts.

**Key Pattern:**

- Build prompt based on your use case
- Use timeouts to prevent hanging requests
- Graceful fallback if API fails
- Cache results to reduce costs (optional)

**Example Implementation:**

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const REQUEST_TIMEOUT = 3000; // 3 seconds

export class GeminiAIService {
  async generate(prompt: string): Promise<string> {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Timeout")), REQUEST_TIMEOUT);
      });

      const apiCall = model.generateContent(prompt);
      const result = await Promise.race([apiCall, timeoutPromise]);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini API error:", error);
      throw error; // Let caller handle error
    }
  }
}
```

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

- [Story 15.4 BR](../../business-requirements/epic-15-learning-retention/story-15-4-ai-feedback-backend.md) - AI Feedback Backend requirements
- [Redis Caching Guide](../setup/redis.md) - General Redis best practices
- [Gamification Psychology](../../knowledge-base/learning-theory/gamification-psychology-learning.md) - Why feedback matters for retention
- [Backend API Spec](../../../apps/backend/docs/api-spec.md) - Full API documentation

---

**Last Updated:** June 3, 2026
