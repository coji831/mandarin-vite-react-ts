# Implementation 18-6: Audio-to-Type Quiz (Phase 1 Gate)

> Template note: headings include markers like `[Required]` and `[Optional]` to indicate guidance. When creating published/read docs, remove those bracketed tokens from the headings.

## Technical Scope

Build the Audio-to-Type quiz page with 20-question flow, backend API integration for QuizAttempt and PhaseGate, and results breakdown.

**Files to create (frontend):**

- `apps/frontend/src/features/quiz/engine/strategies/AudioToTypeStrategy.ts` — strategy-based question generation + evaluation
- `apps/frontend/src/features/quiz/stores/quizSessionStore.ts` — Zustand store for session state
- `apps/frontend/src/features/quiz/services/quizService.ts` — backend API service
- `apps/frontend/src/features/quiz/hooks/useQuizEngine.ts` — initialization + timer
- `apps/frontend/src/features/quiz/pages/QuizSessionPage.tsx` — orchestrator page
- `apps/frontend/src/features/quiz/components/QuizRouter.tsx` — phase-based UI switch
- `apps/frontend/src/features/quiz/components/QuestionView.tsx` — question display
- `apps/frontend/src/features/quiz/components/AnswerInput.tsx` — auto-submit wrapper
- `apps/frontend/src/features/quiz/components/FeedbackView.tsx` — correct/incorrect display
- `apps/frontend/src/features/quiz/components/AudioPlayer.tsx` — audio playback
- `apps/frontend/src/features/quiz/components/QuizProgressBar.tsx` — score progress bar
- `apps/frontend/src/features/quiz/components/Timer.tsx` — countdown display
- `apps/frontend/src/features/quiz/components/inputs/PinyinToneInput.tsx` — pinyin input + tone buttons
- `apps/frontend/src/features/quiz/components/results/QuizResults.tsx` — pass/fail results
- `apps/frontend/src/features/quiz/components/results/CategoryBreakdown.tsx` — per-category scores
- `apps/frontend/src/features/quiz/components/results/PhaseGateBadge.tsx` — animated pass badge
- `apps/frontend/src/features/quiz/types/engine.ts`, `session.ts`, `api.ts` — type definitions
- `apps/frontend/src/features/quiz/index.ts` — barrel exports

**Files to create (backend):**

- `apps/backend/src/modules/quiz/api/QuizController.js` — HTTP handlers
- `apps/backend/src/modules/quiz/api/quizRoutes.js` — route definitions
- `apps/backend/src/modules/quiz/services/QuizService.js` — business logic
- `apps/backend/src/modules/quiz/repositories/QuizRepository.js` — Prisma access
- `apps/backend/src/modules/quiz/strategies/index.js` — strategy registry
- `apps/backend/src/modules/quiz/index.js` — barrel exports
- `apps/backend/src/shared/infrastructure/data/readStaticReference.js` — pool data reader

**Prisma schema updates:**

- Add FoundationProgress, QuizAttempt, PhaseGate models (see epic Impl for exact schemas)

**Files to update:**

- `apps/frontend/src/router/PracticesRoutes.tsx` — add quiz type routing
- `apps/backend/src/app/container.js` — register QuizService + QuizController
- `apps/backend/src/app/routes.js` — mount quiz routes

## Implementation Details

```typescript
// useQuizEngine.ts — Quiz state machine
type QuizState = "loading" | "answering" | "feedback" | "completed";

function useQuizEngine() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [state, setState] = useState<QuizState>("loading");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);

  // Initialize: POST /api/v1/progression/quiz-attempts
  // Generate 20 random questions from pinyin data pool

  const submitAnswer = async (pinyin: string, tone: number) => {
    const question = questions[currentIndex];
    const correct = pinyin === question.correctPinyin && tone === question.correctTone;

    // POST /api/v1/progression/quiz-attempts/:id/answers
    setAnswers(prev => [...prev, { pinyin, tone, correct }]);

    if (currentIndex < 19) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // PUT /api/v1/progression/quiz-attempts/:id/complete
      const res = await completeQuiz(attemptId!, answers);
      setResult(res);

      if (res.passed) {
        // PUT /api/v1/progression/phase-gate { phase: 2, passed: true }
        await updatePhaseGate(2);
      }
    }
  };

  return { questions, currentIndex, state, result, submitAnswer, replay: () => {...} };
}
```

