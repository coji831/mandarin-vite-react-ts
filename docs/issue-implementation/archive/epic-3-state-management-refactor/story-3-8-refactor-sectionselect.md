# Story 3-8: Refactor SectionSelect to Use Context

## Technical Scope

Refactor the `SectionSelect` component to consume Mandarin context directly, removing all progress-related props and handling navigation via callback props.

## Implementation Details

- Removed all progress-related props from `SectionSelect` except for the optional navigation callbacks (`onProceed`, `onBack`).
- All state and actions (sections, selectedSectionId, setSelectedSectionId, sectionProgress, learnedWordIds, selectedWords) are now accessed via `useProgressContext`.
- Persistence and progress logic are managed by the context/hook, not the component.
- Navigation to the next page is triggered by the callback props, passed from the parent (`Mandarin.tsx`).
- Updated file-level comments to reflect the new architecture.

## Architecture Integration

- `SectionSelect` is now fully decoupled from parent state and props, integrating with the broader system via context and hooks.
- The refactor aligns with the Epic 3 goal of eliminating prop drilling and centralizing state management.
- All progress and persistence logic is handled in `useMandarinProgress` and `ProgressContext`.

## Technical Challenges & Solutions

- **Challenge:** Ensuring navigation after section selection without direct parent state access.
  **Solution:** Kept navigation callback props (`onProceed`, `onBack`) for parent-driven control.
- **Challenge:** Maintaining identical functionality after removing props.
  **Solution:** Verified that all state/actions are available via context and updated tests/manual checks.

## References

- See [Epic 3 Technical Doc](./README.md)
