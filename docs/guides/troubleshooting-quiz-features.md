# Troubleshooting Quiz Features

**Purpose**: Comprehensive troubleshooting guide for common issues encountered during Epic 15 (Learning Retention) quiz feature implementation and usage.

**Related Stories**: All Epic 15 stories ([Epic 15 README](../business-requirements/epic-15-learning-retention/README.md))

**Target Audience**: Developers debugging quiz features, QA engineers, support staff

---

## Table of Contents

1. [Quiz State Management Issues](#quiz-state-management-issues)
2. [AI Feedback Problems](#ai-feedback-problems)
3. [Tone Input Validation Errors](#tone-input-validation-errors)
4. [Redis Caching Issues](#redis-caching-issues)
5. [Performance Degradation](#performance-degradation)
6. [Backend Integration Failures](#backend-integration-failures)
7. [LocalStorage Persistence Bugs](#localstorage-persistence-bugs)
8. [Spaced Repetition Algorithm Errors](#spaced-repetition-algorithm-errors)

---

## Quiz State Management Issues

### Problem: Quiz state resets unexpectedly mid-session

**Symptoms**:

- User answers 5 questions → Refreshes page → Quiz starts over from question 1
- Quiz state resets when navigating away and back

**Possible Causes**:

1. localStorage not persisting correctly
2. Parent component re-renders causing `useReducer` reinit
3. State restoration logic not called on mount

**Diagnostic Steps**:

```typescript
// Check if state is being saved to localStorage
useEffect(() => {
  console.log('💾 Saving quiz state:', state);
  saveQuizSession({
    questions: state.questions,
    currentIndex: state.currentIndex,
    answers: state.answers
  });
}, [state]);

// Check if state is restored on mount
useEffect(() => {
  const saved = loadQuizSession();
  console.log('🔄 Restored quiz state:', saved);
  if (saved) {
    dispatch({ type: 'RESTORE_SESSION', session: saved });
  }
}, []);
```

**Solutions**:

✅ **Solution 1**: Ensure `saveQuizSession()` called after every state update

```typescript
useEffect(() => {
  if (state.phase !== 'LOADING' && state.questions.length > 0) {
    saveQuizSession({
      questions: state.questions,
      currentIndex: state.currentIndex,
      answers: state.answers
    });
  }
}, [state]);
```

✅ **Solution 2**: Wrap quiz component in `React.memo()` to prevent unnecessary re-renders

```typescript
export const DailyReviewTest = React.memo(() => {
  // ... quiz logic
});
```

✅ **Solution 3**: Use session ID to prevent cross-tab conflicts

```typescript
const SESSION_KEY = `quiz_session_${Date.now()}`; // Unique per session
localStorage.setItem(SESSION_KEY, JSON.stringify(state));
```

---

### Problem: Quiz stuck in "LOADING" phase forever

**Symptoms**:

- Spinner shows indefinitely
- No due words fetched
- No error message displayed

**Possible Causes**:

1. Backend API timeout (no response received)
2. Due words query returns empty array (handled as error?)
3. Error thrown in async code without catch

**Diagnostic Steps**:

```typescript
// Add timeout wrapper
const fetchWithTimeout = async (url: string, timeout = 5000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// In quiz initialization
useEffect(() => {
  const initQuiz = async () => {
    try {
      const dueWords = await fetchWithTimeout('/api/quiz/due-words', 5000);
      console.log('✅ Due words fetched:', dueWords);
      
      if (dueWords.length === 0) {
        dispatch({ type: 'ERROR', message: 'No words due for review today' });
        return;
      }
      
      const questions = createInterleavedQuestions(dueWords);
      dispatch({ type: 'INITIALIZE_QUIZ', questions });
    } catch (error) {
      console.error('❌ Quiz init failed:', error);
      dispatch({ type: 'ERROR', message: 'Failed to load quiz. Please try again.' });
    }
  };

  initQuiz();
}, []);
```

**Solutions**:

✅ **Solution 1**: Add timeout to API calls (5 seconds)

✅ **Solution 2**: Handle empty due words explicitly

```typescript
if (dueWords.length === 0) {
  return (
    <div className="no-due-words">
      <h2>🎉 All caught up!</h2>
      <p>No words due for review today. Great job!</p>
    </div>
  );
}
```

✅ **Solution 3**: Add retry button in error state

```typescript
{state.error && (
  <div className="error-state">
    <p>{state.error}</p>
    <button onClick={retryInit}>Retry</button>
  </div>
)}
```

---

### Problem: Duplicate answers submitted (same answer saved twice)

**Symptoms**:

- User submits answer once → Backend receives 2 API calls
- Progress updated incorrectly (double-counted)

**Possible Causes**:

1. React StrictMode in development (triggers effects twice)
2. Button not disabled after submit
3. Multiple event handlers attached

**Diagnostic Steps**:

```typescript
const handleAnswer = useCallback(async (answer: string) => {
  console.log('📝 Submitting answer:', answer, 'at', new Date().toISOString());
  
  // Add submission guard
  if (isSubmitting) {
    console.warn('⚠️ Answer already submitting, ignoring duplicate');
    return;
  }
  
  setIsSubmitting(true);
  
  try {
    await saveAnswer(answer);
  } finally {
    setIsSubmitting(false);
  }
}, [isSubmitting]);
```

**Solutions**:

✅ **Solution 1**: Add `isSubmitting` state to prevent duplicates

```typescript
const [isSubmitting, setIsSubmitting] = useState(false);

const handleAnswer = async (answer: string) => {
  if (isSubmitting) return; // Guard clause
  
  setIsSubmitting(true);
  try {
    await saveAnswer(answer);
    dispatch({ type: 'SUBMIT_ANSWER', answer: { /* ... */ } });
  } finally {
    setIsSubmitting(false);
  }
};
```

✅ **Solution 2**: Disable submit button while processing

```typescript
<button onClick={() => handleAnswer(value)} disabled={isSubmitting}>
  {isSubmitting ? 'Submitting...' : 'Submit'}
</button>
```

✅ **Solution 3**: Debounce submit handler

```typescript
import { debounce } from 'lodash';

const debouncedSubmit = useCallback(
  debounce((answer: string) => {
    saveAnswer(answer);
  }, 300),
  []
);
```

---

## AI Feedback Problems

### Problem: AI explanations not loading (stuck on spinner)

**Symptoms**:

- User answers incorrectly → "Loading explanation..." shows forever
- No error message displayed

**Possible Causes**:

1. Gemini API timeout (> 3 seconds)
2. Redis cache error (throws exception)
3. API key invalid or quota exceeded

**Diagnostic Steps**:

```typescript
// Add detailed logging
async generateExplanation(request: FeedbackRequest): Promise<string> {
  console.log('🤖 Generating AI explanation for:', request.wordId);
  
  try {
    // Check cache
    const cached = await this.cache.get(request.wordId, request.questionType, request.userAnswer);
    if (cached) {
      console.log('✅ Cache HIT');
      return cached;
    }
    console.log('❌ Cache MISS, calling Gemini API');
    
    // Call API with timeout
    const explanation = await Promise.race([
      this.callGeminiAPI(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timeout')), 3000)
      )
    ]);
    
    console.log('✅ Gemini response received:', explanation.substring(0, 50) + '...');
    
    // Cache result
    await this.cache.set(request.wordId, request.questionType, request.userAnswer, explanation);
    
    return explanation;
  } catch (error) {
    console.error('❌ AI feedback error:', error);
    return 'Unable to load explanation. Try reviewing the correct answer and practice again.';
  }
}
```

**Solutions**:

✅ **Solution 1**: Verify Gemini API key is set

```bash
# Check environment variable
echo $GEMINI_API_KEY

# Test API key manually
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Test"}]}]}'
```

✅ **Solution 2**: Add fallback message for timeout

```typescript
catch (error) {
  if (error.message === 'Gemini API timeout') {
    return 'Explanation took too long to load. Review the correct answer above.';
  }
  return 'Unable to load explanation. Try again later.';
}
```

✅ **Solution 3**: Check Gemini API quota (free tier: 60 req/min)

Navigate to [Google AI Studio](https://makersuite.google.com/app/apikey) → Check usage limits

---

### Problem: AI explanations are generic / unhelpful

**Symptoms**:

- Explanation reads: "Try reviewing the correct answer and practice again." (fallback message)
- Explanation doesn't address specific user mistake

**Possible Causes**:

1. Prompt engineering insufficient (not enough context)
2. Gemini model parameter configuration too conservative

**Diagnostic Steps**:

```typescript
// Log full prompt sent to Gemini
const prompt = this.buildPrompt(request);
console.log('📝 Gemini prompt:\n', prompt);

// Check response
const response = await model.generateContent(prompt);
console.log('🤖 Gemini raw response:\n', response.response.text());
```

**Solutions**:

✅ **Solution 1**: Improve prompt with examples

```typescript
private buildPrompt(request: FeedbackRequest): string {
  return `
You are a patient Mandarin tutor. A student made this mistake:

Word: ${request.wordData.chinese} (${request.wordData.pinyin}) meaning "${request.wordData.english}"
Question type: ${request.questionType}
User's answer: "${request.userAnswer}"
Correct answer: "${request.correctAnswer}"

Provide a brief explanation (2-3 sentences) that:
1. Explains why the correct answer is right
2. If tone error (e.g., mā vs mǎ), explain the tone difference clearly
3. Offers a memory tip if relevant

Example good explanation:
"The correct pinyin for 好 is hǎo (tone 3). You typed hao2 (tone 2), which would be 豪. Remember: tone 3 has a dipping sound like 'really?' To remember 好, think 'woman + child = good family = GOOD feelings (tone 3 dip).'"

Now generate your explanation:
`.trim();
}
```

✅ **Solution 2**: Increase temperature parameter (more creative responses)

```typescript
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: {
    temperature: 0.7, // Increase from default 0.5
    maxOutputTokens: 150
  }
});
```

---

## Tone Input Validation Errors

### Problem: Correct tone marks rejected as incorrect

**Symptoms**:

- User types `ma3` → Converted to `mǎ` → Validation fails (says incorrect)
- User types `mǎ` directly → Validation fails

**Possible Causes**:

1. Normalization mismatch (Unicode equivalence)
2. Whitespace/casing differences
3. Wrong tone placement rule applied

**Diagnostic Steps**:

```typescript
function validatePinyin(userAnswer: string, correctAnswer: string): boolean {
  console.log('🔍 Validating:');
  console.log('  User:', userAnswer, '(length:', userAnswer.length, ')');
  console.log('  Correct:', correctAnswer, '(length:', correctAnswer.length, ')');
  
  // Check character codes
  console.log('  User codes:', Array.from(userAnswer).map(c => c.charCodeAt(0)));
  console.log('  Correct codes:', Array.from(correctAnswer).map(c => c.charCodeAt(0)));
  
  const normalized User = convertPinyinTone(userAnswer).toLowerCase().trim();
  const normalizedCorrect = correctAnswer.toLowerCase().trim();
  
  console.log('  Normalized user:', normalizedUser);
  console.log('  Normalized correct:', normalizedCorrect);
  console.log('  Match:', normalizedUser === normalizedCorrect);
  
  return normalizedUser === normalizedCorrect;
}
```

**Solutions**:

✅ **Solution 1**: Normalize Unicode (NFC vs NFD forms)

```typescript
function validatePinyin(userAnswer: string, correctAnswer: string): boolean {
  // Normalize to NFC (Canonical Composition)
  const normalizedUser = userAnswer.normalize('NFC').toLowerCase().trim();
  const normalizedCorrect = correctAnswer.normalize('NFC').toLowerCase().trim();
  
  return normalizedUser === normalizedCorrect;
}
```

✅ **Solution 2**: Remove extra whitespace

```typescript
const normalizedUser = userAnswer
  .replace(/\s+/g, '') // Remove all whitespace
  .normalize('NFC')
  .toLowerCase();
```

✅ **Solution 3**: Add tone-agnostic partial credit

```typescript
// If tone wrong but syllable correct, give 50% credit
const userBase = removeTones(userAnswer);
const correctBase = removeTones(correctAnswer);

if (userBase === correctBase) {
  return { correct: false, partialCredit: true, message: 'Syllable correct, but tone is wrong' };
}
```

---

## Redis Caching Issues

### Problem: Redis connection fails in production

**Symptoms**:

- Logs show: `Redis Client Error: ETIMEDOUT`
- AI feedback slower than expected (no cache hits)

**Possible Causes**:

1. Railway Redis URL format incorrect
2. Redis service not running (Railway provisioning failed)
3. TLS/SSL certificate mismatch

**Diagnostic Steps**:

```bash
# Check environment variable
echo $REDIS_URL

# Test connection manually (from Railway shell)
redis-cli -u $REDIS_URL ping  # Should return PONG

# Check Railway service status
railway status
```

**Solutions**:

✅ **Solution 1**: Verify Railway Redis plugin is active

- Navigate to Railway dashboard → Plugins → Redis → Check "Active" status

✅ **Solution 2**: Update Redis URL to use internal network

```typescript
const redisUrl = process.env.REDIS_URL?.replace(
  'redis.railway.app',
  'redis.railway.internal'
);
```

✅ **Solution 3**: Add TLS configuration for external connections

```typescript
const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    tls: true,
    rejectUnauthorized: false // For self-signed certs
  }
});
```

---

### Problem: Cache hit rate extremely low (< 10%)

**Symptoms**:

- `/api/cache/stats` shows 5% hit rate (expected: 50%+)
- AI API costs unexpectedly high

**Possible Causes**:

1. Cache keys not normalized (case sensitivity, whitespace)
2. TTL too short (cache expires before reuse)
3. User answers have minor variations (trailing spaces, casing)

**Diagnostic Steps**:

```typescript
// Log all cache operations
class AIFeedbackCache {
  async get(wordId: string, questionType: string, userAnswer: string): Promise<string | null> {
    const key = this.buildKey(wordId, questionType, userAnswer);
    console.log(`🔍 Cache lookup: ${key}`);
    
    const cached = await redis.get(key);
    console.log(cached ? '✅ HIT' : '❌ MISS');
    
    return cached;
  }
}

// Check what keys exist
const keys = await redis.keys('ai_feedback:*');
console.log('📦 Cached keys:', keys);
```

**Solutions**:

✅ **Solution 1**: Normalize cache key (lowercase, trim, remove extra spaces)

```typescript
private buildKey(wordId: string, questionType: string, userAnswer: string): string {
  const normalized = userAnswer.toLowerCase().trim().replace(/\s+/g, ' ');
  return `${CACHE_PREFIX}${wordId}:${questionType}:${normalized}`;
}
```

✅ **Solution 2**: Increase TTL from 24 hours to 7 days

```typescript
const CACHE_TTL = 7 * 24 * 60 * 60; // 7 days
```

✅ **Solution 3**: Use fuzzy matching for similar mistakes

```typescript
// Cache all "tone errors" under one key
const baseKey = removeTones(userAnswer); // ma1, ma2, ma3, ma4 → "ma"
const cacheKey = `${CACHE_PREFIX}${wordId}:${questionType}:tone_error:${baseKey}`;
```

---

## Performance Degradation

### Problem: Quiz loads slowly (> 3 seconds) after deployment

**Symptoms**:

- Frontend shows spinner for 3+ seconds before first question
- Backend logs show slow database queries

**Possible Causes**:

1. Missing database indexes (due words query slow)
2. N+1 query problem (fetching words one by one)
3. Large payload (fetching unnecessary data)

**Diagnostic Steps**:

```typescript
// Log query timing
console.time('getDueWords');
const dueWords = await progressService.getDueWords(userId);
console.timeEnd('getDueWords'); // Should be < 200ms

// Check database query plan
// In PostgreSQL:
EXPLAIN ANALYZE
SELECT * FROM user_vocabulary_progress
WHERE user_id = 'user-123' AND next_review_date <= NOW()
ORDER BY next_review_date ASC;
```

**Solutions**:

✅ **Solution 1**: Add database index

```sql
CREATE INDEX idx_user_next_review
ON user_vocabulary_progress(user_id, next_review_date);
```

✅ **Solution 2**: Use batch fetching with JOIN

```typescript
// Bad: N+1 query
const words = await Promise.all(
  progress.map(p => db.vocabulary.findById(p.wordId))
);

// Good: Single JOIN query
const dueWords = await db.userVocabularyProgress.findMany({
  where: { userId, nextReviewDate: { lte: new Date() } },
  include: { word: true } // Joins vocabulary table
});
```

✅ **Solution 3**: Limit payload size (fetch only necessary fields)

```typescript
const dueWords = await db.userVocabularyProgress.findMany({
  where: { /* ... */ },
  select: {
    wordId: true,
    word: {
      select: { chinese: true, pinyin: true, english: true } // Only needed fields
    }
  },
  take: 20 // Limit to 20 words per quiz
});
```

---

## Backend Integration Failures

### Problem: "Network Error" when submitting answers

**Symptoms**:

- Frontend shows: "Failed to save answer"
- Backend logs: No request received
- Browser console: `POST /api/quiz/answer 0 (Network Error)`

**Possible Causes**:

1. CORS misconfiguration (preflight request blocked)
2. Authentication token expired/missing
3. Backend server crashed/unreachable

**Diagnostic Steps**:

```bash
# Test backend endpoint manually
curl -X POST https://your-backend.railway.app/api/quiz/answer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"wordId":"word-123","correct":true}'

# Check CORS headers
curl -I https://your-backend.railway.app/api/quiz/answer \
  -H "Origin: https://your-frontend.vercel.app"
```

**Solutions**:

✅ **Solution 1**: Configure CORS correctly

```typescript
// apps/backend/src/server.ts

import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

✅ **Solution 2**: Refresh JWT token if expired

```typescript
// Frontend interceptor
apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Token expired, refresh
      await refreshAuthToken();
      return apiClient.request(error.config);
    }
    throw error;
  }
);
```

✅ **Solution 3**: Check Railway deployment logs

```bash
railway logs --service backend
# Look for crashes, error messages
```

---

## LocalStorage Persistence Bugs

### Problem: Quiz progress lost after browser closes

**Symptoms**:

- User completes 5 questions → Closes browser → Reopens → Quiz restarted from question 1

**Possible Causes**:

1. Browser clears localStorage (incognito mode, privacy settings)
2. localStorage quota exceeded
3. Session key includes timestamp (unique each time)

**Diagnostic Steps**:

```typescript
// Check if localStorage is available
try {
  localStorage.setItem('test', 'test');
  localStorage.removeItem('test');
  console.log('✅ localStorage available');
} catch (error) {
  console.error('❌ localStorage unavailable:', error);
}

// Check quota
if (navigator.storage && navigator.storage.estimate) {
  const estimate = await navigator.storage.estimate();
  console.log(`📦 Storage used: ${estimate.usage} / ${estimate.quota}`);
}

// Check what's actually stored
console.log('💾 Stored quiz session:', localStorage.getItem('quiz_session'));
```

**Solutions**:

✅ **Solution 1**: Use fixed key (not timestamp)

```typescript
// Bad
const SESSION_KEY = `quiz_session_${Date.now()}`;

// Good
const SESSION_KEY = 'quiz_session';
```

✅ **Solution 2**: Handle QuotaExceededError gracefully

```typescript
try {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    console.warn('⚠️ localStorage full, clearing old data');
    localStorage.clear();
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}
```

✅ **Solution 3**: Show warning if localStorage unavailable

```typescript
if (!isLocalStorageAvailable()) {
  return (
    <div className="warning">
      ⚠️ Your browser's privacy settings prevent saving quiz progress. You may lose progress if you close this tab.
    </div>
  );
}
```

---

## Spaced Repetition Algorithm Errors

### Problem: Words never graduate from short intervals

**Symptoms**:

- User reviews word 10+ times with correct answers → Still showing up every 1-2 days
- Expected: Interval should increase to weeks/months

**Possible Causes**:

1. Multiplier too conservative (1.0 instead of 2.5)
2. Consecutive correct count not incrementing
3. Migration from legacy system incomplete (still using old intervals)

**Diagnostic Steps**:

```typescript
// Log interval calculations
const newDelay = previousDelay * multiplier;
console.log(`📊 Interval calculation:
  - Previous delay: ${previousDelay} days
  - Multiplier: ${multiplier}
  - New delay: ${newDelay} days
  - Consecutive correct: ${consecutiveCorrect}
`);

// Check database values
const progress = await db.userVocabularyProgress.findUnique({
  where: { userId_wordId: { userId, wordId } }
});
console.log('💾 Stored progress:', progress);
```

**Solutions**:

✅ **Solution 1**: Verify multiplier logic

```typescript
function getPerformanceMultiplier(correct: boolean, consecutiveCorrect: number): number {
  if (correct) {
    if (consecutiveCorrect >= 3) return 2.5; // Not 1.5!
    if (consecutiveCorrect === 2) return 2.0;
    return 1.8;
  } else {
    return consecutiveCorrect === 0 ? 0.25 : 0.5;
  }
}
```

✅ **Solution 2**: Ensure consecutive count persists

```typescript
await db.userVocabularyProgress.update({
  where: { id },
  data: {
    nextReviewDate,
    lastDelay: newDelay,
    consecutiveCorrect: correct ? consecutiveCorrect + 1 : 0 // Important!
  }
});
```

✅ **Solution 3**: Force migration for stuck words

```sql
-- Find words stuck at short intervals despite many reviews
SELECT word_id, user_id, last_delay, consecutive_correct, updated_at
FROM user_vocabulary_progress
WHERE last_delay < 3 AND consecutive_correct > 5;

-- Force recalculate intervals
UPDATE user_vocabulary_progress
SET last_delay = 14, next_review_date = NOW() + INTERVAL '14 days'
WHERE last_delay < 3 AND consecutive_correct > 5;
```

---

## Quick Reference Checklist

### Before Reporting a Bug

- [ ] Check browser console for errors (F12 → Console tab)
- [ ] Check backend logs (Railway dashboard → Logs)
- [ ] Clear browser cache and localStorage (Ctrl+Shift+Delete)
- [ ] Test in incognito mode (rules out extension interference)
- [ ] Verify environment variables are set (`.env` file exists)
- [ ] Check database connection (can query users/vocab tables?)
- [ ] Verify third-party services running (Redis, Gemini API)

### Gathering Debug Info

```typescript
// Frontend debug snapshot
console.log('🔍 Debug Snapshot:', {
  quizState: state,
  localStorageKeys: Object.keys(localStorage),
  apiEndpoint: process.env.VITE_API_URL,
  userAuthenticated: !!user,
  timestamp: new Date().toISOString()
});

// Backend debug snapshot
console.log('🔍 Backend Debug:', {
  redisConnected: redisClient?.isOpen,
  databaseConnected: await checkDbConnection(),
  envVarsSet: {
    geminiApiKey: !!process.env.GEMINI_API_KEY,
    redisUrl: !!process.env.REDIS_URL
  },
  uptime: process.uptime()
});
```

---

## Related Documentation

- [Quiz State Management Guide](./quiz-state-management-guide.md) - State machine architecture
- [Gemini API Integration Guide](./gemini-api-integration-guide.md) - AI feedback implementation
- [Redis Caching Guide](./redis-caching-quiz-guide.md) - Caching strategies
- [Spaced Repetition Integration Guide](./spaced-repetition-integration-guide.md) - Algorithm implementation
- [Tone Input Component Guide](./tone-input-component-guide.md) - Pinyin validation

---

**Last Updated**: January 20, 2025
