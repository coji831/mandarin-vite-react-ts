/**
 * MultipleChoiceInput Component
 * Story 15.10: Extracted multiple choice input for 2x2 answer grid
 *
 * Displays 4 answer options in a 2x2 grid layout for multiple choice questions.
 * - Renders buttons with provided options
 * - Calls onAnswer callback when option is selected
 * - Responsive: stacks vertically on mobile
 */

import "./MultipleChoiceInput.css";

type MultipleChoiceInputProps = {
  options: string[];
  onAnswer: (answer: string) => void;
};

export { MultipleChoiceInput };

function MultipleChoiceInput({ options, onAnswer }: MultipleChoiceInputProps) {
  return (
    <div className="multipleChoiceContainer">
      {options.map((option, idx) => (
        <button key={idx} className="multipleChoiceButton" onClick={() => onAnswer(option)}>
          {option}
        </button>
      ))}
    </div>
  );
}
