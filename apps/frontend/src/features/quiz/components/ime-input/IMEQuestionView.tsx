/**
 * IMEQuestionView.tsx
 * IME Simulator Quiz — IME-specific question display
 *
 * Shows meaning clue + IME text input for character typing.
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { useQuizSessionStore } from "../../stores/quizSessionStore";
import { Button, Input, Box } from "shared/components";
import "./IMEQuestionView.css";

export function IMEQuestionView() {
  const inputRef = useRef<HTMLInputElement>(null);
  const currentIndex = useQuizSessionStore((s) => s.currentIndex);
  const questions = useQuizSessionStore((s) => s.questions);
  const question = questions[currentIndex];
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    setInputValue("");
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
    </div>
  );
}
