# Tone Input Component Implementation Guide

**Purpose**: Step-by-step guide for building a user-friendly Mandarin pinyin input component with automatic tone mark conversion and validation.

**Related Stories**: [Story 15.3](../business-requirements/epic-15-learning-retention/story-15-3-tone-input-ui.md), [Story 15.6](../business-requirements/epic-15-learning-retention/story-15-6-quiz-container-state.md)

**Target Audience**: Frontend developers implementing quiz UI components

---

## Overview

Mandarin Chinese has four tones (plus a neutral tone), represented by diacritical marks above vowels. A tone input component must allow users to type: 

- **Numeric suffix notation**: `ma1`, `ma2`, `ma3`, `ma4` (easy to type)
- **Converted to Unicode tone marks**: `mā`, `má`, `mǎ`, `mà` (correct format for validation)

**Key Features**:

- Real-time conversion (`ma3` → `mǎ` as user types)
- Tone placement rules (a > o/e > i/u priority)
- Mobile-friendly long-press gesture (optional enhancement)
- Validation feedback (correct/incorrect tone marks)
- Accessibility support (screen readers, keyboard navigation)

---

## Tone Mark Placement Rules

### Priority Hierarchy

Tone marks appear above the **main vowel** of a syllable according to strict rules:

```
Priority Order: a > o/e > i/u (last vowel if i/u combination)
```

**Rules**:

1. **If syllable contains 'a'**: Tone mark goes on 'a'
   - Example: `bai` + tone 3 → `bǎi` (not `baǐ`)
   
2. **If no 'a', but has 'o' or 'e'**: Tone mark goes on 'o' or 'e'
   - Example: `tou` + tone 2 → `tóu` (not `toú`)
   - Example: `hei` + tone 1 → `hēi` (not `heī`)
   
3. **If only 'i' and 'u'**: Tone mark goes on the **second vowel**
   - Exception: `iu` → mark on `u` (e.g., `liu4` → `liù`)
   - Exception: `ui` → mark on `i` (e.g., `dui4` → `duì`)
   
4. **Single vowel**: Tone mark goes on that vowel
   - Example: `li` + tone 3 → `lǐ`

---

## Step 1: Unicode Tone Mark Mappings

### Vowel + Tone Combinations

```typescript
// apps/frontend/src/utils/toneConversion.ts

export const TONE_MARKS: Record<string, Record<number, string>> = {
  'a': { 1: 'ā', 2: 'á', 3: 'ǎ', 4: 'à', 5: 'a' },
  'e': { 1: 'ē', 2: 'é', 3: 'ě', 4: 'è', 5: 'e' },
  'i': { 1: 'ī', 2: 'í', 3: 'ǐ', 4: 'ì', 5: 'i' },
  'o': { 1: 'ō', 2: 'ó', 3: 'ǒ', 4: 'ò', 5: 'o' },
  'u': { 1: 'ū', 2: 'ú', 3: 'ǔ', 4: 'ù', 5: 'u' },
  'ü': { 1: 'ǖ', 2: 'ǘ', 3: 'ǚ', 4: 'ǜ', 5: 'ü' },
  // Handle 'v' as alternative input for 'ü'
  'v': { 1: 'ǖ', 2: 'ǘ', 3: 'ǚ', 4: 'ǜ', 5: 'ü' }
};
```

**Key Decision**: Tone 5 (neutral tone) uses unmarked vowel (some systems use `·` dot, but this is non-standard).

---

## Step 2: Tone Conversion Algorithm

