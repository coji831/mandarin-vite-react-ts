# Implementation 15-11: Feature Extensions & Future Adaptability

## Technical Scope

Implement multi-meaning word support, pinyin IME-style conversion, quiz result retention, UI component migration, and architectural hooks for future quiz enhan cements. Addresses note.md items: 10, 11, 13, 14, 15, 19, 23, 26, 27.

**Files Modified:**

- `apps/frontend/src/features/quiz/utils/validation.ts` - Multi-meaning parsing, character variation handling
- `apps/frontend/src/features/quiz/utils/pinyinConverter.ts` - Tone number to tone mark conversion (new)
- `apps/frontend/src/features/quiz/components/QuizCard.tsx` - Display acceptable answers
- `apps/frontend/src/features/quiz/components/TypeAnswerInput.tsx` - Pinyin auto-conversion, migrate to common Input
- `apps/frontend/src/features/quiz/components/ToneInput.tsx` - Pinyin auto-conversion, migrate to common Input
- `apps/frontend/src/features/quiz/components/QuizComplete.tsx` - Multi-meaning results display, redo/refresh buttons
- `apps/frontend/src/features/quiz/containers/DailyReviewQuiz.tsx` - Result retention, restart logic
- `apps/frontend/src/features/quiz/components/QuizProgressBar.tsx` - Migrate to common ProgressBar
- `apps/frontend/src/features/quiz/providers/QuizFilterProvider.tsx` - Filter interface (new)
- `apps/frontend/src/features/quiz/providers/DistractorGenerator.ts` - Generator interface (new)
- `apps/frontend/src/features/quiz/providers/FeedbackProvider.tsx` - Feedback abstraction (new)
- `apps/frontend/src/components/ui/Button.tsx` - Add quiz-specific variants
- `apps/frontend/src/components/ui/Input.tsx` - Add pinyin conversion support
- `apps/frontend/src/components/ui/ProgressBar.tsx` - Add step indicator support
- `docs/migrations/mandarin-to-learning-rename.md` - Folder rename plan (new)

## Implementation Details

### 1. Multi-Meaning Word Parsing

```typescript
// apps/frontend/src/features/quiz/utils/validation.ts

export interface ParsedWord {
  chinese: string;
  pinyin: string[];
  meanings: string[];
  characterVariants: string[];
}

/**
 * Parse CSV word entry to extract all acceptable answer forms
 * Handles: 白(形), 爸爸｜爸, "differ from; bad; short of"
 */
export function parseWordEntry(entry: {
  chinese: string;
  pinyin: string;
  english: string;
}): ParsedWord {
  // Extract character variants from parenthetical annotations and pipes
  const chineseClean = entry.chinese.replace(/[（(].*?[)）]/g, "").trim();
  const characterVariants =
    entry.chinese.includes("｜") || entry.chinese.includes("|")
      ? entry.chinese.split(/[｜|]/).map((v) => v.replace(/[（(].*?[)）]/g, "").trim())
      : [chineseClean];

  // Split pinyin by spaces for multi-character words
  const pinyinVariants = entry.pinyin.split(/\s+/);

  // Split English meanings by semicolons or commas
  const meanings = entry.english
    .split(/[;；,，]/)
    .map((m) => m.trim())
    .filter((m) => m.length > 0);

  return {
    chinese: chineseClean,
    pinyin: pinyinVariants,
    meanings,
    characterVariants,
  };
}

/**
 * Normalize pinyin for comparison (remove spaces, tone marks)
 */
export function normalizePinyin(pinyin: string): string {
  const toneMap: Record<string, string> = {
    ā: "a",
    á: "a",
    ǎ: "a",
    à: "a",
    ē: "e",
    é: "e",
    ě: "e",
    è: "e",
    ī: "i",
    í: "i",
    ǐ: "i",
    ì: "i",
    ō: "o",
    ó: "o",
    ǒ: "o",
    ò: "o",
    ū: "u",
    ú: "u",
    ǔ: "u",
    ù: "u",
    ǖ: "ü",
    ǘ: "ü",
    ǚ: "ü",
    ǜ: "ü",
  };

  let normalized = pinyin.toLowerCase();
  Object.entries(toneMap).forEach(([accented, plain]) => {
    normalized = normalized.replace(new RegExp(accented, "g"), plain);
  });

  return normalized.replace(/\s+/g, ""); // Remove all spaces
}

/**
 * Validate user answer against parsed word (accepts ANY acceptable form)
 */
export function validateAnswer(
  userAnswer: string,
  parsedWord: ParsedWord,
  questionType: "pinyin" | "hanzi" | "meaning",
): { isCorrect: boolean; matchedVariant?: string } {
  const normalizedAnswer = normalizePinyin(userAnswer.trim());

  if (questionType === "pinyin") {
    // Check if answer matches any pinyin variant
    for (const variant of parsedWord.pinyin) {
      if (normalizePinyin(variant) === normalizedAnswer) {
        return { isCorrect: true, matchedVariant: variant };
      }
    }
  } else if (questionType === "hanzi") {
    // Check if answer matches any character variant
    for (const variant of parsedWord.characterVariants) {
      if (variant === userAnswer.trim()) {
        return { isCorrect: true, matchedVariant: variant };
      }
    }
  } else if (questionType === "meaning") {
    // Check if answer matches any meaning (case-insensitive)
    const lowerAnswer = userAnswer.trim().toLowerCase();
    for (const meaning of parsedWord.meanings) {
      if (
        meaning.toLowerCase().includes(lowerAnswer) ||
        lowerAnswer.includes(meaning.toLowerCase())
      ) {
        return { isCorrect: true, matchedVariant: meaning };
      }
    }
  }

  return { isCorrect: false };
}
```

