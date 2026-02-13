/**
 * ToneInput component
 *
 * Converts numeric notation to tone marks (ma3 → mǎ)
 * Tone mark placement priority: a > o > e > i/u
 * Story 15.5: Core Quiz UI Components
 */
import { ChangeEvent, useState } from "react";
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

    // Process multi-vowel combinations first (longer matches)
    const multiVowelKeys = Object.keys(toneMap)
      .filter((k) => k.length === 3)
      .sort((a, b) => b.length - a.length);
    multiVowelKeys.forEach((key) => {
      const regex = new RegExp(key, "g");
      result = result.replace(regex, toneMap[key]);
    });

    // Then process single vowels
    const singleVowelKeys = Object.keys(toneMap).filter((k) => k.length === 2);
    singleVowelKeys.forEach((key) => {
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

// Tone map with priority: multi-vowel combos first, then single vowels
// Pinyin rule: tone mark priority is a > o > e > i/u
const toneMap: Record<string, string> = {
  // Multi-vowel combinations (must be processed first)
  ao1: "āo",
  ao2: "áo",
  ao3: "ǎo",
  ao4: "ào",
  ou1: "ōu",
  ou2: "óu",
  ou3: "ǒu",
  ou4: "òu",
  ai1: "āi",
  ai2: "ái",
  ai3: "ǎi",
  ai4: "ài",
  ei1: "ēi",
  ei2: "éi",
  ei3: "ěi",
  ei4: "èi",
  ui1: "uī",
  ui2: "uí",
  ui3: "uǐ",
  ui4: "uì",
  iu1: "iū",
  iu2: "iú",
  iu3: "iǔ",
  iu4: "iù",
  // Single vowels
  a1: "ā",
  a2: "á",
  a3: "ǎ",
  a4: "à",
  o1: "ō",
  o2: "ó",
  o3: "ǒ",
  o4: "ò",
  e1: "ē",
  e2: "é",
  e3: "ě",
  e4: "è",
  i1: "ī",
  i2: "í",
  i3: "ǐ",
  i4: "ì",
  u1: "ū",
  u2: "ú",
  u3: "ǔ",
  u4: "ù",
  ü1: "ǖ",
  ü2: "ǘ",
  ü3: "ǚ",
  ü4: "ǜ",
};