```typescript
// apps/frontend/src/utils/toneConversion.ts

/**
 * Convert numeric pinyin (ma3) to tone marks (mǎ)
 * 
 * @param input - Raw pinyin string with numeric tone (e.g., "ma3", "liu4")
 * @returns Pinyin with Unicode tone marks (e.g., "mǎ", "liù")
 */
export function convertPinyinTone(input: string): string {
  // Normalize input (lowercase, trim)
  const normalized = input.toLowerCase().trim();
  
  // Extract tone number (last character if 1-5)
  const toneMatch = normalized.match(/^(.+?)([1-5])$/);
  if (!toneMatch) {
    return normalized; // No tone number found, return as-is
  }
  
  const [, syllable, toneStr] = toneMatch;
  const tone = parseInt(toneStr, 10);
  
  // Find target vowel for tone mark
  const targetVowel = findToneVowel(syllable);
  if (!targetVowel) {
    return normalized; // No vowel found (invalid pinyin)
  }
  
  // Replace target vowel with tone-marked version
  const markedVowel = TONE_MARKS[targetVowel][tone];
  const result = syllable.replace(targetVowel, markedVowel);
  
  return result;
}

/**
 * Find the vowel that should receive the tone mark
 * Applies pinyin tone placement rules
 */
function findToneVowel(syllable: string): string | null {
  // Rule 1: If 'a' exists, use 'a'
  if (syllable.includes('a')) return 'a';
  
  // Rule 2: If 'o' or 'e' exists (no 'a'), use 'o' or 'e'
  if (syllable.includes('o')) return 'o';
  if (syllable.includes('e')) return 'e';
  
  // Rule 3: If 'iu' or 'ui' combination, use second vowel
  if (syllable.includes('iu')) return 'u'; // liu4 → liù
  if (syllable.includes('ui')) return 'i'; // dui4 → duì
  
  // Rule 4: Otherwise, find last vowel in i/u/ü sequence
  const vowels = ['ü', 'v', 'u', 'i']; // Check ü/v first (specific), then u/i
  for (const vowel of vowels) {
    if (syllable.includes(vowel)) return vowel;
  }
  
  return null; // No valid vowel found
}
```

### Test Cases

```typescript
// apps/frontend/src/utils/toneConversion.test.ts

import { convertPinyinTone } from './toneConversion';

describe('convertPinyinTone', () => {
  // Rule 1: 'a' priority
  test('converts syllable with "a"', () => {
    expect(convertPinyinTone('ma1')).toBe('mā');
    expect(convertPinyinTone('ma3')).toBe('mǎ');
    expect(convertPinyinTone('bai4')).toBe('bài'); // Not baǐ
  });
  
  // Rule 2: 'o' / 'e' priority (no 'a')
  test('converts syllable with "o"', () => {
    expect(convertPinyinTone('tou2')).toBe('tóu');
    expect(convertPinyinTone('wo3')).toBe('wǒ');
  });
  
  test('converts syllable with "e"', () => {
    expect(convertPinyinTone('hei1')).toBe('hēi');
    expect(convertPinyinTone('mei3')).toBe('měi');
  });
  
  // Rule 3: 'iu' / 'ui' special cases
  test('converts "iu" (mark on u)', () => {
    expect(convertPinyinTone('liu4')).toBe('liù');
    expect(convertPinyinTone('jiu3')).toBe('jiǔ');
  });
  
  test('converts "ui" (mark on i)', () => {
    expect(convertPinyinTone('dui4')).toBe('duì');
    expect(convertPinyinTone('hui2')).toBe('huí');
  });
  
  // Rule 4: Single vowel
  test('converts single vowel', () => {
    expect(convertPinyinTone('li3')).toBe('lǐ');
    expect(convertPinyinTone('bu4')).toBe('bù');
  });
  
  // Edge cases
  test('handles neutral tone (5)', () => {
    expect(convertPinyinTone('ma5')).toBe('ma'); // Unmarked
  });
  
  test('handles ü (v) notation', () => {
    expect(convertPinyinTone('lv3')).toBe('lǚ'); // lü3
    expect(convertPinyinTone('nü3')).toBe('nǚ');
  });
  
  test('returns input unchanged if no tone number', () => {
    expect(convertPinyinTone('ma')).toBe('ma');
    expect(convertPinyinTone('hello')).toBe('hello'); // Invalid pinyin
  });
});
```

---

## Step 3: React Component Implementation

### Basic Input Component

