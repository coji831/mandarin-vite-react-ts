/**
 * QuestionSection Component
 * Component Reorganization: Renamed from QuizCard -> QuestionDisplay -> QuestionSection
 *
 * Display quiz question content only (no options rendering).
 * Options are now rendered in AnswerSection.
 *
 * Story 15.5: Core Quiz UI Components
 * Story 15.10: Question display only (answer grid in parent)
 */
import { QuestionMode } from "../../types";
import "./QuestionSection.css";

interface QuestionSectionProps {
  question: {
    word: string;
    pinyin?: string;
    english?: string;
  };
  mode: QuestionMode;
  onToggleHint?: () => void;
}

export { QuestionSection };

function QuestionSection({ question, mode, onToggleHint }: QuestionSectionProps) {
  const renderQuestion = () => {
    switch (mode) {
      case "multiple_choice":
        return (
          <div className="question flex-col-center text-center">
            <h2>{question.word}</h2>
            {question.pinyin && <p className="pinyin">({question.pinyin})</p>}
            <p>What does this mean?</p>
          </div>
        );
      case "type_pinyin":
        return (
          <div className="question flex-col-center text-center">
            <h2>{question.word}</h2>
            <p>Type the pinyin:</p>
          </div>
        );
      case "type_character":
        return (
          <div className="question flex-col-center text-center">
            {question.pinyin && <p className="pinyin">{question.pinyin}</p>}
            {question.english && <p>{question.english}</p>}
            <p>Type the Chinese character:</p>
          </div>
        );
    }
  };

  return (
    <div className="quizCard">
      <div className="questionCardHeader">
        <div className="quizTypeIcon">
          {mode === "multiple_choice" && "🎯"}
          {mode === "type_pinyin" && "✏️"}
          {mode === "type_character" && "🖊️"}
        </div>

        <button
          type="button"
          onClick={() => onToggleHint && onToggleHint()}
          className="hintIconButton"
          aria-label="Toggle hint"
        >
          💡
        </button>
      </div>

      <div className="questionCardContent">{renderQuestion()}</div>
    </div>
  );
}
