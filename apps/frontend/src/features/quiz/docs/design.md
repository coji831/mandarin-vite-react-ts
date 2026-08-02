# Feature: Quiz — Design Spec

**Last Updated:** 2026-07-01
**Status:** Reviewed

---

## Figma Reference

- **File:** (not yet linked — add Figma file URL here)
- **Frame:** Quiz Session (Wireframe Section 4.6)

---

## Layout

Quiz sessions use a single-page pattern with phase-based routing. All quiz types go through the same page and are distinguished by `?type=` query parameter.

| Route                             | Component         | Purpose                         |
| --------------------------------- | ----------------- | ------------------------------- |
| `/practices/quiz?type=<strategy>` | `QuizSessionPage` | Active quiz session             |
| `/practices/quiz`                 | `QuizPage`        | Fallback — no strategy selected |

---

## Architecture (Strategy Pattern)

The quiz system uses the **Strategy Pattern**:

- `QuizStrategy` interface in `types/engine.ts` defines the contract
- Strategies registered in `engine/strategies/quizStrategyRegistry.ts`:
  - `audio-to-pinyin-tone`, `ime-simulator`, `radical-gate`
- Each strategy implements `generateQuestions()` and `evaluateAnswer()`
- **Note:** `audio-to-type` and `pinyin-to-char` are **not** registered strategies — the registry contains only the three above. The tone-sandhi drill (`SandhiDrill`) is a **foundations widget** (`features/foundations/components/tones/SandhiDrill.tsx`) served by its own `GET /v1/quiz/sandhi-drill/questions` endpoint — an explicit non-registry exception, not a quiz strategy (Story 21.17)

---

## Components

| Component            | Source                                            | Notes                                                             |
| -------------------- | ------------------------------------------------- | ----------------------------------------------------------------- |
| `QuizPage`           | `pages/practices/QuizPage.tsx`                    | Entry point — routes by `?type=` param                            |
| `QuizSessionPage`    | `pages/practices/QuizSessionPage.tsx`             | Session orchestrator with header + timer + progress               |
| `QuizRouter`         | Custom in `components/`                           | Phase-based view switch (LOADING→QUESTION→INPUT→FEEDBACK→RESULTS) |
| `QuestionView`       | Custom in `components/`                           | Standard question display                                         |
| `IMEQuestionView`    | Custom in `components/ime-input/`                 | IME simulator input view                                          |
| `MultipleChoiceView` | Custom in `components/`                           | Multiple choice for radical-gate strategy                         |
| `FeedbackView`       | Custom in `components/`                           | Answer feedback with explanation                                  |
| `QuizResults`        | Custom in `components/results/`                   | End-of-quiz score summary                                         |
| `CategoryBreakdown`  | Custom in `components/results/`                   | Per-category performance breakdown                                |
| `PhaseGateBadge`     | Custom in `components/results/`                   | Phase gate pass/fail badge                                        |
| `Timer`              | Custom in `components/`                           | Countdown timer per question                                      |
| `QuizProgressBar`    | Custom (composes `shared/components/ProgressBar`) | Score progress bar with pass/fail threshold                       |
| `QuizCard`           | Custom in `components/`                           | Question card wrapper                                             |
| `AudioPlayer`        | Custom in `components/`                           | Audio playback for aural questions                                |
| `AnswerInput`        | Custom in `components/`                           | Text input for pinyin/character answers                           |
| `PinyinToneInput`    | Custom in `components/inputs/`                    | Combined pinyin + tone input                                      |

### States (phase-based routing)

| Phase      | Component                                                 | Description                            |
| ---------- | --------------------------------------------------------- | -------------------------------------- |
| `LOADING`  | Spinner                                                   | Fetching questions from backend        |
| `QUESTION` | `QuestionView` / `IMEQuestionView` / `MultipleChoiceView` | Showing question + input               |
| `INPUT`    | Same as QUESTION                                          | (Second pass for multi-step questions) |
| `FEEDBACK` | `FeedbackView`                                            | Showing correct answer + explanation   |
| `RESULTS`  | `QuizResults`                                             | Score summary + pass/fail              |
| `ERROR`    | Error card                                                | Error message + retry button           |

---

## Shared Components Reused

| Component     | Source                          |
| ------------- | ------------------------------- |
| `Button`      | `shared/components/Button`      |
| `ProgressBar` | `shared/components/ProgressBar` |

---

## Design Tokens Used

### Colors

| Token   | CSS Variable       | Usage                             |
| ------- | ------------------ | --------------------------------- |
| Success | `--color-success`  | Correct answer indicator          |
| Error   | `--color-error`    | Wrong answer indicator            |
| Primary | `--color-primary`  | Interactive elements, phase badge |
| Warning | `--color-warning`  | Timer warning state               |
| —       | `--text-primary`   | Question text                     |
| —       | `--text-secondary` | Instructions, hints               |
| —       | `--surface-dark`   | Card backgrounds                  |

### Typography

| Element         | Class             | Size      |
| --------------- | ----------------- | --------- |
| Question        | `.font-lg`        | 16px      |
| Character glyph | `.font-4xl`+      | 36px+     |
| Timer           | `.font-xl fw-700` | 20px bold |
| Score           | `.font-xl`        | 20px      |

### Layout Classes

| Class                             | Usage                                             |
| --------------------------------- | ------------------------------------------------- |
| `.quiz-session-page`              | Page wrapper; `max-width: 700px` (defined in CSS) |
| `Box variant="dark"`              | Card surface for header, progress, quiz cards     |
| `.flex-col-center`                | Centered column                                   |
| `.gap-md` / `.gap-lg` / `.gap-xl` | Flex gaps                                         |
| `.p-xl`                           | Page padding                                      |

---

## Visual Acceptance Criteria

- [ ] Loading state shows spinner with "Loading quiz..." text
- [ ] Question view shows character/info + input area + timer + progress bar
- [ ] IME question shows IME input simulation
- [ ] Feedback view shows correct/incorrect + explanation
- [ ] Results view shows score, pass/fail badge, category breakdown
- [ ] Timer visually warns when time is low
- [ ] All colors reference CSS variables
- [ ] WCAG AA contrast ratios
- [ ] ARIA labels on all interactive elements
- [ ] Keyboard navigable (Tab, Enter, number keys for options)
- [ ] Verified via Playwright browser screenshot