### 2. Display Acceptable Answers in Quiz

```tsx
// QuizCard.tsx - Show all acceptable forms
export function QuizCard({ question, mode, onAnswer }: QuizCardProps) {
  const parsedWord = parseWordEntry(question);

  return (
    <div className="quiz-card">
      <div className="question-prompt">
        {mode === "type_pinyin" && (
          <>
            <p className="chinese-display">{parsedWord.chinese}</p>
            {parsedWord.meanings.length > 1 && (
              <p className="acceptable-answers">
                Acceptable answers: {parsedWord.meanings.join(", ")}
              </p>
            )}
          </>
        )}
        {mode === "type_character" && (
          <>
            <p className="pinyin-display">{parsedWord.pinyin.join(" ")}</p>
            {parsedWord.characterVariants.length > 1 && (
              <p className="acceptable-answers">
                Acceptable: {parsedWord.characterVariants.join(", ")}
              </p>
            )}
          </>
        )}
      </div>
      <TypeAnswerInput question={question} onAnswer={onAnswer} />
    </div>
  );
}
```

### 3. Pinyin IME-Style Auto-Conversion

```typescript
// apps/frontend/src/features/quiz/utils/pinyinConverter.ts

const TONE_MAP: Record<string, Record<string, string>> = {
  a: { "1": "ā", "2": "á", "3": "ǎ", "4": "à" },
  e: { "1": "ē", "2": "é", "3": "ě", "4": "è" },
  i: { "1": "ī", "2": "í", "3": "ǐ", "4": "ì" },
  o: { "1": "ō", "2": "ó", "3": "ǒ", "4": "ò" },
  u: { "1": "ū", "2": "ú", "3": "ǔ", "4": "ù" },
  ü: { "1": "ǖ", "2": "ǘ", "3": "ǚ", "4": "ǜ" },
};

/**
 * Convert pinyin with tone numbers to tone marks
 * Examples: "ma3" → "mǎ", "ni3hao3" → "nǐhǎo"
 *
 * Vowel priority (Mandarin phonetics standard):
 * 1. If 'a' or 'e' present, mark that vowel
 * 2. Otherwise mark 'o'
 * 3. For 'iu', mark 'u'; for 'ui', mark 'i'
 * 4. Otherwise mark last vowel
 */
export function convertPinyinToToneMarks(input: string): string {
  return input.replace(/([a-zü]+)([1-4])/gi, (match, syllable, tone) => {
    const lower = syllable.toLowerCase();

    // Vowel priority rules
    let targetVowel: string | undefined;

    if (lower.includes("a")) targetVowel = "a";
    else if (lower.includes("e")) targetVowel = "e";
    else if (lower.includes("o")) targetVowel = "o";
    else if (lower.includes("iu")) targetVowel = "u";
    else if (lower.includes("ui")) targetVowel = "i";
    else targetVowel = lower.match(/[iuü]/)?.[0];

    if (!targetVowel || !TONE_MAP[targetVowel]) return match;

    const toneChar = TONE_MAP[targetVowel][tone];
    const isUpperCase =
      syllable[syllable.toLowerCase().indexOf(targetVowel)] ===
      syllable[syllable.toLowerCase().indexOf(targetVowel)].toUpperCase();
    const finalToneChar = isUpperCase ? toneChar.toUpperCase() : toneChar;

    return syllable.replace(new RegExp(targetVowel, "i"), finalToneChar);
  });
}
```