```typescript
// apps/frontend/src/features/quiz/components/ToneInput.tsx

import React, { useState, useCallback } from 'react';
import { convertPinyinTone } from '../../../utils/toneConversion';
import './ToneInput.css';

interface ToneInputProps {
  placeholder?: string;
  onSubmit: (value: string) => void;
  correctAnswer?: string; // For validation feedback
  disabled?: boolean;
}

export const ToneInput: React.FC<ToneInputProps> = ({
  placeholder = 'Type pinyin with tone (e.g., ma3)',
  onSubmit,
  correctAnswer,
  disabled = false
}) => {
  const [rawInput, setRawInput] = useState('');
  const [convertedValue, setConvertedValue] = useState('');

  // Real-time conversion as user types
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setRawInput(raw);
    
    // Convert if input ends with tone number (1-5)
    if (/[1-5]$/.test(raw)) {
      const converted = convertPinyinTone(raw);
      setConvertedValue(converted);
    } else {
      setConvertedValue(raw); // Show raw input if no tone number yet
    }
  }, []);

  // Submit on Enter key
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && convertedValue) {
      onSubmit(convertedValue);
      setRawInput('');
      setConvertedValue('');
    }
  }, [convertedValue, onSubmit]);

  // Determine validation state
  const isCorrect = correctAnswer && convertedValue === correctAnswer;
  const isIncorrect = correctAnswer && convertedValue && convertedValue !== correctAnswer;

  return (
    <div className="tone-input-container">
      <div className="tone-input-wrapper">
        <input
          type="text"
          value={rawInput}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          className={`tone-input ${isCorrect ? 'correct' : ''} ${isIncorrect ? 'incorrect' : ''}`}
          aria-label="Pinyin tone input"
        />
        
        {/* Show converted preview above input */}
        {convertedValue && convertedValue !== rawInput && (
          <div className="tone-preview" aria-live="polite">
            {convertedValue}
          </div>
        )}
      </div>
      
      {/* Validation feedback */}
      {isCorrect && (
        <div className="feedback correct" role="status">
          ✅ Correct!
        </div>
      )}
      {isIncorrect && (
        <div className="feedback incorrect" role="alert">
          ❌ Incorrect. Expected: {correctAnswer}
        </div>
      )}
      
      {/* Help text */}
      <div className="help-text">
        Tip: Type number after syllable (ma3 → mǎ)
      </div>
    </div>
  );
};
```

### CSS Styling

```css
/* apps/frontend/src/features/quiz/components/ToneInput.css */

.tone-input-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 400px;
  margin: 0 auto;
}

.tone-input-wrapper {
  position: relative;
}

.tone-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 18px;
  border: 2px solid #ccc;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.tone-input:focus {
  outline: none;
  border-color: #4A90E2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

.tone-input.correct {
  border-color: #28a745;
  background-color: #f0fff0;
}

.tone-input.incorrect {
  border-color: #dc3545;
  background-color: #fff0f0;
}

.tone-preview {
  position: absolute;
  top: -30px;
  left: 16px;
  font-size: 24px;
  font-weight: bold;
  color: #4A90E2;
  pointer-events: none;
}

.feedback {
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
}

.feedback.correct {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.feedback.incorrect {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.help-text {
  font-size: 12px;
  color: #6c757d;
  text-align: center;
}

/* Mobile optimization */
@media (max-width: 768px) {
  .tone-input {
    font-size: 16px; /* Prevent iOS zoom on focus */
  }
}
```

---

## Step 4: Mobile Enhancement - Long-Press Gesture

For mobile users, typing numbers can be cumbersome. Add long-press gesture to select tone marks directly.

### Implementation

