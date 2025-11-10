# Implementation 10-1: Normalize Vocabulary and Progress Data

## Technical Scope

Refactor state slices to use normalized maps and arrays for vocabulary and progress, linking via `wordId` for reliable access and joining.

## Implementation Details

```typescript
// Example selector for normalized state
function selectWordProgress(state, wordId) {
  return state.progress.progressByWordId[wordId];
}
```

- Update state shape in reducers
- Ensure selectors join static and progress data via `wordId`
- Update tests to verify normalization and linkage

## Architecture Integration

This implementation integrates with the overall state management architecture, ensuring all vocabulary and progress data is accessible via normalized maps and arrays. Selectors and components use the unified model for reliable data access.

## Technical Challenges & Solutions

Problem: Migrating legacy state to normalized structure
Solution: Write migration scripts and fallback logic to handle existing user data

## Testing Implementation

- Unit tests for normalized state shape
- Integration tests for selectors
