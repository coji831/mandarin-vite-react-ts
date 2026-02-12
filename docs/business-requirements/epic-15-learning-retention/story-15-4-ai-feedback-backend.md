# Story 15.4: AI Feedback Backend Service

## Description

**As a** backend developer,
**I want to** integrate Gemini API for error explanations with Redis caching,
**So that** users receive personalized feedback on incorrect answers.

## Business Value

AI-generated error explanations address the critical learning gap: "Why did I get this wrong?" Generic feedback ("Incorrect, the answer is 你好") doesn't explain confusion patterns (tone errors, character similarity, semantic mix-ups). Personalized explanations accelerate learning and reduce frustration-driven churn.

**Impact:**

- Reduces time-to-mastery by explaining root cause of confusion (tone vs. character vs. meaning errors)
- Increases quiz completion rate (users understand mistakes instead of feeling defeated)
- Caching reduces API costs by 70-80% (common errors shared across users)
- Optional feature (quiz works without AI if latency issues)

## Acceptance Criteria

- [x] `POST /api/quiz/feedback` endpoint accepts { wordId, userAnswer, correctAnswer, questionType }
- [x] Endpoint calls Gemini API with prompt: "Explain why learner confused [userAnswer] with [correctAnswer] for Chinese word [wordDetails]. Focus on tone/character/meaning differences."
- [x] Response returns { explanation, errorType: 'tone'|'character'|'meaning' } with 2-3 sentence explanation
- [x] Redis caching: key = `quiz:feedback:{wordId}:{userAnswer}`, TTL = 24 hours
- [x] Cache hit rate logged for monitoring (target: >60% hit rate after 1 week)
- [x] Fallback to generic message if Gemini API timeout (3 seconds) or error
- [x] Rate limiting: max 10 feedback requests per minute per user
- [x] Sanitize user input before sending to Gemini API (prevent prompt injection attacks)
- [x] API documentation includes Gemini prompt template and error handling flow
- [x] Environment variable `GEMINI_API_KEY` required; endpoint returns 503 if missing

## Business Rules

1. **Feedback Timing:** Generated asynchronously after user answers (non-blocking); user sees "Loading explanation..." UI while waiting; max 3-second timeout before showing fallback

2. **Caching Strategy:** Cache common error patterns (e.g., "confused 妈 mā with 马 mǎ" seen by many users); cache key includes wordId + userAnswer combination; 24-hour TTL balances freshness with cost savings

3. **Error Type Classification:** Gemini response parsed to extract errorType:
   - **Tone**: User answer differs only in tone marks (mā vs mǎ)
   - **Character**: User answer is different character (妈 vs 马)
   - **Meaning**: User answer is semantically close but wrong (hello vs hi)

4. **Prompt Engineering:** Prompt must:
   - Limit response to 2-3 sentences (concise for mobile UI)
   - Focus on learning insight (not just "you were wrong")
   - Use beginner-friendly language (avoid linguistic jargon)
   - Provide mnemonic tip when applicable

5. **Fallback Messages:** If AI unavailable, show context-aware fallback:
   - Tone error: "Remember, tone marks change meaning in Chinese."
   - Character error: "These characters look similar but have different meanings."
   - Generic: "Review this word again to reinforce your memory."

6. **Cost Control:** Monitor Gemini API usage; if daily quota exceeded, disable AI feedback and show fallback for remainder of day; alert engineering team

## Related Issues

- [**Story 15.2: Core Quiz Backend Infrastructure**](./story-15-2-core-quiz-backend.md) (Depends on: needs quiz result saving to trigger feedback)
- [**Story 15.9: Gamification & AI Integration**](./story-15-9-gamification-ai-integration.md) (Blocks: frontend needs this API)
- [**Epic 15 BR**](./README.md) (Parent epic)

## Implementation Status

- **Status**: Completed
- **Commit**: e6b08e0
- **PR**: #TBD
- **Last Update**: 2026-02-12
