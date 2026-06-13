/**
 * PinyinToneInput Component
 *
 * Specialized input for pinyin with automatic tone mark conversion.
 * Converts numeric notation (ma3) to Unicode tone marks (mǎ).
 *
 * Features:
 * - Real-time tone conversion using pinyinConverter utility
 * - Live preview showing converted pinyin
 * - Dismissible tooltip explaining tone notation (shown once)
 * - Wraps shared Input component
 *
 * Story 15.5: Core Quiz UI Components
 * Story 15.10: Added dismissible tooltip, extracted from ToneInput
 */

import { KeyboardEvent, useState } from "react";
import { Input } from "../../../../shared/components";
import { convertToneMarks } from "../../utils/pinyinConverter";
import "./PinyinToneInput.css";

type PinyinToneInputProps = {
  value: string;
  onChange: (convertedValue: string) => void;
  onSubmit: () => void;
};

export function PinyinToneInput({ value, onChange, onSubmit }: PinyinToneInputProps) {
  // Maintain separate display value (raw input with numbers) and converted value
  const [displayValue, setDisplayValue] = useState(value);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleToggleTooltip = () => {
    setShowTooltip((prev) => !prev);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplayValue(raw);

    // Convert and pass to parent
    const converted = convertToneMarks(raw);
    onChange(converted);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim().length > 0) {
      onSubmit();
    }
  };

  return (
    <div className="pinyinToneInputContainer">
      {/* Toggle tooltip explaining tone notation */}
      {showTooltip && (
        <div className="toneTooltip">
          <p className="tooltipTitle">🔊 Tone Input Guide</p>
          <p className="tooltipText">
            Type numbers after pinyin for tones:
            <br />
            <strong>ma1</strong> → mā | <strong>ma2</strong> → má | <strong>ma3</strong> → mǎ |{" "}
            <strong>ma4</strong> → mà
          </p>
        </div>
      )}

      <Input
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyPress}
        placeholder="Type pinyin (e.g., ma3)"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />

      {/* Live preview showing converted pinyin with help icon */}
      <div className="preview">
        <span>
          Preview: <strong>{convertToneMarks(displayValue)}</strong>
        </span>
        <button
          type="button"
          onClick={handleToggleTooltip}
          className="hintIconButton"
          aria-label="Toggle tone input guide"
          title="Toggle tone input guide"
        >
          💡
        </button>
      </div>
    </div>
  );
}
