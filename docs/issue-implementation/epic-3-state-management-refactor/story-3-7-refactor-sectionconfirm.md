# Story 3-7: Refactor SectionConfirm to Use Context

## Technical Scope

Refactor the `SectionConfirm` component to consume Mandarin context directly, removing all progress-related props and handling navigation via a callback prop.

## Implementation Details

- Removed all progress-related props from `SectionConfirm` except for the optional `onProceed` callback.
- All state and actions (sections, dailyWordCount) are now accessed via `useProgressContext`.
- Persistence and progress logic are managed by the context/hook, not the component.
- Navigation to the next page is triggered by the `onProceed` callback, passed from the parent (`Mandarin.tsx`).
- Updated file-level comments to reflect the new architecture.

## Architecture Integration

- `SectionConfirm` is now fully decoupled from parent state and props, integrating with the broader system via context and hooks.
- The refactor aligns with the Epic 3 goal of eliminating prop drilling and centralizing state management.
- All progress and persistence logic is handled in `useMandarinProgress` and `ProgressContext`.

## Technical Challenges & Solutions

- **Challenge:** Ensuring navigation after section confirmation without direct parent state access.
  **Solution:** Added an `onProceed` callback prop to trigger navigation from the parent.
- **Challenge:** Maintaining identical functionality after removing props.
  **Solution:** Verified that all state/actions are available via context and updated tests/manual checks.

## References

- See [Epic 3 Technical Doc](./README.md)
