/**
 * IMEQuestionView.tsx
 * IME Simulator Quiz — IME-specific question display
 *
 * Shows meaning clue + IME text input for character typing.
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { useQuizSessionStore } from "../../stores/quizSessionStore";
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
    return <div className="card-dark">No question available</div>;
  }

  return (
    <div className="ime-quiz-question">
      {/* Clue — meaning only */}
      <div className="ime-quiz-question__clue">
        <p className="ime-quiz-question__clue-label">Meaning</p>
        <p className="ime-quiz-question__clue-meaning">{question.meaning ?? "\u2014"}</p>
      </div>

      {/* IME Input */}
      <div className="ime-quiz-question__input-area">
        <input
          ref={inputRef}
          className="ime-quiz-question__input"
          type="text"
          lang="zh"
          inputMode="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type character here..."
          autoComplete="off"
        />
        <p className="ime-quiz-question__steps">
          ① Type the pinyin using your IME keyboard
          <br />② Select the correct character from IME candidates
        </p>
      </div>

      <button
        className="btn-primary ime-quiz-question__submit"
        onClick={handleSubmit}
        disabled={!inputValue.trim()}
      >
        Submit Answer
      </button>
    </div>
  );
}