```tsx
// TypeAnswerInput.tsx - Apply conversion with common Input component
import { Input } from "@/components/ui/Input";
import { convertPinyinToToneMarks } from "../utils/pinyinConverter";

export function TypeAnswerInput({ question, onAnswer }: Props) {
  const [rawInput, setRawInput] = useState("");
  const [displayValue, setDisplayValue] = useState("");

  const handleChange = (value: string) => {
    setRawInput(value);

    try {
      const converted = convertPinyinToToneMarks(value);
      setDisplayValue(converted);
    } catch {
      setDisplayValue(value); // Fallback to raw input
    }
  };

  return (
    <Input
      value={displayValue}
      onChange={handleChange}
      placeholder="Type pinyin with tone numbers (e.g., ma3)"
      variant="quiz"
      autoComplete="off"
    />
  );
}
```

### 4. Quiz Result Retention with Redo/Refresh

```tsx
// DailyReviewQuiz.tsx - Store results in localStorage
useEffect(() => {
  if (state.phase === "QUIZ_COMPLETE") {
    const quizResults = {
      timestamp: Date.now(),
      questions: state.questions,
      answers: state.answers,
      correctCount: state.answers.filter((a) => a.correct).length,
      totalCount: state.answers.length,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };

    localStorage.setItem("lastQuizResults", JSON.stringify(quizResults));
  }
}, [state.phase]);

const handleRestart = async (questionSubset?: Question[]) => {
  if (questionSubset) {
    // Redo with specific questions (review mistakes)
    dispatch({ type: "QUIZ_START", payload: { questions: questionSubset } });
  } else {
    // Fetch fresh questions from backend
    localStorage.removeItem("lastQuizResults");
    const response = await apiClient.get("/api/v1/progress/due");
    dispatch({ type: "QUIZ_START", payload: { questions: response.data } });
  }
};
```

```tsx
// QuizComplete.tsx - Add redo/refresh buttons with Button component
import { Button } from "@/components/ui/Button";

export function QuizComplete({ results, onRestart }: Props) {
  const incorrectResults = results.filter((r) => !r.correct);

  return (
    <div className="quiz-complete">
      <h2>Quiz Complete!</h2>
      <ResultsTable results={results} />

      <div className="action-buttons">
        <Button
          variant="secondary"
          onClick={() => onRestart(incorrectResults.map((r) => r.question))}
          disabled={incorrectResults.length === 0}
        >
          📝 Review Mistakes ({incorrectResults.length})
        </Button>

        <Button variant="primary" onClick={() => onRestart()}>
          ✨ New Quiz
        </Button>
      </div>
    </div>
  );
}
```

### 5. UI Component Migration

```tsx
// apps/frontend/src/components/ui/Button.tsx - Add quiz variants
export interface ButtonProps {
  variant?: "primary" | "secondary" | "quiz-submit" | "quiz-next" | "hint";
  // ... other props
}

const variantStyles = {
  "quiz-submit": "bg-gradient-to-r from-purple-500 to-purple-700",
  "quiz-next": "bg-gradient-to-r from-pink-500 to-red-500",
  hint: "bg-yellow-100 text-yellow-800 border border-yellow-300",
};
```

```tsx
// apps/frontend/src/components/ui/Input.tsx - Add pinyin conversion support
export interface InputProps {
  variant?: "default" | "quiz";
  enablePinyinConversion?: boolean;
  // ... other props
}

export function Input({
  variant = "default",
  enablePinyinConversion = false,
  onChange,
  ...props
}: InputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    if (enablePinyinConversion) {
      value = convertPinyinToToneMarks(value);
    }

    onChange?.(value);
  };

  return <input onChange={handleChange} {...props} />;
}
```

### 6. Future Architecture - Quiz Filter Provider