```typescript
// QuizQuestion.tsx
function QuizQuestion({ question, onAnswer }: Props) {
  const [pinyin, setPinyin] = useState("");
  const [tone, setTone] = useState<number | null>(null);
  const { playAudio } = useAudioPlayback();

  useEffect(() => {
    playAudio(question.audioKey);
  }, [question.id]);

  const handleSubmit = () => {
    if (pinyin && tone !== null) {
      onAnswer(pinyin, tone);
    }
  };

  return (
    <div className="quiz-question">
      <AudioPlayer onPlay={() => playAudio(question.audioKey)} />
      <PinyinInput value={pinyin} onChange={setPinyin} />
      <ToneSelector selected={tone} onSelect={setTone} />
      <Button onClick={handleSubmit} disabled={!pinyin || tone === null}>
        Submit Answer
      </Button>
    </div>
  );
}
```

```typescript
// ToneSelector.tsx — 5 tone buttons with colors
const TONES = [
  { number: 1, label: "ˉ1st", color: "#FF4444" },
  { number: 2, label: "ˊ2nd", color: "#FF8C00" },
  { number: 3, label: "ˇ3rd", color: "#4CAF50" },
  { number: 4, label: "ˋ4th", color: "#2196F3" },
  { number: 0, label: "·0", color: "#9E9E9E" },
];

function ToneSelector({ selected, onSelect }: Props) {
  return (
    <div className="tone-selector">
      {TONES.map(tone => (
        <button
          key={tone.number}
          className={`tone-btn ${selected === tone.number ? "selected" : ""}`}
          style={{
            backgroundColor: selected === tone.number ? tone.color : "transparent",
            borderColor: tone.color,
            color: selected === tone.number ? "white" : tone.color,
          }}
          onClick={() => onSelect(tone.number)}
          aria-label={`Tone ${tone.number}: ${tone.label}`}
        >
          {tone.label}
        </button>
      ))}
    </div>
  );
}
```

```javascript
// Backend: ProgressionController.js
class ProgressionController {
  async getFoundationProgress(req, res) {
    const progress = await this.progressionService.getOrCreateFoundationProgress(req.userId);
    res.json(progress);
  }

  async markSectionCompleted(req, res) {
    const { sectionId } = req.params;
    if (!FOUNDATION_SECTIONS.includes(sectionId)) {
      return res.status(400).json({ error: "Invalid sectionId", code: "INVALID_SECTION" });
    }
    const progress = await this.progressionService.upsertFoundationProgress(
      req.userId,
      sectionId,
      true,
    );
    res.json(progress);
  }

  async createQuizAttempt(req, res) {
    const { quizType } = req.body;
    const attempt = await this.progressionService.createQuizAttempt(req.userId, quizType);
    res.status(201).json(attempt);
  }

  async submitAnswer(req, res) {
    const { id } = req.params;
    const answer = await this.progressionService.submitAnswer(id, req.body);
    res.json(answer);
  }

  async completeQuizAttempt(req, res) {
    const { id } = req.params;
    const result = await this.progressionService.completeQuizAttempt(id);
    res.json(result);
  }

  async getQuizAttempts(req, res) {
    const attempts = await this.progressionService.getUserQuizAttempts(req.userId);
    res.json(attempts);
  }

  async getPhaseGate(req, res) {
    const gate = await this.progressionService.getOrCreatePhaseGate(req.userId);
    res.json(gate);
  }

  async updatePhaseGate(req, res) {
    const gate = await this.progressionService.updatePhaseGate(req.userId, req.body);
    res.json(gate);
  }
}
```

```javascript
// Backend: progressionRoutes.js
import express from "express";
import { authenticateToken } from "../../../shared/middleware/authMiddleware.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";

const router = express.Router();

// FoundationProgress
router.get(
  "/v1/progression/foundation-progress",
  authenticateToken,
  asyncHandler((req, res) => progressionController.getFoundationProgress(req, res)),
);

router.put(
  "/v1/progression/foundation-progress/:sectionId",
  authenticateToken,
  asyncHandler((req, res) => progressionController.markSectionCompleted(req, res)),
);

// QuizAttempt
router.post(
  "/v1/progression/quiz-attempts",
  authenticateToken,
  asyncHandler((req, res) => progressionController.createQuizAttempt(req, res)),
);

router.post(
  "/v1/progression/quiz-attempts/:id/answers",
  authenticateToken,
  asyncHandler((req, res) => progressionController.submitAnswer(req, res)),
);

router.put(
  "/v1/progression/quiz-attempts/:id/complete",
  authenticateToken,
  asyncHandler((req, res) => progressionController.completeQuizAttempt(req, res)),
);

router.get(
  "/v1/progression/quiz-attempts",
  authenticateToken,
  asyncHandler((req, res) => progressionController.getQuizAttempts(req, res)),
);

// PhaseGate
router.get(
  "/v1/progression/phase-gate",
  authenticateToken,
  asyncHandler((req, res) => progressionController.getPhaseGate(req, res)),
);

router.put(
  "/v1/progression/phase-gate",
  authenticateToken,
  asyncHandler((req, res) => progressionController.updatePhaseGate(req, res)),
);

export default router;
```

