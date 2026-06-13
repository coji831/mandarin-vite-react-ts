# AI Feedback Endpoints

AI-powered error explanations using Gemini API with Redis caching for cost optimization.

## POST /api/v1/quiz/feedback

Generate AI-powered explanation for incorrect quiz answers.

**Auth:** Required (JWT Bearer token)
**Rate Limit:** 10 requests per minute per user

**Request Body:**

```json
{
  "wordId": 1,
  "userAnswer": "mǎ",
  "correctAnswer": "mā",
  "questionType": "tone_audio"
}
```

**Valid Question Types:** `tone_audio`, `character_choice`, `pinyin_choice`, `english_choice`, `character_input`

**Response (200 OK):**

```json
{
  "explanation": "You confused mā (mother) with mǎ (horse)...",
  "errorType": "tone"
}
```

**Error Types:** `tone`, `character`, `meaning`, `generic` (fallback)

**Caching:** Cache key `quiz:feedback:{wordId}:{userAnswer}` (case-insensitive), TTL 24 hours.
