/**
 * ChineseCharacterInput Component
 *
 * Specialized input for Chinese character typing with optional pinyin assistance.
 *
 * Features:
 * - Standard text input for Chinese characters
 * - Character count indicator
 * - Phase 1 (Current): Basic input with IME support scaffold
 * - Phase 2 (Future): Pinyin-to-character conversion toggle with suggestion dropdown
 *
 * Phase 2 Planned Features:
 * - Toggle button to enable pinyin input mode
 * - Type "ni3hao3" → see suggestions: "你好", "你号", etc.
 * - Arrow keys to select, Enter to confirm
 * - Lightweight pinyin→character dictionary (~50KB JSON, lazy-loaded)
 *
 * Story 15.5: Core Quiz UI Components
 * Refactoring: Extracted from TypeAnswerInput wrapper
 */

import { KeyboardEvent } from "react";
import { Input } from "../../../../components";
import "./ChineseCharacterInput.css";

type ChineseCharacterInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function ChineseCharacterInput({ value, onChange, onSubmit }: ChineseCharacterInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim().length > 0) {
      onSubmit();
    }
  };

  // Count Chinese characters (exclude spaces)
  const characterCount = value.replace(/\s/g, "").length;

  return (
    <div className="chineseCharacterInputContainer">
      <div className="inputWrapper">
        <Input
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyPress}
          placeholder="Type Chinese character..."
          autoComplete="off"
          autoCorrect="off"
        />

        {/* Character count indicator */}
        {characterCount > 0 && (
          <span className="characterCount" aria-label="Character count">
            {characterCount} 字
          </span>
        )}
      </div>

      {/* Phase 2: Pinyin input toggle (currently disabled - scaffold for future feature) */}
      <button
        type="button"
        className="pinyinToggle"
        disabled
        title="Pinyin input mode (coming soon)"
        aria-label="Enable pinyin input mode"
      >
        🔤 Pinyin Mode (Coming Soon)
      </button>

      {/* Phase 2: Suggestion dropdown container (hidden - scaffold for future feature) */}
      <div className="suggestionDropdown" style={{ display: "none" }}>
        {/* Future: Character suggestions will appear here */}
      </div>
    </div>
  );
}
