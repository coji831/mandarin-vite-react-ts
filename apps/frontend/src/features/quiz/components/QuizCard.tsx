/**
 * QuizCard component
 *
 * Main quiz question display with 3 modes:
 * - multiple_choice: show word + pinyin, ask for meaning (4 options)
 * - type_pinyin: show word, ask for pinyin (parent provides input)
 * - type_character: show pinyin + english, ask for character (parent provides input)
 *
 * Story 15.5: Core Quiz UI Components
 */
import React from "react";
import { QuestionMode } from "../types/QuizTypes";
import styles from "./QuizCard.module.css";

interface QuizCardProps {
  question: {
    word: string;
    pinyin?: string;
    english?: string;
  };
  mode: QuestionMode;
  options?: string[]; // Required for multiple_choice mode
  onAnswer: (answer: string) => void;
}

export { QuizCard };

function QuizCard({ question, mode, options, onAnswer }: QuizCardProps) {
  const renderModeIndicator = () => {
    const labels: Record<QuestionMode, string> = {
      multiple_choice: "📝 Multiple Choice",
      type_pinyin: "🔤 Type Pinyin",
      type_character: "✏️ Type Character",
    };
    return <div className={styles.modeIndicator}>{labels[mode]}</div>;
  };

  const renderQuestion = () => {
    switch (mode) {
      case "multiple_choice":
        return (
          <div className={styles.question}>
            <h2>{question.word}</h2>
            <p className={styles.pinyin}>({question.pinyin})</p>
            <p>What does this mean?</p>
          </div>
        );
      case "type_pinyin":
        return (
          <div className={styles.question}>
            <h2>{question.word}</h2>
            <p>Type the pinyin:</p>
          </div>
        );
      case "type_character":
        return (
          <div className={styles.question}>
            <p className={styles.pinyin}>{question.pinyin}</p>
            <p>{question.english}</p>
            <p>Type the Chinese character:</p>
          </div>
        );
    }
  };

  const renderAnswerInput = () => {
    if (mode === "multiple_choice" && options) {
      return (
        <div className={styles.options}>
          {options.map((option, idx) => (
            <button key={idx} className={styles.optionButton} onClick={() => onAnswer(option)}>
              {option}
            </button>
          ))}
        </div>
      );
    }
    return null; // Type inputs handled by parent container
  };

  return (
    <div className={styles.quizCard}>
      {renderModeIndicator()}
      {renderQuestion()}
      {renderAnswerInput()}
    </div>
  );
}