```typescript
// apps/frontend/src/features/quiz/components/ToneInputMobile.tsx

import React, { useState, useCallback, useRef } from 'react';
import { TONE_MARKS } from '../../../utils/toneConversion';
import './ToneInputMobile.css';

export const ToneInputMobile: React.FC<ToneInputProps> = ({ onSubmit, ...props }) => {
  const [input, setInput] = useState('');
  const [showTonePicker, setShowTonePicker] = useState(false);
  const [selectedVowel, setSelectedVowel] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Detect long press on vowel
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLInputElement>) => {
    const cursorPosition = e.currentTarget.selectionStart || 0;
    const char = input[cursorPosition - 1];
    
    // Check if character is a vowel
    if (char && ['a', 'e', 'i', 'o', 'u', 'ü', 'v'].includes(char.toLowerCase())) {
      longPressTimer.current = setTimeout(() => {
        setSelectedVowel(char);
        setShowTonePicker(true);
      }, 500); // 500ms long press threshold
    }
  }, [input]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Select tone mark
  const selectTone = useCallback((tone: number) => {
    if (!selectedVowel) return;
    
    const markedVowel = TONE_MARKS[selectedVowel.toLowerCase()][tone];
    const cursorPosition = input.lastIndexOf(selectedVowel);
    
    // Replace vowel with tone-marked version
    const newInput =
      input.slice(0, cursorPosition) +
      markedVowel +
      input.slice(cursorPosition + 1);
    
    setInput(newInput);
    setShowTonePicker(false);
    setSelectedVowel(null);
  }, [selectedVowel, input]);

  return (
    <div className="tone-input-mobile">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        {...props}
      />
      
      {/* Tone picker popup */}
      {showTonePicker && selectedVowel && (
        <div className="tone-picker">
          <div className="tone-picker-header">
            Select tone for "{selectedVowel}"
          </div>
          <div className="tone-options">
            {[1, 2, 3, 4, 5].map(tone => (
              <button
                key={tone}
                onClick={() => selectTone(tone)}
                className="tone-option"
              >
                {TONE_MARKS[selectedVowel.toLowerCase()][tone]}
                <span className="tone-number">{tone}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowTonePicker(false)}
            className="tone-picker-close"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
```

**UX Flow**:

1. User types "ma"
2. User long-presses on "a" (500ms)
3. Tone picker popup appears with options: ā, á, ǎ, à, a
4. User taps "ǎ" (tone 3)
5. Input updates to "mǎ"

---

## Step 5: Validation Logic

```typescript
// apps/frontend/src/features/quiz/utils/validatePinyin.ts

/**
 * Validate user's pinyin answer against correct answer
 * Handles both numeric (ma3) and tone-marked (mǎ) formats
 */
export function validatePinyin(userAnswer: string, correctAnswer: string): boolean {
  // Normalize both answers to tone-marked format
  const normalizedUser = convertPinyinTone(userAnswer).toLowerCase().trim();
  const normalizedCorrect = correctAnswer.toLowerCase().trim();
  
  return normalizedUser === normalizedCorrect;
}

/**
 * Provide detailed feedback on pinyin errors
 */
export function getPinyinFeedback(userAnswer: string, correctAnswer: string): string {
  const userConverted = convertPinyinTone(userAnswer);
  const correct = correctAnswer;
  
  // Exact match
  if (userConverted === correct) {
    return 'Perfect!';
  }
  
  // Check if only tone is wrong
  const userBase = removeTones(userConverted);
  const correctBase = removeTones(correct);
  
  if (userBase === correctBase) {
    const userTone = detectTone(userConverted);
    const correctTone = detectTone(correct);
    return `Close! You used tone ${userTone}, but ${correctBase} uses tone ${correctTone}.`;
  }
  
  // Completely wrong
  return `Incorrect. The correct pinyin is: ${correct}`;
}

// Helper: Remove tone marks for comparison
function removeTones(pinyin: string): string {
  const toneMap: Record<string, string> = {
    'ā': 'a', 'á': 'a', 'ǎ': 'a', 'à': 'a',
    'ē': 'e', 'é': 'e', 'ě': 'e', 'è': 'e',
    'ī': 'i', 'í': 'i', 'ǐ': 'i', 'ì': 'i',
    'ō': 'o', 'ó': 'o', 'ǒ': 'o', 'ò': 'o',
    'ū': 'u', 'ú': 'u', 'ǔ': 'u', 'ù': 'u',
    'ǖ': 'ü', 'ǘ': 'ü', 'ǚ': 'ü', 'ǜ': 'ü'
  };
  
  return pinyin.split('').map(char => toneMap[char] || char).join('');
}

// Helper: Detect tone number from pinyin
function detectTone(pinyin: string): number {
  const toneMarks = {
    1: ['ā', 'ē', 'ī', 'ō', 'ū', 'ǖ'],
    2: ['á', 'é', 'í', 'ó', 'ú', 'ǘ'],
    3: ['ǎ', 'ě', 'ǐ', 'ǒ', 'ǔ', 'ǚ'],
    4: ['à', 'è', 'ì', 'ò', 'ù', 'ǜ']
  };
  
  for (const [tone, marks] of Object.entries(toneMarks)) {
    if (marks.some(mark => pinyin.includes(mark))) {
      return parseInt(tone, 10);
    }
  }
  
  return 5; // Neutral tone (no mark)
}
```

