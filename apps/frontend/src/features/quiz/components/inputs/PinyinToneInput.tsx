/**
 * PinyinToneInput.tsx
 * Phase 1 Gate Quiz — Combined pinyin + tone input
 *
 * Renders pinyin text input and 5 color-coded tone buttons.
 * Controlled component with local state managed by parent.
 *
 * Wireframe Section 4.6: steps ① and ②.
 */

interface PinyinToneInputProps {
  pinyin: string;
  tone: number;
  onPinyinChange: (value: string) => void;
  onToneSelect: (tone: number) => void;
  disabled?: boolean;
}

/** Tone button configuration */
const TONE_BUTTONS = [
  { tone: 1, mark: "ˉ", label: "1st", example: "mā", color: "#FF4444" },
  { tone: 2, mark: "ˊ", label: "2nd", example: "má", color: "#FF8C00" },
  { tone: 3, mark: "ˇ", label: "3rd", example: "mǎ", color: "#4CAF50" },
  { tone: 4, mark: "ˋ", label: "4th", example: "mà", color: "#2196F3" },
  { tone: 0, mark: "·", label: "0", example: "ma", color: "#9E9E9E" },
];

import "./PinyinToneInput.css";

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
