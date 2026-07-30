/**
 * IMEQuestionView.tsx
 * IME Simulator Quiz — IME-specific question display
 *
 * Shows meaning clue + IME text input for character typing.
 * Story 21.18: Added phonetic hint display and radical hint toggle.
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { useQuizSessionStore } from "../../stores/quizSessionStore";
import { getRadicalHint } from "../../services/hintService";
import { Button, Input, Box } from "shared/components";
import "./IMEQuestionView.css";

export function IMEQuestionView() {
  const inputRef = useRef<HTMLInputElement>(null);
  const currentIndex = useQuizSessionStore((s) => s.currentIndex);
  const questions = useQuizSessionStore((s) => s.questions);
  const question = questions[currentIndex];
  const hintsRemaining = useQuizSessionStore((s) => s.hintsRemaining);
  const showRadicalHint = useQuizSessionStore((s) => s.showRadicalHint);
  const currentPhoneticHint = useQuizSessionStore((s) => s.currentPhoneticHint);
  const consumeHint = useQuizSessionStore((s) => s.useHint);
  const applyRadicalPenalty = useQuizSessionStore((s) => s.applyRadicalPenalty);
  const [inputValue, setInputValue] = useState("");
  const [radicalHintData, setRadicalHintData] = useState<{
    glyph: string;
    meaning: string;
  } | null>(null);
  const [radicalLoading, setRadicalLoading] = useState(false);

  // Load radical hint data when user requests it
  useEffect(() => {
    if (showRadicalHint && question?.character && !radicalHintData && !radicalLoading) {
      setRadicalLoading(true);
      getRadicalHint(question.character)
        .then((data) => {
          setRadicalHintData(data);
          setRadicalLoading(false);
        })
        .catch(() => setRadicalLoading(false));
    }
  }, [showRadicalHint, question?.character, radicalHintData, radicalLoading]);

  useEffect(() => {
    setInputValue("");
    setRadicalHintData(null);
    if (inputRef.current) inputRef.current.focus();
  }, [currentIndex]);

  const handleSubmit = useCallback(() => {
    if (!inputValue.trim()) return;
    useQuizSessionStore.getState().submitAnswer(inputValue.trim(), 0);
  }, [inputValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSubmit();
    },
    [handleSubmit],
  );

  const handleRadicalHint = useCallback(() => {
    if (hintsRemaining <= 0) return;
    consumeHint();
    applyRadicalPenalty();
  }, [hintsRemaining, consumeHint, applyRadicalPenalty]);

  if (!question) {
    return (
      <Box variant="dark" padding="md">
        No question available
      </Box>
    );
  }

  return (
    <div className="ime-quiz-question mx-auto flex-col gap-xl">
      {/* Clue — meaning only */}
      <Box
        variant="surface"
        padding="xl"
        className="ime-quiz-question__clue radius-lg flex-col gap-md text-center"
      >
        <p className="ime-quiz-question__clue-label font-xs text-muted text-uppercase m-0 tracking-wide">
          Meaning
        </p>
        <p className="font-3xl fw-700 text-accent lh-tight">{question.meaning ?? "—"}</p>
      </Box>

      {/* IME Input */}
      <Box
        variant="elevated"
        padding="md"
        className="ime-quiz-question__input-area outline-none flex-col gap-md text-primary font-4xl w-full text-center"
      >
        <Input
          ref={inputRef}
          className="ime-quiz-question__input focus-ring"
          lang="zh"
          inputMode="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type character here..."
          autoComplete="off"
        />
        <p className="ime-quiz-question__steps font-sm text-muted text-center lh-normal m-0">
          ① Type the pinyin using your IME keyboard
          <br />② Select the correct character from IME candidates
        </p>
      </Box>

      <Button
        variant="primary"
        className="ime-quiz-question__submit w-full"
        onClick={handleSubmit}
        disabled={!inputValue.trim()}
      >
        Submit Answer
      </Button>

      {/* ─── Hint system (Story 21.18) ──────────────────────────── */}

      {/* Phonetic hint from previous wrong answer */}
      {currentPhoneticHint && (
        <Box variant="dark" padding="sm" className="ime-quiz-question__phonetic-hint w-full">
          {currentPhoneticHint.data ? (
            <p className="font-sm text-secondary m-0 lh-normal">
              💡 <strong>Hint:</strong> This character contains phonetic component{" "}
              <strong>{currentPhoneticHint.data.glyph}</strong> (pinyin:{" "}
              <strong>{currentPhoneticHint.data.pinyin}</strong>, meaning:{" "}
              <strong>{currentPhoneticHint.data.meaning}</strong>). Try to connect the sound!
            </p>
          ) : (
            <p className="font-sm text-secondary m-0 lh-normal">
              💡 This character doesn&apos;t have a phonetic component — try memorizing it by its
              visual structure.
            </p>
          )}
        </Box>
      )}

      {/* Hint pool indicator + radical hint toggle */}
      <div className="ime-quiz-question__hint-toggle flex-between w-full gap-md">
        <span className="font-sm text-muted">
          💡 x{hintsRemaining} hint{hintsRemaining !== 1 ? "s" : ""} remaining
        </span>

        {hintsRemaining > 0 && !showRadicalHint && (
          <button
            className="ime-quiz-question__radical-hint-btn font-sm text-accent bg-transparent ime-quiz-hint-toggle p-0"
            onClick={handleRadicalHint}
            type="button"
            aria-label="Show radical hint (consumes one hint, -5% penalty)"
          >
            🔍 Show radical hint
          </button>
        )}
      </div>

      {/* Radical hint content */}
      {showRadicalHint && (
        <Box variant="dark" padding="sm" className="ime-quiz-question__radical-hint w-full">
          {radicalLoading ? (
            <p className="font-sm text-muted m-0">Loading radical hint...</p>
          ) : radicalHintData ? (
            <p className="font-sm text-secondary m-0 lh-normal">
              🔍 <strong>Radical:</strong> {radicalHintData.glyph} — {radicalHintData.meaning}
              <span className="text-warning font-xs ime-quiz-penalty-label">
                (-5% penalty applied)
              </span>
            </p>
          ) : (
            <p className="font-sm text-muted m-0">No radical data available for this character.</p>
          )}
        </Box>
      )}
    </div>
  );
}
