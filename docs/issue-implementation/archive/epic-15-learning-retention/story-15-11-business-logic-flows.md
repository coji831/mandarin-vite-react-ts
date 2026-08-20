# Story 15.11: Quiz Feature Business Logic Flows

**Last Updated**: March 14, 2026  
**Purpose**: Document frontend-to-backend business logic flows for quiz feature maintenance

**Architecture Note**: Story 15.11 Phase 8-9 introduced unified quiz session architecture.  
**AI Feedback**: Simple format "the answer is {pinyin|chinese|meaning}" (keeping Gemini API implementation as backup, currently not used).  
**Backend-Centralized Business Logic**: All calculations moved to backend (Flow 2, Flow 3).  
**Daily Quiz Behavior**: Results available until midnight (read-only); auto-starts new session on new day. No due words → offer optional review of older words.  
**Type Alignment**: Property names follow type-audit.md standards (totalQuestions not totalAnswered, xpEarned not totalXP).

---

## Overview

This document maps the complete frontend-to-backend business logic flows for the quiz feature.

**🏗️ Architecture Pattern**: 3-layer synchronous architecture (Controllers → Services → Repositories)  
**⏱️ Performance**: <200ms typical response time (<2ms for simple feedback lookup)  
**📋 Context**: See [Appendix C](#appendix-c-architecture-decisions) for design rationale and architectural decisions.

> **Architecture Note**: Core business logic executes synchronously. AI feedback uses simple format lookup (no API calls, <2ms). See [Flow 2.2](#22-ai-feedback-generation-simple-format) for details.

---

## 📑 Table of Contents

**Core Flows:**

- [1. Session Entry Point](#1-session-entry-point) — `POST /api/v1/quiz/session/start`
  - [1.1 Business Rules: Three Session States](#11-business-rules-three-session-states)
  - [1.2 Branch A — Resume Active Session](#12-branch-a--resume-active-session)
  - [1.3 Branch B — Review Completed Session](#13-branch-b--review-completed-session-before-midnight)
  - [1.4 Branch C — Start New Session](#14-branch-c--start-new-session)
  - [1.5 No Vocabulary (edge case)](#15-no-vocabulary-edge-case)
- [2. Submit Answer](#2-submit-answer) — `POST /api/v1/quiz/session/:id/answer`
  - [2.1 Answer Validation & Progress Update](#21-answer-validation--progress-update)
  - [2.2 AI Feedback Generation](#22-ai-feedback-generation)
  - [2.3 Gamification Processing](#23-gamification-processing-session-complete-only)
  - [2.4 Session Summary Persistence](#24-session-summary-persistence-on-completion)
- [3. View Session Summary](#3-view-session-summary) — `GET /api/v1/quiz/session/:id/summary`
  - [3.1 Immediate Path](#31-immediate-path-already-in-submit-answer-response)
  - [3.2 Lazy Path](#32-lazy-path-refresh--navigate-back)
  - [3.3 Get Session Details](#33-get-session-details)
  - [3.4 Abandon Session (not needed)](#34-abandon-session--not-needed)
- [4. Leech Detection](#4-leech-detection) — `GET /api/v1/learning/leeches`
- [5. Gamification Events](#5-gamification-events-post-quiz-ui)
  - [5.1 Badge Award Celebration](#51-badge-award-celebration)
  - [5.2 Mystery Box](#52-mystery-box--deferred-to-epic-16)
- [6. Tone Input Validation](#6-tone-input-validation) — client-side
- [7. Stateless Learning Endpoints](#7-stateless-learning-endpoints)
  - [7.1 Get Due Words](#71-get-due-words)
  - [7.2 Save Learning Result](#72-save-learning-result)

**Appendices:**

- [Appendix A: Session Configuration & Constraints](#appendix-a-session-configuration--constraints)
- [Appendix B: Business Rules Constants](#appendix-b-business-rules-constants)
- [Appendix C: Architecture Decisions](#appendix-c-architecture-decisions)
- [Appendix D: Abandoned Quiz Impact Analysis](#appendix-d-abandoned-quiz-impact-analysis)
- [Appendix E: Tone Input Design](#appendix-e-tone-input-design)
- [Appendix F: Cross-Cutting Concerns](#appendix-f-cross-cutting-concerns)
- [Appendix G: Database Schema](#appendix-g-database-schema)
- [Appendix H: Performance Considerations](#appendix-h-performance-considerations)

---

## **1. Session Entry Point**

**API**: `POST /api/v1/quiz/session/start`  
**Trigger**: User navigates to `/learn/quiz`; `QuizProvider` mounts and calls `startSession()`

Every call to this endpoint returns one of three response variants depending on the user's current state. The backend evaluates state on every call — the frontend simply renders whichever variant it receives.

**Request** (optional query params):

| Param   | Type         | Default | Description                    |
| ------- | ------------ | ------- | ------------------------------ |
| `date`  | `YYYY-MM-DD` | today   | Target date for due-word query |
| `limit` | `number`     | 10      | Max words per session          |

**Response type**: `QuizSessionStartResponse`  
📋 See [Type Audit — Flow 1](./story-15-11-type-audit.md#flow-1-start-quiz-session) for full type and frontend/backend alignment.

> **`expiresAt` semantics**: In Branches A and C this is the session TTL (1 hour from start). In Branch B it is the daily-reset timestamp (midnight). Same field name, different meaning by branch.

---

### **1.1 Business Rules: Three Session States**

```
startQuizSession(userId, date, limit)
  │
  └─ Find latest session for user (any status)
      └─ IQuizSessionRepository.findLatestByUserId(userId)
          ├─ Found AND status=ACTIVE AND now < expiresAt      →  Branch A (Resume)
          ├─ Found AND status=COMPLETE AND now < expiresAt   →  Branch B (Review)
          ├─ Found but expired/stale                         →  Delete previous session
          │       (cascade: QuizSessionQuestion + QuizSessionAnswer + QuizSessionSummary)
          │       then fall through to Branch C
          └─ Not found                                        →  Branch C (New)
```

**Business rules summary:**

1. **Branch A — Resume**: 1-hour TTL is not extended on resume. Session restores from `currentIndex`.
2. **Branch B — Review**: Display completed results (read-only). Auto-transitions to Branch C at midnight.
3. **Branch C — New**: Previous session (and all related data) is deleted first, then 4-tier word selection builds the question list. Only 1 quiz session + summary exists per user at any time.

---

### **1.2 Branch A — Resume Active Session**

**Condition**: Existing session found with `now < expiresAt` (within 1 hour of start)

```
Backend returns:
  {
    alreadyCompleted: false,
    isResume: true,
    sessionId,
    questions[],
    currentIndex,   ← next unanswered question
    answers[],      ← previously submitted answers
    expiresAt       ← original 1h TTL (not extended)
  }

Frontend (useQuizSession.ts):
  ├─ Dispatch: RESUME_QUIZ_SESSION
  │   └─ Restores: sessionId, questions, currentIndex, answers
  └─ QuizReducer: phase → "QUESTION" at currentIndex

UI: QuizCard renders question at currentIndex
```

---

### **1.3 Branch B — Review Completed Session (before midnight)**

**Condition**: Completed session found with `now < expiresAt` (before midnight reset)

```
Backend returns:
  {
    alreadyCompleted: true,
    sessionId,
    summary: QuizSessionSummary | null,   ← null if summary row is missing
    expiresAt,      ← midnight timestamp
    questions: []
  }

Edge case (missing summary):
  ├─ Summary row not found (e.g. pre-migration session or DB error)
  ├─ Backend logs warning: "Summary not found for completed session"
  └─ Returns: { alreadyCompleted: true, sessionId, summary: null, expiresAt, questions: [] }
      └─ Frontend must handle summary: null (show empty/degraded state, not an error)
```

> **Design note**: The summary may be `null` for sessions completed before the summary persistence
> migration. Frontend should guard against `summary === null` before reading summary fields.

```
Frontend (useQuizSession.ts):
  ├─ Dispatch: SHOW_DAILY_COMPLETE_RESULTS
  │   └─ Sets: phase → "DAILY_COMPLETE", sessionSummary, expiresAt
  └─ QuizPage renders: <ResultsLayout isDailyComplete={true} />

ResultsLayout (daily complete mode):
  ├─ DailyCompleteBanner:
  │   ├─ Title: "Today's Quiz Complete! ✅"
  │   ├─ Initial state: Shows countdown timer (NextQuizCountdown component)
  │   │   └─ Updates every 1s if <1h remaining, every 60s if >1h
  │   └─ When countdown expires:
  │       └─ Countdown replaced with "Start New Quiz" button
  │           └─ onClick → handleNewQuiz() → reloads due words for new session
  ├─ Stats grid: accuracyRate, xpEarned, correctCount, totalQuestions
  ├─ Results table: all answers with correctness (incorrectWords displayed inline)
  └─ Action buttons section: hidden in daily-complete mode (button moved to banner)
```

> **Design Note**: Results remain accessible until midnight (Branch B). "Start New Quiz" button appears in banner when countdown expires. No manual retry option; all new quizzes trigger from banner or auto-start at day boundary.

---

### **1.4 Branch C — Start New Session**

**Condition**: No active session and no valid completed session (new day, first quiz, or session expired >1h)

```
createSession(userId, date, limit)
  │
  ├─ Step 1: Build word list (4-tier strategy — always produces words)
  │   ├─ Tier 1: Scheduled due words (nextReview <= date)
  │   │   └─ LearningService.getDueWordsOnly(userId, date, limit)
  │   ├─ Tier 2: New unlearned words (fill remaining slots)
  │   │   └─ LearningService.getNewWords(userId, remaining) — if Tier 1 < limit
  │   ├─ Tier 3: Review fallback (future-due words, excluding already selected)
  │   │   └─ LearningService.getReviewFallbackWords(userId, remaining, excludeIds) — if still < limit
  │   └─ If all tiers empty → return No Due Words response (see 1.5)
  │
  ├─ Step 2: Generate questions (one random type per word)
  │   ├─ Pick 1 random type per word: multiple_choice | type_pinyin | type_character
  │   ├─ MC options: 1 correct + 3 distractors from other words (Fisher-Yates shuffle)
  │   └─ Result: 1 question per word → limit questions total
  │
  ├─ Step 3: Create session record (PostgreSQL)
  │   ├─ QuizSession row: { userId, currentIndex:0, startedAt, expiresAt(+1h) }
  │   └─ QuizSessionQuestion rows: nested write via Prisma relation
  │       (expired summaries already cleaned up in Step 1 of §1.1 flow)
  │
  └─ Step 4: Sanitize questions for client
      ├─ Remove correctAnswer field (server-side validation only — never sent to client)
      ├─ Omit pinyin for type_pinyin questions
      └─ Return sanitized QuizSessionQuestion[]

Backend returns:
  {
    alreadyCompleted: false,
    isResume: false,
    sessionId,
    questions[limit],   ← 1 per word (e.g. 10 words = 10 questions)
    expiresAt,          ← 1h from now
    currentIndex: 0
  }

Frontend (useQuizSession.ts):
  ├─ Transform: quizTransformers.transformSessionToQuestions(response.questions)
  ├─ Dispatch: INITIALIZE_QUIZ
  └─ QuizReducer: phase → "QUESTION", questions set, currentIndex = 0
```

> **Design Note**: See [Appendix C.1](#c1-quiz-session-interleaving-strategy) for research backing interleaved practice. See [Appendix C.5](#c5-database-persistence-design) for 7-day cleanup rationale.

---

### **1.5 No Vocabulary (edge case)**

**Condition**: All 3 tiers of `_buildWordList()` return empty — user has added no vocabulary yet

**When this happens**: Only for brand-new users who have zero words in their vocabulary. With the 4-tier strategy (due → new → review fallback), a user with any vocabulary will always get a quiz.

**Behavior**: Return HTTP 200 with `noDueWords: true`; no session is created or stored

```
Backend:
  ├─ _buildWordList() exhausts Tier 1 + Tier 2 + Tier 3 → returns []
  └─ Return HTTP 200 response (no DB writes)

Frontend (useQuizSession.ts):
  ├─ Check: response.noDueWords === true
  └─ UI: Shows message directing user to add vocabulary
```

**Response Structure** (HTTP 200):

```javascript
{
  noDueWords: true,
  questions: [],
  message: "No vocabulary available for review. Add vocabulary to start practicing."
}
```

> See [Appendix C.3](#c3-no-due-words-handling) for status code and design rationale.

---

## **2. Submit Answer**

**API**: `POST /api/v1/quiz/session/:sessionId/answer`  
**Trigger**: User selects or types an answer and submits  
**Architecture**: Single synchronous call — validation + progress + AI feedback + gamification all in one response

**Request** (`QuizAnswerRequest`):

| Field         | Type     | Description                              |
| ------------- | -------- | ---------------------------------------- |
| `questionId`  | `string` | ID of the question being answered        |
| `userAnswer`  | `string` | User's pinyin, character, or choice text |
| `timeSpentMs` | `number` | Time elapsed since question displayed    |

**Response** (`QuizAnswerResponse`) — key fields:

| Group         | Fields                                                             |
| ------------- | ------------------------------------------------------------------ |
| Answer        | `correct`, `correctAnswer`                                         |
| Progress      | `nextReviewDate` (ISO 8601), `lapseCount`, `isLeech`               |
| AI Feedback   | `aiFeedback: { explanation, errorType } \| null` (null if correct) |
| Session State | `sessionComplete`, `nextQuestion`, `progress: { current, total }`  |
| Gamification  | `gamification: {...} \| null` (only when `sessionComplete`)        |

**Response time**: <200ms typical (simple feedback <2ms). All steps run sequentially inline — no async queues.  
📋 See [Type Audit — Flow 2](./story-15-11-type-audit.md#flow-2-submit-quiz-answer-with-integrated-ai-feedback) for full type definition and known misalignments.

> **Why single response?** One call, complete data, synchronous consistency. Simple AI feedback ensures instant response (<2ms per lookup). See [Appendix C.4](#c4-synchronous-architecture-rationale).

> **Abandoned quiz**: Progress is saved per-answer. Gamification only activates on `sessionComplete`. See [Appendix D](#appendix-d-abandoned-quiz-impact-analysis).

---

### **2.1 Answer Validation & Progress Update**

```
submitAnswer(sessionId, userId, questionId, userAnswer, timeSpentMs)
  │
  ├─ Guard: Duplicate answer check
  │   ├─ IQuizSessionAnswerRepository.findBySessionAndQuestion(sessionId, questionId)
  │   └─ If found → throw "Question already answered" → HTTP 409 ALREADY_ANSWERED
  │
  ├─ Step 1: Validate answer
  │   ├─ IQuizSessionRepository.findByIdAndUserId(sessionId, userId)
  │   ├─ Get correct answer:
  │   │   ├─ type_pinyin     → question.pinyin
  │   │   ├─ type_character  → question.hanzi (simplified)
  │   │   └─ multiple_choice → question.english
  │   ├─ Normalize: toLowerCase().trim()  (tone marks preserved: mā ≠ ma)
  │   ├─ isCorrect = normalized comparison
  │   ├─ session.currentIndex += 1
  │   ├─ sessionComplete = (currentIndex >= totalQuestions)
  │   └─ IQuizSessionRepository.updateSession()
  │
  ├─ Step 2: Update spaced repetition progress
  │   ├─ IProgressRepository.findByUserAndWord(userId, wordId)
  │   ├─ Calculate nextReviewDate:
  │   │   ├─ Correct:   newDelay = currentDelay × 2.0  (exponential backoff, max 365 days)
  │   │   └─ Incorrect: newDelay = 1 day (reset)
  │   ├─ Update lapseCount:
  │   │   ├─ Correct:   lapseCount = 0
  │   │   └─ Incorrect: lapseCount += 1  (isLeech = lapseCount >= 5)
  │   └─ IProgressRepository.update({ nextReviewDate, lapseCount })
  │
  └─ Step 3: Record answer
      └─ IQuizSessionAnswerRepository.create({
             sessionId, userId, wordId, questionId,
             userAnswer, correct, timeSpentMs,
             lapseCount, isLeech, nextReviewDate })
```

> **`nextReviewDate` vs `nextReview`**: The answer response uses `nextReviewDate`; the AI feedback object uses `nextReview`. See type-audit.md Flow 2 for alignment status.

---

### **2.2 AI Feedback Generation** (Simple Format)

**Current Status**: Uses simple format feedback without external API calls.  
**Architecture**: Synchronous generation by looking up correct answer and formatting as simple message.

```
SubmitAnswer(sessionId, userId, questionId, userAnswer, timeSpentMs)
  │
  ├─ Condition: !correct (only for incorrect answers)
  │
  └─ Simple Feedback Logic:
      ├─ Step 1: Fetch word from vocabulary
      │   └─ VocabularyRepository.findById(word.wordId)
      │
      ├─ Step 2: Select answer format based on question type
      │   ├─ type_pinyin  → use word.pinyin
      │   ├─ type_character → use word.simplified
      │   └─ multiple_choice → use word.english
      │
      ├─ Step 3: Format simple message
      │   └─ `the answer is {selectedFormat}`
      │
      └─ Returns: { explanation, errorType: 'feedback' } | null
```

**Format Examples**:

- Pinyin question: "the answer is nǐ hǎo"
- Character question: "the answer is 你好"
- Meaning question: "the answer is hello"

**Benefits**: Instant response, no external API dependency, simple user-friendly message.

**Response Structure**:

```javascript
aiFeedback: {
  explanation: string,    // "the answer is {value}"
  errorType: string       // 'feedback'
} | null                   // null if answer was correct or lookup failed
```

> **Note**: Gemini API integration kept intact in CachedAIFeedbackService for future use when more sophisticated feedback is needed.

---

### **2.3 Gamification Processing** (session complete only)

**Condition**: `sessionComplete === true`

```
IGamificationService.processSessionComplete(sessionId, userId)
  │
  ├─ 5a. Calculate session stats
  │   ├─ allAnswers = IQuizSessionAnswerRepository.findBySession(sessionId)
  │   ├─ correctCount = allAnswers.filter(a => a.correct).length
  │   └─ accuracyRate = (correctCount / totalQuestions) × 100
  │
  ├─ 5b. Update streak (FIRST — XP and badge calculations use post-session streak values)
  │   ├─ IStreakService.updateStreak(userId)
  │   └─ Returns: { currentStreak, longestStreak }
  │
  ├─ 5c. Award XP (uses post-session currentStreak)
  │   ├─ base = correctCount × 10
  │   ├─ bonus = updatedStreak.currentStreak >= 7 ? correctCount × 5 : 0
  │   └─ xpEarned = base + bonus
  │
  ├─ 5d. Check and award badges (uses longestStreak — badges survive streak resets)
  │   ├─ IGamificationService.checkAndAwardBadges(userId, updatedStreak.longestStreak)
  │   ├─ Milestones: 7 / 30 / 100 / 365 days
  │   │   → "Week Warrior" / "Monthly Master" / "Century Scholar" / "Year Legend"
  │   └─ Returns: Badge[] (newly awarded this session only)
  │
  ├─ 5e. Roll mystery box
  │   ├─ Drop rates by accuracy: <60% → 3%, 60–79% → 5%, 80–89% → 8%, 90–100% → 10%
  │   └─ Returns: MysteryBox | null
  │
  └─ 5f. Check freeze award
      ├─ Condition: accuracyRate === 100 AND perfectSessionStreak >= 10 consecutive
      └─ Returns: { freezeAwarded: boolean }
```

> See [Appendix A](#appendix-a-session-configuration--constraints) for XP rates and drop rate config. See [Appendix B](#appendix-b-business-rules-constants) for `BusinessRules.js` helper functions.

---

### **2.4 Session Summary Persistence** (on completion)

**Trigger**: Immediately after gamification processing when `sessionComplete === true`

```
QuizSessionSummaryRepository.create({
  userId, sessionId,
  completedAt: now,
  totalQuestions, correctCount, incorrectCount, accuracyRate,
  xpEarned, newBadgeIds[], mysteryBoxDrop, mysteryBoxType,
  freezeAwarded,
  expiresAt: 7 days TTL   ← safety net; primary cleanup is cascade delete on new quiz start
})
```

**Design decisions:**

- `incorrectWords` and `leechWordIds` are NOT stored — derived at query time from `QuizSessionAnswer + QuizSessionQuestion` join (avoids stale snapshot data)
- **Cleanup**: summary is automatically deleted (cascade) when the parent `QuizSession` is deleted at new quiz start — no separate TTL-based cleanup needed
- `expiresAt` = completedAt + 7 days as a safety net (in case cascade fails or for analytics queries)

---

## **3. View Session Summary**

**API**: `GET /api/v1/quiz/session/:sessionId/summary`  
**Trigger**: ResultsLayout mounts, or user navigates back / refreshes results page  
**Architecture**: Read-only; summary was pre-calculated and persisted during `submitAnswer` (§2.4)

---

### **3.1 Immediate Path** (already in submit-answer response)

When a session just completed, the full gamification summary is already in the `submitAnswer` response — no extra API call needed.

```
submitAnswer() response (when sessionComplete = true)
  └─ gamification: {
         xpEarned, newBadges, mysteryBoxDrop, mysteryBoxType,
         freezeAwarded, currentStreak, availableFreezes
     }
```

The frontend reads this directly from `QuizContext` state via `useQuizSummary()`. Incorrect/leech words are derived client-side from the answer history already in state.

---

### **3.2 Lazy Path** (refresh / navigate back)

**Trigger**: User refreshes page or navigates back to results after leaving

```
GET /api/v1/quiz/session/:sessionId/summary
  │
  ├─ Primary path: Read pre-calculated summary from QuizSessionSummary table
  │   ├─ QuizSessionSummaryRepository.findBySessionIdAndUserId(sessionId, userId)
  │   └─ If found → go to Step 2 (derive word detail + return)
  │
  ├─ Fallback path: If no summary row found (resilience — rare with single-session model)
  │   ├─ Load session from QuizSession + QuizSessionAnswer tables
  │   ├─ Recalculate: correctCount, incorrectCount, accuracyRate from answer rows
  │   └─ Gamification fields degraded: xpEarned=0, newBadges=[], mysteryBox=null, freezeAwarded=false
  │
  ├─ Step 2: Derive word detail (always computed at query time — not stored)
  │   ├─ Load: IQuizSessionAnswerRepository.findBySession(sessionId)
  │   ├─ Enrich: each answer joined with QuizSessionQuestion
  │   │          fields: hanzi, pinyin, english, questionType, userAnswer, correct,
  │   │                  correctAnswer, lapseCount, isLeech, nextReviewDate
  │   ├─ incorrectWords = allAnswers.filter(a => !a.correct)
  │   ├─ leechWords     = incorrectWords.filter(w => w.isLeech)
  │   └─ leechWordIds   = deduplicated wordIds from answers where isLeech=true
  │
  ├─ Step 3: Fetch live streak data
  │   └─ IStreakService.getStreak(userId) → { currentStreak, freezeCount as availableFreezes }
  │
  └─ Step 4: Return unified summary
      └─ {
             sessionId, accuracyRate, correctCount, incorrectCount, totalQuestions,
             allAnswers[],         ← full per-answer array (wordId, hanzi, pinyin, english,
             incorrectWords[],         questionType, userAnswer, correct, correctAnswer,
             leechWords[],             lapseCount, isLeech, nextReviewDate)
             leechWordIds[],       ← deduplicated list of leech word IDs
             leechCount,           ← length of leechWordIds
             xpEarned, newBadges[], mysteryBox, freezeAwarded,
             currentStreak, availableFreezes,
             completedAt, expiresAt
         }
```

📋 See [Type Audit — Flow 2.3](./story-15-11-type-audit.md#flow-23-get-session-summary) for full type definitions and known misalignments (`currentStreak` / `availableFreezes` may be absent from frontend types).

> **Why not store `incorrectWords`?** Derived at query time from `QuizSessionAnswer + QuizSessionQuestion` join to avoid stale snapshot data. See [Appendix C.5](#c5-database-persistence-design).

---

### **3.3 Get Session Details**

**API**: `GET /api/v1/quiz/session/:sessionId`  
**Purpose**: Fetch session state for resume or external tooling

**Response** (HTTP 200):

```javascript
{
  sessionId, status,
  currentIndex,
  questionsAnswered,  // same as currentIndex
  totalQuestions,
  questions[],        // sanitized (no correctAnswer)
  expiresAt,
  completedAt
}
```

**Errors**: 404 `SESSION_NOT_FOUND` if session doesn't exist or belongs to another user.

---

### **3.4 Abandon Session** — NOT NEEDED

**Why**: With the single-session model, sessions auto-expire at midnight (ACTIVE sessions expire at +1h TTL). When the user starts a new quiz, the previous session and all its data are deleted via cascade. There is no need to explicitly abandon a session.

> **DELETE /api/v1/quiz/session/current** endpoint exists in the codebase but is not required. It will never be called in normal flow. Kept for backward compatibility.

---

## **4. Leech Detection**

**API**: `GET /api/v1/learning/leeches`  
**Trigger**: lapse count updated per-answer (part of §2.1 Step 2); leech list queried on demand  
**Threshold**: `lapseCount >= 5` (defined in `BusinessRules.LEECH_THRESHOLD`)

```
Per-answer (inside submitAnswer — §2.1):
  IProgressRepository.update({ lapseCount })
    ├─ Correct:   lapseCount = 0  (reset)
    └─ Incorrect: lapseCount += 1

isLeech check (BusinessRules.js):
  return lapseCount >= LEECH_THRESHOLD  // 5

GET /api/v1/learning/leeches
  └─ LearningService.getLeechesByUser(userId, minLapseCount, limit)
      ├─ Query: UserWordProgress WHERE userId = :userId AND lapseCount >= minLapseCount
      ├─ Join:  Word data (hanzi, pinyin, english)
      ├─ Order: lapseCount DESC
      └─ Returns: LeechWord[] { wordId, hanzi, pinyin, english, lapseCount, nextReviewDate }
```

> Lapse count is persisted in `UserWordProgress` (not `QuizSessionAnswer`), so leech status survives across sessions. See [Appendix G](#appendix-g-database-schema) for schema.

---

## **5. Gamification Events (Post-Quiz UI)**

Post-quiz UI events triggered when `sessionComplete === true`. All gamification data is already in the `submitAnswer` response — no additional API calls needed for display.

---

### **5.1 Badge Award Celebration**

**Trigger**: `submitAnswer` response has `gamification.newBadges.length > 0`

```
Badge milestones (awarded in §2.3 Step 5c):
  ├─ 7-day streak   → "Week Warrior"
  ├─ 30-day streak  → "Monthly Master"
  ├─ 100-day streak → "Century Scholar"
  └─ 365-day streak → "Year Legend"

Frontend:
  ├─ BadgeCelebrationModal auto-opens
  ├─ Dispatch: ADD_NEW_BADGES (from answer submission response)
  ├─ Auto-dismiss: 5 seconds or user click
  └─ Multiple badges shown if > 1 awarded this session
```

Database: `user_badges { userId, badgeId, earnedDate }` — unique constraint `(userId, badgeId)` prevents duplicates. Badges cannot be awarded twice for the same milestone.

---

### **5.2 Mystery Box** — DEFERRED TO EPIC 16+

**Current Status**: Mystery box generation, visual display, and persistence are implemented. Reward application logic is deferred.

**Epic 15.11 Deliverables**:

- ✅ Mystery box generation during quiz completion (`GamificationService.checkMysteryBoxDrop()`)
- ✅ `MysteryBoxModal` visual display and confetti animation
- ✅ Mystery box persistence (database entity + repository)
- ❌ Reward application endpoint (deferred to Epic 16+)
- ❌ User reward redemption flow (deferred to Epic 16+)

**Why Deferred**: Reward system (XP boost, streak freeze, cosmetics) requires coordination with gamification and cosmetics features planned for later epics. The current mystery box implementation provides UI engagement without the reward side-effects.

> **Future endpoint (Epic 16+)**:
>
> ```
> POST /api/v1/gamification/mystery-box/:id/open
>   ├─ Step 1: Validate ownership (box.userId === userId AND box.opened === false)
>   ├─ Step 2: Read pre-rolled reward type ('xp_boost' | 'freeze' | 'cosmetic')
>   ├─ Step 3: Apply reward (xp_boost → XP, freeze → streak freeze, cosmetic → unlock)
>   └─ Step 4: Mark opened (prevent double-claim)
> ```

**Type Alignment**: `MysteryBox` structure already aligned between backend and frontend (see type-audit.md).

📋 For implementation details and type references, see [Type Audit — Flow 2.5](./story-15-11-type-audit.md#flow-25-mystery-box-opening).

---

## **6. Tone Input Validation**

**Scope**: Client-side only — numeric-to-Unicode conversion happens in `pinyinConverter.ts` before the answer is submitted  
**Backend role**: Receives already-converted Unicode pinyin (`mǎ`, not `ma3`); normalizes case/whitespace; exact-match compare

```
PinyinToneInput.tsx
  ├─ User types:      "ma3"
  ├─ Live preview:    convertToneMarks("ma3") → "mǎ"   (pinyinConverter.ts)
  └─ On submit:       sends "mǎ" (converted value, not raw "ma3")

convertToneMarks(input):
  ├─ Multi-vowel combinations first (24 entries): ao3→ǎo, ai4→ài, ou2→óu …
  ├─ Nasal finals next (32 entries):              an3→ǎn, ang1→āng …
  └─ Single vowels last (24 entries):             a3→ǎ, e1→ē, i2→í …

Tone mark placement rules (encoded in toneMap.ts):
  ├─ 'a' always wins:          bai4 → bài  (not baǐ)
  ├─ then 'o' or 'e' (no 'a'): tou2 → tóu, hei1 → hēi
  ├─ 'iu' → mark on 'u':       liu4 → liù
  ├─ 'ui' → mark on 'i':       dui4 → duì
  └─ single vowel:             li3 → lǐ, bu4 → bù

Backend validation (QuizSessionService.validateAnswer):
  ├─ normalize: toLowerCase().trim()  (both sides)
  ├─ compare:   normalizedUser === normalizedCorrect
  └─ ⚠️  Unicode NOT normalized (NFC/NFD) — "mǎ" composed vs decomposed may mismatch
         See Appendix E (Tone Input Design) for status.
```

**Key rules**:

| Input        | Output  | Note                           |
| ------------ | ------- | ------------------------------ |
| `ma1`        | `mā`    | tone 1: high-flat              |
| `ma2`        | `má`    | tone 2: rising                 |
| `ma3`        | `mǎ`    | tone 3: falling-rising         |
| `ma4`        | `mà`    | tone 4: falling                |
| `ma5` / `ma` | `ma`    | neutral tone — no mark         |
| `ni3hao3`    | `nǐhǎo` | multi-syllable: both converted |
| `xyz9`       | `xyz9`  | non-pinyin: returned unchanged |

**UI**:

- Live preview below input field (always visible while typing)
- `autocomplete="off"`, `autocorrect="off"`, `spellcheck="off"` on the input
- 💡 hint button toggle reveals correct pinyin
- AI feedback on incorrect submission classifies error as `"tone"` type

**Files**:

- `apps/frontend/src/features/quiz/components/inputs/PinyinToneInput.tsx`
- `apps/frontend/src/features/quiz/utils/pinyinConverter.ts`
- `apps/frontend/src/constants/toneMap.ts` (80 pre-sorted tone mappings)

> See [Appendix E](#appendix-e-tone-input-validation-design) for tone placement research, numeric notation rationale, and mobile enhancement plans.

---

## **7. Stateless Learning Endpoints**

These endpoints operate independently of the quiz session. They allow direct access to due words and learning results without a session context (useful for external tools or future offline sync).

---

### **7.1 Get Due Words**

**API**: `GET /api/v1/learning/due`  
**Auth**: Required  
**Query Params**: `date` (YYYY-MM-DD, default today), `limit` (number, default 10)

```
GET /api/v1/learning/due?date=2026-03-14&limit=10
  └─ LearningService.getDueWords(userId, date, limit)
      ├─ Query: UserWordProgress WHERE nextReview <= date
      ├─ Join:  Vocabulary word fields
      └─ Returns: Word[] enriched with progress data
```

**Note**: This is a read-only query; unlike the session start flow, it does not apply the 4-tier fallback strategy — it returns only strictly due words.

---

### **7.2 Save Learning Result**

**API**: `POST /api/v1/learning/result`  
**Auth**: Required  
**Purpose**: Persist a spaced repetition update outside the quiz session flow

**Request Body**:

| Field          | Type      | Description                              |
| -------------- | --------- | ---------------------------------------- |
| `wordId`       | `string`  | ID of the word being reviewed            |
| `correct`      | `boolean` | Whether the user answered correctly      |
| `questionType` | `string`  | `multiple_choice` / `type_pinyin` / etc. |
| `timeSpentMs`  | `number`  | Time spent on this answer (milliseconds) |

```
POST /api/v1/learning/result
  └─ LearningService.saveResult(userId, { wordId, correct, questionType, timeSpentMs })
      ├─ Update: IProgressRepository (nextReviewDate, lapseCount)
      └─ Returns: { success: true, nextReviewDate, lapseCount, isLeech }
```

**Note**: No gamification processing — XP/badges/streak are only awarded through the full quiz session flow.

---

## **Appendix A: Session Configuration & Constraints**

| Parameter              | Value                                   | Notes                                                     |
| ---------------------- | --------------------------------------- | --------------------------------------------------------- |
| Words per session      | 10 (default)                            | Configurable, max 20                                      |
| Questions per word     | 3                                       | `multiple_choice`, `type_pinyin`, `type_character`        |
| Session TTL            | 1 hour                                  | `expiresAt` in PostgreSQL; abandoned sessions auto-expire |
| Daily quiz TTL         | Until midnight                          | One quiz per calendar day; `expiresAt = midnight`         |
| AI feedback timeout    | 3 seconds                               | Returns `null` on timeout; quiz never blocked             |
| AI cache TTL           | 24 hours                                | Redis; ~70% hit rate                                      |
| Summary TTL            | 7 days                                  | Deleted on next `createSession()` call after expiry       |
| Spaced rep max delay   | 365 days                                | Exponential backoff cap                                   |
| Leech threshold        | 5 lapse                                 | `BusinessRules.LEECH_THRESHOLD`                           |
| Streak grace period    | 48 hours                                | One missed day forgiven                                   |
| Freeze award condition | 100% accuracy × 10 consecutive sessions |                                                           |

---

## **Appendix B: Business Rules Constants**

**Location**: `apps/backend/src/core/domain/constants/BusinessRules.js`

```javascript
export const LEECH_THRESHOLD = 5; // lapseCount >= 5 → leech
export const XP_PER_CORRECT_ANSWER = 10;
export const STREAK_BONUS_THRESHOLD = 7; // days
export const STREAK_BONUS_XP = 5; // per correct answer when streak >= 7
export const SESSION_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour
export const RESULT_EXPIRATION_DAYS = 7;
export const STREAK_GRACE_PERIOD_HOURS = 48;

export const MYSTERY_BOX_RATES = {
  POOR: { threshold: 60, rate: 0.03 }, // <60%:   3%
  FAIR: { threshold: 80, rate: 0.05 }, // 60–79%: 5%
  GOOD: { threshold: 90, rate: 0.08 }, // 80–89%: 8%
  PERFECT: { threshold: 100, rate: 0.1 }, // 90–100%: 10%
};

export function isLeech(lapseCount) {
  return lapseCount >= LEECH_THRESHOLD;
}
export function calculateXP(correctCount, currentStreak = 0) {
  const base = correctCount * XP_PER_CORRECT_ANSWER;
  const bonus = currentStreak >= STREAK_BONUS_THRESHOLD ? correctCount * STREAK_BONUS_XP : 0;
  return base + bonus;
}
export function calculateAccuracy(correct, total) {
  return total === 0 ? 0 : (correct / total) * 100;
}
export function getMysteryBoxDropRate(accuracyRate) {
  if (accuracyRate >= MYSTERY_BOX_RATES.PERFECT.threshold) return MYSTERY_BOX_RATES.PERFECT.rate;
  if (accuracyRate >= MYSTERY_BOX_RATES.GOOD.threshold) return MYSTERY_BOX_RATES.GOOD.rate;
  if (accuracyRate >= MYSTERY_BOX_RATES.FAIR.threshold) return MYSTERY_BOX_RATES.FAIR.rate;
  return MYSTERY_BOX_RATES.POOR.rate;
}
```

> **Note**: `GamificationService.calculateXP()` and `checkMysteryBoxDrop()` delegate to `BusinessRules.js` helper functions.

---

## **Appendix C: Architecture Decisions**

### **C.1: Quiz Session Interleaving Strategy**

- **Research-backed**: Interleaved practice improves long-term retention vs blocked practice
- **Multi-modal design**: Pinyin + hanzi + listening questions prevent pattern recognition
- **Random order**: Prevents users from memorizing answer sequences

### **C.2: Daily Quiz Behavior Design**

- **Results availability**: Completed session results available until midnight (Branch B read-only mode)
- **No manual retry**: Users cannot click "New Quiz" button within same day; prevents duplicate daily attempts
- **Auto-start on new day**: Exactly at midnight, `startSession()` transitions to Branch C (new session)
- **Expiration boundary**: Midnight UTC+0 simplifies timezone logic; stored as `expiresAt` in session record
- **User experience**: Results review available all day; frictionless auto-transition on new day (no UI action needed)

### **C.3: No Due Words Handling**

- **Status code 200**: `noDueWords: true` flag identifies the case; 200 prevents false negatives in monitoring
- **No error state**: Empty state !== failure
- **UX scenarios**: Shows "All caught up!" message via `response.message`

### **C.4: Synchronous Architecture Rationale**

- **Per-answer progress**: Spaced repetition updates immediately (no lost work on abandonment)
- **Completion-gated gamification**: XP/badges/streak only awarded on `sessionComplete = true` (incentivizes finishing)
- **<200ms response time**: Adequate for user experience; pre-formatted AI feedback eliminates latency
- **Simpler debugging**: No event handlers, no eventually-consistent states
- **Pre-formatted feedback**: Template-based responses ensure sub-millisecond lookup (no AI API calls)

### C.5: Database Persistence Design

- **Server-side storage**: Quiz results persisted to database for cross-device access and analytics
- **Single-session model**: Only 1 `QuizSession` + related data (questions, answers, summary) exists per user at any time. Previous session is hard-deleted (cascade) when a new quiz starts.
- **Cascade deletes**: Deleting `QuizSession` cascades to `QuizSessionQuestion` → `QuizSessionAnswer` and `QuizSessionSummary` (all `onDelete: Cascade` in schema)
- **Database-first read**: Primary path queries `QuizSessionSummary` table; fallback to recalculation for resilience
- **Cross-device sync**: Results accessible from any device (not tied to browser localStorage)
- **Analytics potential**: Queryable data enables historical trends and progress visualization (Epic 20+)

### C.6: Session Summary Architecture

- **Thin controller**: No business logic in HTTP layer (all in QuizSessionService)
- **Immediate consistency**: Summary reflects data saved during answer submission (no async lag)
- **GET idempotency**: Cacheable endpoint (can add HTTP cache headers)

---

## **Appendix D: Abandoned Quiz Impact Analysis**

**What Persists:**

- ✅ Progress updates (spaced repetition intervals, lapse counts)
- ✅ Quiz result records (per-answer correctness tracked)

**What's Gated:**

- ⏸️ XP/badges/mystery boxes (requires `sessionComplete = true`)
- ⏸️ Streak updates (requires completion)

**Rationale**: Streak updates wait for completion to incentivize finishing quizzes (behavioral commitment). Progress updates persist per-answer to ensure learning data always saved, even if user abandons mid-session.

**User Impact**:

- Learning progress saved (no lost work)
- No gamification rewards for partial completion (incentivizes finishing)
- Can resume from `session.currentIndex` if session not expired (1 hour TTL)

---

## **Appendix E: Tone Input Validation Design**

**Research Alignment:**

- **Tone placement rules**: Implements a>o>e>i/u priority hierarchy (research-specified standard)
- **Numeric notation**: ma3→mǎ conversion minimizes input friction (easier than typing special characters)
- **Live preview**: Immediate feedback reduces cognitive load
- **Mobile enhancement**: Long-press gestures documented for future implementation

**Architecture:**

- **Client-side conversion**: Instant feedback; no backend delay; reduces server load
- **Precomputed tone map**: 80 pre-sorted mappings (24×4 tones multi-vowel + 32×4 nasal finals + 24×4 single vowels) ensure correctness and efficiency
- **Validation**: Backend performs case/whitespace normalization (no Unicode NFC normalization currently)

> **Unicode Normalization Note**: Backend validation does not currently normalize Unicode (NFC/NFD). If tone comparison issues arise with combining characters (decomposed forms), add `.normalize('NFC')` to QuizSessionService.\_normalizeAnswer() method.

**UX Example:**

- User types "ni2" → Live preview shows "ní" → Submit → AI explains "You used tone 2 (ní), but 你 uses tone 3 (nǐ)"

---

## **Appendix F: Cross-Cutting Concerns**

### **Authentication**

- JWT cookies (httpOnly, secure, sameSite=strict)
- Middleware extracts userId from token
- All routes authenticated via `req.userId`

### **Error Handling**

- Backend: try/catch in service layer → structured error responses
- Frontend: onError callbacks → ErrorScreen or toast notifications
- Fallback: Graceful degradation (cache answers, retry later)

### **Optimistic UI**

- Update UI immediately (optimistic)
- Call API in background
- On success: keep UI state
- On error: rollback + show notification

### **Countdown Timer Implementation** (NextQuizCountdown.tsx)

- Updates every 1s if <1h remaining, every 60s if >1h
- Display: "5h 23m" (hours), "23m 45s" (minutes), "New quiz available!" (expired)
- Auto-enables "New Quiz" button on expiration via onExpire() callback

---

## **Appendix G: Database Schema**

**Tables:**

1. **progress**: `userId`, `wordId`, `nextReview`, `lapseCount`, `confidence`, `studyCount`, `correctCount`, `currentDelay` | Index: `(userId, nextReview)` | Unique: `(userId, wordId)`
2. **quiz_session**: `userId`, `status`, `currentIndex`, `startedAt`, `expiresAt`, `completedAt` | Index: `(userId, status)`, `(expiresAt)`
3. **quiz_session_question**: `sessionId`, `wordId`, `questionIndex`, `questionType`, `correctAnswer`, `hanzi`, `pinyin`, `english`, `traditional`, `options` | FK: `sessionId → quiz_session` | Unique: `(sessionId, questionIndex)`
4. **quiz_session_answer**: `sessionId`, `questionId`, `userId`, `wordId`, `userAnswer`, `correct`, `timeSpentMs`, `lapseCount`, `isLeech`, `nextReviewDate` | FK: `questionId → quiz_session_question` | Unique: `questionId` (one answer per question)
5. **quiz_session_summary**: `userId`, `sessionId`, `completedAt`, `totalQuestions`, `correctCount`, `incorrectCount`, `accuracyRate`, `xpEarned`, `newBadgeIds`, `mysteryBoxDrop`, `mysteryBoxType`, `freezeAwarded`, `expiresAt` | Unique: `sessionId`
6. **study_streaks**: `userId`, `currentStreak`, `longestStreak`, `freezeCount`, `lastActivityDate` | Unique: `userId`
7. **vocabulary_word**: `id`, `simplified`, `traditional`, `pinyin`, `english`, `exampleSentence` | Index: `(simplified)`, `(pinyin)` | Joined in due words query

---

## **Appendix H: Performance Considerations**

**Backend:**

- Redis caching: AI feedback (24h TTL, ~70% hit rate)
- Database indexes: `(userId, nextReview)` for fast due words query
- Session storage: PostgreSQL (QuizSession table) with 1-hour expiresAt TTL
- Server-side validation: Correct answers never exposed to client

**Frontend:**

- Unified API: Single call per answer (includes AI feedback)
- Hook architecture: `useQuizSession`, `useAnswerSubmission`, `useGamificationCapture`
- Service layer: `quizTransformers` for data transformation
- Optimistic updates: Immediate UI feedback (single-batch state update)

---

**Document Purpose**: Reference for developers maintaining quiz feature
**Last Updated**: March 14, 2026