```tsx
// apps/frontend/src/features/quiz/providers/QuizFilterProvider.tsx

/**
 * Interface for filtering quiz questions by criteria
 *
 * Future Implementation (Epic 17: Knowledge Hub):
 * - HSK level filtering (1-6, 7-9)
 * - Topic filtering (food, travel, business)
 * - Interest-based filtering (user-selected topics)
 * - Difficulty-based filtering (SRS metrics)
 *
 * Current: Returns all questions unfiltered
 */
export interface QuizFilter {
  hskLevel?: number[];
  topics?: string[];
  interests?: string[];
  difficulty?: "easy" | "medium" | "hard";
  excludeLeeches?: boolean;
}

export interface QuizFilterProvider {
  applyFilter(questions: Question[], filter: QuizFilter): Question[];
  getAvailableFilters(): Promise<{
    hskLevels: number[];
    topics: string[];
    difficulties: string[];
  }>;
}

/**
 * Default implementation - no filtering
 * Override with Epic 17 implementation when ready
 */
export class DefaultQuizFilterProvider implements QuizFilterProvider {
  applyFilter(questions: Question[], filter: QuizFilter): Question[] {
    // TODO: Epic 17 - Implement HSK level filtering
    // TODO: Epic 17 - Implement topic filtering
    // TODO: Epic 17 - Implement interest filtering
    return questions; // No filtering for now
  }

  async getAvailableFilters() {
    return {
      hskLevels: [1, 2, 3, 4, 5, 6],
      topics: [],
      difficulties: ["easy", "medium", "hard"],
    };
  }
}
```

### 7. Future Architecture - Distractor Generator

```typescript
// apps/frontend/src/features/quiz/providers/DistractorGenerator.ts

/**
 * Interface for generating plausible wrong answers (distractors)
 *
 * Future Implementation (Epic 17: Knowledge Hub):
 * - Similar tone distractors: 妈 mā → 马 mǎ, 麻 má
 * - Similar character distractors: 太 → 大, 木 → 本
 * - Similar meaning distractors: 大 (big) → 多 (many)
 *
 * Current: Returns empty array (manual distractors from CSV)
 */
export interface DistractorOptions {
  type: "similar-tone" | "similar-character" | "similar-meaning";
  count: number;
  difficulty?: "easy" | "hard"; // Easy = very different, hard = very similar
}

export interface DistractorGenerator {
  generate(correctAnswer: Question, options: DistractorOptions): Promise<string[]>;

  validateDistractors(distractors: string[], correctAnswer: string): boolean;
}

/**
 * Default implementation - returns empty (use CSV distractors)
 * Override with Epic 17 algorithm when ready
 */
export class DefaultDistractorGenerator implements DistractorGenerator {
  async generate(correctAnswer: Question, options: DistractorOptions): Promise<string[]> {
    // TODO: Epic 17 - Implement tone-based generation
    // TODO: Epic 17 - Implement character-based generation
    // TODO: Epic 17 - Implement meaning-based generation
    return []; // Use CSV distractors for now
  }

  validateDistractors(distractors: string[], correctAnswer: string): boolean {
    return !distractors.includes(correctAnswer);
  }
}
```

### 8. Future Architecture - Feedback Provider Abstraction

```tsx
// apps/frontend/src/features/quiz/providers/FeedbackProvider.tsx

/**
 * Strategy pattern for quiz feedback sources
 * Allows switching between AI-generated and pre-generated feedback
 */
export interface FeedbackResult {
  errorType: "tone" | "character" | "meaning" | "generic";
  explanation: string;
  source: "ai" | "database";
  cached: boolean;
}

export interface FeedbackProvider {
  getFeedback(
    word: Question,
    userAnswer: string,
    correctAnswer: string,
    questionType: string,
  ): Promise<FeedbackResult>;

  cacheFeedback?(key: string, feedback: FeedbackResult): Promise<void>;
}

/**
 * AI-based feedback (current implementation)
 */
export class AIFeedbackProvider implements FeedbackProvider {
  async getFeedback(word, userAnswer, correctAnswer, questionType): Promise<FeedbackResult> {
    const response = await apiClient.post("/api/v1/gamification/ai-feedback", {
      word,
      userAnswer,
      correctAnswer,
      questionType,
    });

    return {
      ...response.data,
      source: "ai",
      cached: false,
    };
  }
}

/**
 * Database-based feedback (future: reduce API costs)
 */
export class DatabaseFeedbackProvider implements FeedbackProvider {
  async getFeedback(word, userAnswer, correctAnswer, questionType): Promise<FeedbackResult> {
    // TODO: Epic 17 - Query pre-generated feedback database
    // Check common mistakes table for matching pattern
    // Fallback to AI if not found
    throw new Error("Not implemented - use AIFeedbackProvider");
  }
}

/**
 * Hybrid provider (checks database first, falls back to AI)
 */
export class HybridFeedbackProvider implements FeedbackProvider {
  constructor(
    private dbProvider: DatabaseFeedbackProvider,
    private aiProvider: AIFeedbackProvider,
  ) {}

  async getFeedback(word, userAnswer, correctAnswer, questionType): Promise<FeedbackResult> {
    try {
      return await this.dbProvider.getFeedback(word, userAnswer, correctAnswer, questionType);
    } catch {
      return await this.aiProvider.getFeedback(word, userAnswer, correctAnswer, questionType);
    }
  }
}
```

