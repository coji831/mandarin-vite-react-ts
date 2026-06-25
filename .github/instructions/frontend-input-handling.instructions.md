---
description: "Use when building input components with debounce, auto-submit, or timer functionality. Covers edge cases like multi-character input and countdown completion."
applyTo: "**/*Input*,**/*Timer*,**/inputs/*,**/quiz/**"
---

# Input & Timer Edge Cases

## Debounce Auto-Submit

- Base debounce on typing PAUSE, not fixed duration
- For multi-syllable input (e.g., pinyin), use longer debounce (≥1000ms) or an explicit submit button
- Reset debounce timer on every keystroke — never let a stale timer fire

## ✅ DO

```typescript
const SINGLE_DEBOUNCE_MS = 500; // good for single-word input
const MULTI_SYLLABLE_DEBOUNCE_MS = 1200; // for multi-character pinyin like "xiang"

// Reset timer on each keystroke — ensures only final value is submitted
useEffect(() => {
  const timer = setTimeout(submit, DEBOUNCE_MS);
  return () => clearTimeout(timer);
}, [inputValue]);
```

### ❌ DON'T

```typescript
// ❌ BAD — Fixed 500ms for any input type
// User types "xiang": after "xi" (500ms fires) → wrong answer submitted
useEffect(() => {
  const timer = setTimeout(submit, 500);
  return () => clearTimeout(timer);
}, [inputValue]);

// ❌ BAD — No cleanup, stale timer fires after input changes
useEffect(() => {
  setTimeout(submit, 1000); // missing clearTimeout!
}, [inputValue]);
```

## Countdown Timer Edge Cases

- When timer reaches 0, ALWAYS transition to an explicit "Time's up" state
- Never let the timer silently stop — the user needs feedback
- Auto-submit the current answer (or mark as unanswered) on expiry

## ✅ DO

```typescript
const TIME_UP_STATE = "time-up"; // explicit state, not just number hitting 0

useEffect(() => {
  if (timeLeft <= 0 && phase !== "feedback") {
    setPhase(TIME_UP_STATE); // ← explicit transition
    submitCurrentAnswer(); // or mark unanswered
  }
}, [timeLeft]);
```

### ❌ DON'T

```typescript
// ❌ BAD — Timer stops but nothing happens — user is stuck
if (timeLeft <= 0) return; // silent stop, no UI transition
```

## Reasoning

Untested edge cases in inputs cause the worst UX bugs — partial answers submitted, timers that freeze without feedback. These patterns are easy to miss during development because the "happy path" appears to work.