> **Note:** Actual implementation evolved to use strategy pattern (`QuizStrategy` interface + `AudioToTypeStrategy`) with Zustand store, separated from the progression module into its own quiz module. The quiz engine was extracted to `features/quiz/` (frontend) and `modules/quiz/` (backend) for cleaner module boundaries.

## Architecture Integration

```
Frontend                                              Backend
────────────────────────                              ───────────────────────
Phase1QuizPage
  ├── useQuizEngine
  │   ├── POST /api/v1/progression/quiz-attempts       → ProgressionController.createQuizAttempt
  │   ├── POST /.../:id/answers                         → ProgressionController.submitAnswer
  │   └── PUT /.../:id/complete                         → ProgressionController.completeQuizAttempt
  │
  ├── QuizQuestion
  │   ├── AudioPlayer → AudioService.playWordAudio    → Backend /v1/tts (existing)
  │   ├── PinyinInput (text input)
  │   └── ToneSelector (5 colored tone buttons)
  │
  ├── FeedbackDisplay (correct/incorrect overlay)
  ├── QuizProgressBar (score vs 90% target)
  └── QuizResultsScreen
       ├── CategoryBreakdown (4 categories)
       └── └── Pass → PUT /api/v1/progression/phase-gate → PhaseGate updated to phase 2
```

## Technical Challenges & Solutions

### Challenge 1: Architecture Evolution — Strategy Pattern

**Problem:** The initial design placed all quiz logic in the progression module. As the quiz grew complex (state machine, multiple question types, backend sync), it became clear that quiz and progression were different concerns.
**Solution:** Extracted quiz into its own `modules/quiz/` (backend) and `features/quiz/` (frontend) with a strategy pattern — `QuizStrategy` interface + `AudioToTypeStrategy` implementation. This allows future quiz types (IME Simulator, Comprehension) to be added by creating new strategy files.
**Impact:** Cleaner module boundaries, testable in isolation, open/closed principle.

### Challenge 2: Static Data to Backend-Hosted Pool

**Problem:** Questions were hardcoded as `MOCK_QUESTIONS` in the frontend strategy. The data needed to be shared across Learn (reference), Review (SRS), and Quiz (question generation).
**Solution:** Created `readStaticReference.js` — a shared utility that reads a unified `pinyin-tones-pool.json` from the local filesystem (dev) or GCS (production). All three features consume the same data through backend APIs.
**Impact:** Single source of truth, environment-agnostic (local file vs cloud storage), in-memory cached.

### Challenge 3: Prisma Schema Drift

**Problem:** The `ReviewItem` model was edited after migration generation, adding `front`, `back`, `category` fields. The database table didn't have these columns, causing 500 errors.
**Solution:** Ran `npx prisma db push` to sync the database schema with the Prisma schema file.
**Lesson:** Always run `prisma migrate dev` after schema edits to auto-generate correct migrations.

### Challenge 4: Phase Gate Double-Update

**Problem:** Both the backend `completeQuizAttempt()` and frontend `QuizResults.handlePass()` called `updatePhaseGate()`, causing a double-update that skipped Phase 2.
**Solution:** Removed the redundant frontend call — the backend already handles phase gate advancement during quiz completion.
**Impact:** Clean data flow, no duplicate state mutations.

## Implementation Status

- **Status**: Completed
- **PR**: TBD
- **Last Updated**: June 21, 2026

## Testing Implementation

- Unit test: useQuizEngine initializes with 20 questions
- Unit test: submitAnswer scores correctly (correct/incorrect)
- Unit test: ToneSelector renders 5 buttons with correct colors
- Unit test: QuizResultsScreen shows pass/fail based on score
- Integration test: POST quiz-attempt → returns attempt ID
- Integration test: PUT complete → returns score, passed status
- Integration test: Passing quiz → PhaseGate updated to phase 2
- E2E: Full quiz flow: load → answer 20 → see results