---

## Accessibility Considerations

### Screen Reader Support

```typescript
<input
  type="text"
  value={input}
  onChange={handleChange}
  aria-label="Pinyin input with tone marks"
  aria-describedby="tone-help-text"
  aria-invalid={isIncorrect}
/>

<div id="tone-help-text" role="region" aria-live="polite">
  {convertedValue && `Converted to: ${convertedValue}`}
</div>

{isCorrect && (
  <div role="status" aria-live="polite">
    Correct answer!
  </div>
)}

{isIncorrect && (
  <div role="alert" aria-live="assertive">
    Incorrect. Expected: {correctAnswer}
  </div>
)}
```

**Key Attributes**:

- `aria-label`: Describes input purpose
- `aria-describedby`: Links to help text
- `aria-invalid`: Signals validation error
- `aria-live="polite"`: Announces conversion (non-intrusive)
- `aria-live="assertive"`: Announces errors immediately (high priority)

---

## Common Issues and Solutions

### Issue 1: iOS autocorrect interferes with pinyin input

**Problem**: iOS autocorrects "ma3" to "MA3" or suggests "map"

**Solution**: Disable autocorrect and autocapitalize

```typescript
<input
  type="text"
  autoCorrect="off"
  autoCapitalize="none"
  spellCheck="false"
  {...props}
/>
```

### Issue 2: User types "ü" but keyboard doesn't have it

**Problem**: Standard keyboards lack "ü" character

**Solution**: Accept "v" as substitute (common pinyin input method)

```typescript
// Already handled in TONE_MARKS mapping
'v': { 1: 'ǖ', 2: 'ǘ', 3: 'ǚ', 4: 'ǜ', 5: 'ü' }

// Example: lv3 → lǚ (same as lü3)
```

### Issue 3: Conversion doesn't trigger on mobile (numeric keyboard)

**Problem**: User switches to numeric keyboard to type tone number → Input event doesn't fire correctly

**Solution**: Use `onInput` event instead of `onChange` (broader compatibility)

```typescript
<input
  type="text"
  onInput={(e) => handleChange(e as any)} // Works across keyboard types
  {...props}
/>
```

---

## Testing Checklist

- [ ] Numeric input converts correctly (ma1 → mā, ma3 → mǎ)
- [ ] Tone placement follows rules (bai4 → bài, not baǐ)
- [ ] Special cases handled (liu4 → liù, dui4 → duì)
- [ ] ü/v notation works (lv3 → lǚ)
- [ ] Real-time preview updates as user types
- [ ] Validation feedback appears (correct/incorrect states)
- [ ] Mobile long-press works (500ms threshold)
- [ ] Accessibility: Screen reader announces conversions
- [ ] iOS: Autocorrect/autocapitalize disabled
- [ ] Edge case: Empty input doesn't crash
- [ ] Edge case: Invalid pinyin (e.g., "xyz9") handled gracefully

---

## Related Documentation

- [Story 15.3 BR](../business-requirements/epic-15-learning-retention/story-15-3-tone-input-ui.md) - Tone input requirements
- [Quiz State Management Guide](./quiz-state-management-guide.md) - Quiz container integration
- [Chinese Pinyin Tones Guide](https://www.hanzistroke.com/blog/pinyin-tones-guide) - Linguistic reference
- [Code Conventions](./code-conventions.md) - React component patterns

---

**Last Updated**: January 20, 2025
