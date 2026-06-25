/**
 * PinyinToneInput.tsx
 * Phase 1 Gate Quiz — Combined pinyin + tone input
 *
 * Renders pinyin text input and 5 color-coded tone buttons.
 * Controlled component with local state managed by parent.
 *
 * Wireframe Section 4.6: steps ① and ②.
 */

type PinyinToneInputProps = {
  pinyin: string;
  tone: number;
  onPinyinChange: (value: string) => void;
  onToneSelect: (tone: number) => void;
  disabled?: boolean;
};

import { TONE_BUTTONS_BASE } from "../../../../shared/constants/toneMap";
import "./PinyinToneInput.css";

/** Tone buttons enriched with quiz-specific fields */
const TONE_BUTTONS = TONE_BUTTONS_BASE.map((btn) => ({
  ...btn,
  example: ["mā", "má", "mǎ", "mà", "ma"][btn.tone === 0 ? 4 : btn.tone - 1],
  color: ["#FF4444", "#FF8C00", "#4CAF50", "#2196F3", "#9E9E9E"][btn.tone === 0 ? 4 : btn.tone - 1],
}));

/** Combined pinyin text input + tone selector buttons */
export function PinyinToneInput({
  pinyin,
  tone,
  onPinyinChange,
  onToneSelect,
  disabled = false,
}: PinyinToneInputProps) {
  return (
    <div className="flex-col gap-xl">
      {/* Step 1: Pinyin text input */}
      <div className="flex-col gap-sm">
        <label className="pinyin-tone-input__label font-sm fw-500">
          ① Type the pinyin (without tone):
        </label>
        <input
          className="input-base"
          type="text"
          value={pinyin}
          onChange={(e) => onPinyinChange(e.target.value)}
          placeholder="e.g., ma"
          disabled={disabled}
          autoFocus
        />
      </div>

      {/* Step 2: Tone selector buttons */}
      <div className="flex-col gap-sm">
        <label className="pinyin-tone-input__label font-sm fw-500">② Select the tone:</label>
        <div className="flex-center" style={{ gap: "var(--space-sm)" }}>
          {TONE_BUTTONS.map((btn) => (
            <button
              key={btn.tone}
              className="pinyin-tone-input__btn hover-lift flex-col gap-xs p-sm radius-md cursor-pointer grow-1"
              style={{
                border: `2px solid ${tone === btn.tone ? btn.color : "var(--surface-border)"}`,
                backgroundColor: tone === btn.tone ? `${btn.color}25` : "transparent",
                color: tone === btn.tone ? btn.color : "var(--text-secondary)",
                opacity: disabled ? 0.5 : 1,
              }}
              onClick={() => onToneSelect(btn.tone)}
              disabled={disabled}
              type="button"
            >
              <span className="pinyin-tone-input__btn-mark font-lg fw-700 lh-1">
                {btn.mark}
                {btn.label}
              </span>
              <span className="pinyin-tone-input__btn-example font-sm op-80">{btn.example}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
