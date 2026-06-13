/**
 * AnswerSection Component
 * Epic 19: State Refactor - Extracted from ExamLayout
 *
 * Renders answer input section based on question mode:
 * - Multiple choice: Grid of option buttons
 * - Type pinyin: Tone-sensitive pinyin input
 * - Type character: Chinese character input
 *
 * Includes submit button for typing modes.
 */

import { QuestionMode } from "../../types";
import { MultipleChoiceInput, PinyinToneInput, ChineseCharacterInput } from "../inputs";
import "./AnswerSection.css";
import { Button } from "../../../../shared/components";

type AnswerSectionProps = {
  mode: QuestionMode;
  options?: string[];
  answerValue: string;
  onAnswerChange: (value: string) => void;
  onSubmit: () => void;
  onAnswerSelect: (answer: string) => void;
  currentIndex: number;
  showSubmitButton: boolean;
};

export function AnswerSection({
  mode,
  options,
  answerValue,
  onAnswerChange,
  onSubmit,
  onAnswerSelect,
  currentIndex,
  showSubmitButton,
}: AnswerSectionProps) {
  return (
    <>
      <div className="answerContent">
        {mode === "multiple_choice" && options && (
          <MultipleChoiceInput options={options} onAnswer={onAnswerSelect} />
        )}

        {mode === "type_pinyin" && (
          <PinyinToneInput
            key={currentIndex}
            value={answerValue}
            onChange={onAnswerChange}
            onSubmit={onSubmit}
          />
        )}

        {mode === "type_character" && (
          <ChineseCharacterInput
            key={currentIndex}
            value={answerValue}
            onChange={onAnswerChange}
            onSubmit={onSubmit}
          />
        )}
      </div>

      {showSubmitButton && (
        <div className="answerActionBar">
          <Button variant="primary" onClick={onSubmit} disabled={answerValue.trim().length === 0}>
            Submit
          </Button>
        </div>
      )}
    </>
  );
}