### 9. Folder Rename Planning Document

```markdown
<!-- docs/migrations/mandarin-to-learning-rename.md -->

# Folder Rename Migration: /mandarin → /learning

## Overview

Rename `/src/features/mandarin` to `/src/features/learning` to support future multi-language expansion (Japanese, Korean, Spanish, etc.).

## Impacted Files Count

- Feature folder: `src/features/mandarin/` → `src/features/learning/`
- Import count: ~120 import statements across 45 files
- Type definitions: `@types/mandarin.d.ts` → `@types/learning.d.ts`
- Route constants: `/mandarin/*` → `/learning/*`

## Import Map

| Old Path                    | New Path                    |
| --------------------------- | --------------------------- |
| `src/features/mandarin/`    | `src/features/learning/`    |
| `@mandarin/shared-types`    | `@learning/shared-types`    |
| `ROUTE_PATTERNS.MANDARIN_*` | `ROUTE_PATTERNS.LEARNING_*` |

## Migration Steps (Zero-Downtime)

1. **Phase 1**: Add path alias `@learning` pointing to `mandarin/` (no file moves)
2. **Phase 2**: Update all imports incrementally to use `@learning` alias
3. **Phase 3**: Rename physical folder after all imports updated
4. **Phase 4**: Update route constants and URL patterns
5. **Phase 5**: Remove old `@mandarin` alias

## Testing Checklist

- [ ] All TypeScript imports resolve correctly
- [ ] All route navigation works (Dashboard, Quiz, Lists)
- [ ] No 404 errors on page refresh
- [ ] Build succeeds without warnings
- [ ] E2E tests pass

## Execution Timeline

**Status**: Documented, not executed
**Planned**: Epic 16 (separate migration story)
**Estimated Effort**: 4 hours (2 hours migration + 2 hours testing)

## Rollback Plan

If issues found:

1. Revert import changes (Git revert)
2. Restore old path alias
3. Test in staging before production deploy
```

## Technical Challenges & Solutions

### Challenge 1: Multi-Meaning Word Validation

**Problem:** Words like 花 (huā - flower, huā - spend) and 行 (xíng - walk, háng - row) failed validation because CSV format uses semicolons and parenthetical annotations.

**Solution:** Created `parseWordEntry()` that extracts all meanings from semicolon/comma-separated strings; validation accepts ANY matching variant; display shows "Acceptable: meaning1, meaning2".

**Impact:** Supports complete HSK vocabulary; reduces false negatives; improves learner confidence.

---

### Challenge 2: Pinyin Conversion Vowel Priority

**Problem:** Mandarin phonetics has specific rules for tone mark placement (a > e > o, special cases for iu/ui); naive implementation placed marks on wrong vowels.

**Solution:** Implemented standard Mandarin tone placement rules in `convertPinyinToToneMarks()`; handles special cases ("iu" marks 'u', "ui" marks 'i'); preserves case for capitalized syllables.

**Impact:** Accurate IME-style conversion matching learner expectations.

---

### Challenge 3: UI Component Migration Without Breaking Changes

**Problem:** Quiz components have specific styling and behavior (loading states, quiz-submit variant) not present in common UI library.

**Solution:** Extended common components with quiz-specific variants; added `enablePinyinConversion` prop to Input; maintained backward compatibility with existing quiz components.

**Impact:** Consistent UI across app; easier maintenance; no visual regressions.

---

### Challenge 4: Future Architecture Without Over-Engineering

**Problem:** Need extensibility for Epic 17 features without implementing full functionality now (YAGNI principle).

**Solution:** Defined interfaces with TSDoc explaining future use; default implementations return empty/unfiltered results; clear TODO comments mark expansion points.

**Impact:** Zero runtime overhead; clear contract for future developers; no premature optimization.

---

**Related Documentation:**

- [Story 15.11 BR](../../business-requirements/epic-15-learning-retention/story-15-11-feature-extensions.md)
- [Story 15.10 Implementation](./story-15-10-quiz-ux-polish.md) (Prerequisite: UX foundation)
- [Epic 15 Implementation](./README.md)
