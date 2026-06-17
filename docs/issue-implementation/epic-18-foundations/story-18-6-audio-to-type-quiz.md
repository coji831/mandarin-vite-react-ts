# Implementation 18-6: Audio-to-Type Quiz (Phase 1 Gate)

> Template note: headings include markers like `[Required]` and `[Optional]` to indicate guidance. When creating published/read docs, remove those bracketed tokens from the headings.

## Technical Scope

Build the Audio-to-Type quiz page with 20-question flow, backend API integration for QuizAttempt and PhaseGate, and results breakdown.

**Files to create (frontend):**

- `apps/frontend/src/features/foundations/components/Phase1QuizPage.tsx` — main quiz page
- `apps/frontend/src/features/foundations/components/QuizQuestion.tsx` — single question display (audio + inputs)
- `apps/frontend/src/features/foundations/components/AudioPlayer.tsx` — play/replay audio button
- `apps/frontend/src/features/foundations/components/PinyinInput.tsx` — text input for pinyin
- `apps/frontend/src/features/foundations/components/ToneSelector.tsx` — 5 tone buttons
- `apps/frontend/src/features/foundations/components/FeedbackDisplay.tsx` — correct/incorrect overlay
- `apps/frontend/src/features/foundations/components/QuizProgressBar.tsx` — score vs target bar
- `apps/frontend/src/features/foundations/components/QuizResultsScreen.tsx` — pass/fail with breakdown
- `apps/frontend/src/features/foundations/components/CategoryBreakdown.tsx` — 4-category chart
- `apps/frontend/src/features/foundations/hooks/useQuizEngine.ts` — quiz state machine
- `apps/frontend/src/features/foundations/services/quizService.ts` — backend API calls

**Files to create (backend):**

- `apps/backend/src/modules/progression/api/ProgressionController.js` — HTTP handlers
- `apps/backend/src/modules/progression/api/progressionRoutes.js` — route definitions
- `apps/backend/src/modules/progression/services/ProgressionService.js` — business logic
- `apps/backend/src/modules/progression/repositories/ProgressionRepository.js` — Prisma access
- `apps/backend/src/modules/progression/domain/entities/FoundationProgress.js`
- `apps/backend/src/modules/progression/domain/entities/QuizAttempt.js`
- `apps/backend/src/modules/progression/domain/entities/PhaseGate.js`
- `apps/backend/src/modules/progression/domain/interfaces/IProgressionRepository.js`
- `apps/backend/src/modules/progression/index.js` — barrel exports

**Prisma schema updates:**

- Add FoundationProgress, QuizAttempt, PhaseGate models (see epic Impl for exact schemas)

**Files to update:**

- `apps/frontend/src/router/PracticesRoutes.tsx` — add quiz type routing
- `apps/backend/src/app/container.js` — register ProgressionController + ProgressionService
- `apps/backend/src/app/routes.js` — mount progression routes

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

```
Problem: Quiz questions need both audio and text content. Audio generation via TTS is async
and may have latency.
Solution: Pre-generate and cache common pinyin combination audio. On quiz start, preload
all 20 question audio files. Use loading spinner per question as fallback.

Problem: The quiz needs a question pool with categorized questions (pinyin, tones, pairs, rules).
Solution: Generate question pool from pinyin.json and tones.json data at quiz start (frontend-side).
Each question stores its category, audioKey, correctPinyin, correctTone, and distractors.
```

## Testing Implementation

- Unit test: useQuizEngine initializes with 20 questions
- Unit test: submitAnswer scores correctly (correct/incorrect)
- Unit test: ToneSelector renders 5 buttons with correct colors
- Unit test: QuizResultsScreen shows pass/fail based on score
- Integration test: POST quiz-attempt → returns attempt ID
- Integration test: PUT complete → returns score, passed status
- Integration test: Passing quiz → PhaseGate updated to phase 2
- E2E: Full quiz flow: load → answer 20 → see results
