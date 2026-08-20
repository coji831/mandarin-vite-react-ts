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

import type { ButtonVariant } from "shared/components";
import { Button, Input } from "shared/components";
import { TONE_BUTTONS_BASE } from "shared/constants";
import "./PinyinToneInput.css";

const TONE_BUTTONS = TONE_BUTTONS_BASE.map((btn) => ({
  ...btn,
  example: ["mā", "má", "mǎ", "mà", "ma"][btn.tone === 0 ? 4 : btn.tone - 1],
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
        <label className="pinyin-tone-input__label font-sm fw-600 text-secondary">
          ① Type the pinyin (without tone):
        </label>
        <Input
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
        <div className="flex-center gap-sm">
          {TONE_BUTTONS.map((btn) => {
            const toneKey = btn.tone === 0 ? 5 : btn.tone;
            return (
              <Button
                key={btn.tone}
                variant={`tone-${toneKey}` as ButtonVariant}
                size="sm"
                className="pinyin-tone-input__btn hover-lift flex-col"
                onClick={() => onToneSelect(btn.tone)}
                disabled={disabled}
              >
                <span className="pinyin-tone-input__btn-mark font-lg fw-700 lh-1">
                  {btn.mark}
                  {btn.label}
                </span>
                <span className="pinyin-tone-input__btn-example font-sm">{btn.example}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
