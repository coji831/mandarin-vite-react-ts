/**
 * ToneInput component
 *
 * Converts numeric notation to tone marks (ma3 → mǎ)
 * Tone mark placement priority: a > o > e > i/u
 * Story 15.5: Core Quiz UI Components
 */
import { ChangeEvent, useState } from "react";
import { toneMap, toneMapKeys } from "../../../constants/toneMap";
import "./ToneInput.css";

type ToneInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export { ToneInput };

function ToneInput({ value, onChange }: ToneInputProps) {
  const [displayValue, setDisplayValue] = useState(value);

  const convertToneMarks = (input: string): string => {
    if (!input) return "";

    let result = input.toLowerCase();

    // Use pre-sorted keys to match longer patterns before shorter ones
    // This ensures "ang1" matches before "an1" or "a1"
    toneMapKeys.forEach((key) => {
      const regex = new RegExp(key, "g");
      result = result.replace(regex, toneMap[key]);
    });

    return result.replace(/[0-9]/g, ""); // Remove remaining numbers (neutral tone)
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplayValue(raw);

    // Convert and pass to parent
    const converted = convertToneMarks(raw);
    onChange(converted);
  };

  return (
    <div className="toneInputContainer">
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder="Type pinyin (e.g., ma3)"
        className="toneInput"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />
      <div className="preview">
        Preview: <strong>{convertToneMarks(displayValue)}</strong>
      </div>
    </div>
  );
}
