# Story 3-9: Refactor FlashCard to Use Context

## Technical Scope

Refactor the `FlashCard` component to consume Mandarin context directly, removing all progress-related props and handling navigation via callback prop.

## Implementation Details

- Removed all progress-related props from `FlashCard` except for the navigation callback (`onBackToSection`).
- All state and actions (sectionWords, sectionProgress, markWordLearned, masteredWordIds, selectedSectionId) are now accessed via `useProgressContext`.
- Persistence and progress logic are managed by the context/hook, not the component.
- Navigation to the previous page is triggered by the callback prop, passed from the parent (`Mandarin.tsx`).
- Updated file-level comments and documentation to reflect the new architecture.

## Architecture Integration

- `FlashCard` is now fully decoupled from parent state and props, integrating with the broader system via context and hooks.
- The refactor aligns with the Epic 3 goal of eliminating prop drilling and centralizing state management.
- All progress and persistence logic is handled in `useMandarinProgress` and `ProgressContext`.

## Technical Challenges & Solutions

- **Challenge:** Ensuring navigation after marking a word as mastered without direct parent state access.
  **Solution:** Kept navigation callback prop (`onBackToSection`) for parent-driven control.
- **Challenge:** Maintaining identical functionality after removing props.
  **Solution:** Verified that all state/actions are available via context and updated tests/manual checks.

## References

- See [Epic 3 Technical Doc](./README.md)
