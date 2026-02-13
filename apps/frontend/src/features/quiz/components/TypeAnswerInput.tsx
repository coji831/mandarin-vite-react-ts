/**
 * TypeAnswerInput component
 *
 * Handles user input for type-answer questions (pinyin/character modes)
 * - Wraps ToneInput for pinyin mode
 * - Regular input for character mode
 * - Submit validation and keyboard support
 * Story 15.5: Core Quiz UI Components
 */
import { useState, KeyboardEvent } from "react";
import { ToneInput } from "./ToneInput";
import styles from "./TypeAnswerInput.module.css";

type InputMode = "type_pinyin" | "type_character";

interface TypeAnswerInputProps {
  placeholder: string;
  mode: InputMode;
  onAnswer: (answer: string) => void;
}

export { TypeAnswerInput };

function TypeAnswerInput({ placeholder, mode, onAnswer }: TypeAnswerInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed.length === 0) return; // Prevent empty submissions

    onAnswer(trimmed.toLowerCase());
    setValue(""); // Clear after submission
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className={styles.typeAnswerContainer}>
      {mode === "type_pinyin" ? (
        <ToneInput value={value} onChange={setValue} />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className={styles.answerInput}
          autoComplete="off"
          autoCorrect="off"
        />
      )}
      <button
        onClick={handleSubmit}
        disabled={value.trim().length === 0}
        className={styles.submitButton}
      >
        Submit
      </button>
    </div>
  );
}
