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

## Keyboard Single-Activation (Enter/Space)

- Native `<button>` (including the shared `Button`) fires `onClick` on BOTH Enter
  and Space automatically. NEVER add a redundant `onKeyDown` that also triggers
  the action — the toggle/action runs twice per keypress (double-toggle
  anti-pattern). Keep `onClick` only.
- Use `aria-expanded` on the `Button` for disclosure toggles (e.g. the expand
  button in `TreeRootNode`).
- For a non-native `div[role="button"]`, an explicit `onKeyDown` IS required —
  a `div` never fires `click` on Enter/Space. See `PhoneticFamilyNode`'s header
  (`role="button" tabIndex={0}` + explicit Enter/Space handler with
  `e.preventDefault()`).

## Dialog Focus Management (WCAG 2.4.3)

- On open, move focus INTO the dialog: give the container `tabIndex={-1}` and
  call `.focus()` in a mount effect (see `WordPopover`).
- On close, return focus to the trigger: capture `document.activeElement` on
  mount, restore it in the effect cleanup (only if the trigger is still in the
  document).
- Close the dialog on Escape.

---

**See also:** `quiz-architecture.instructions.md` (timer strategies in quiz) • `testing-standards.instructions.md` (test timer edge cases) • `frontend-pre-delivery-checklist.instructions.md` (state coverage)
