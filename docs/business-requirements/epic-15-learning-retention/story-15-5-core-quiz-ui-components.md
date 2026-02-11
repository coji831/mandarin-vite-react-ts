# Story 15.5: Core Quiz UI Components

## Description

**As a** frontend developer,
**I want to** build reusable quiz components (QuizCard, ToneInput, TypeAnswerInput),
**So that** learners can interact with multiple question types.

## Business Value

This story delivers the foundational UI building blocks for the quiz system. By creating pure, reusable components without API logic, the frontend team can work independently of backend development and ensure consistent UX across all question modes.

**Impact:**

- Enables parallel frontend/backend development (zero API coupling)
- Reusable components reduce future development time (can be used in other quiz features)
- Multiple question types accommodate different learning preferences (recognition vs. production recall)
- Tone input mechanic addresses critical Mandarin learning challenge (numeric notation → tone marks)

## Acceptance Criteria

- [ ] `QuizCard.tsx` component displays question with word, pinyin, english, and mode indicator
- [ ] QuizCard supports 3 modes via props: 'multiple_choice', 'type_pinyin', 'type_character'
- [ ] Multiple choice mode shows 4 answer buttons (1 correct + 3 distractors) with touch-friendly sizing (min 44px height)
- [ ] `TypeAnswerInput.tsx` component renders text input with placeholder text based on mode (e.g., "Type pinyin..." or "Type character...")
- [ ] Type answer input validates on submit (prevents empty submissions)
- [ ] `ToneInput.tsx` component supports numeric notation conversion (ma3 → mǎ) via onChange handler
- [ ] Tone input validates tone mark placement rules: a > o > e > i/u (rejects invalid like mua3 → mùa)
- [ ] All components accept `onAnswer` callback prop (parent handles answer logic)
- [ ] All components styled with mobile-first responsive design (flex layout, touch targets)
- [ ] Components use TypeScript with strict prop types (no `any` types)
- [ ] Storybook stories created for each component with all variants (optional but recommended)

## Business Rules

1. **Multiple Choice Distractors:** Parent component (Story 15.6) provides 4 options via props; QuizCard only displays them; distractor selection logic not in this story

2. **Tone Mark Conversion Rules:**
   - Numeric notation: 1 = ¯ (flat), 2 = ´ (rising), 3 = ˇ (falling-rising), 4 = ` (falling), 5 = neutral (no mark)
   - Placement priority: a > o > e > i/u (if both i and u, mark the second vowel)
   - Examples: ma1 → mā, hao3 → hǎo, liu2 → liú, gui4 → guì

3. **Input Validation:** TypeAnswerInput trims whitespace; converts to lowercase for comparison; rejects empty strings; no auto-complete/auto-correct (browser features disabled)

4. **Accessibility:** All inputs have proper labels; keyboard navigation supported (Tab, Enter to submit); focus states visible; ARIA labels for screen readers

5. **Component Isolation:** These components are pure UI (no API calls, no state management beyond local input state); all quiz logic lives in parent container (Story 15.6)

## Related Issues

- [**Story 15.6: Quiz Container & State Management**](./story-15-6-quiz-container-state.md) (Blocks: container composes these components)
- [**Story 15.8: Core Quiz Backend Integration**](./story-15-8-core-quiz-integration.md) (Blocks: integration needs these UI components)
- [**Epic 15 BR**](./README.md) (Parent epic)

## Implementation Status

- **Status**: Planned
- **PR**: N/A
- **Merge Date**: N/A
- **Key Commit**: N/A
