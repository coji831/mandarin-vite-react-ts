# Implementation 10-4: Update Selectors

## Technical Scope

Update selectors to join static and progress data via `wordId`, ensuring unified and efficient data access for all components.

## Implementation Details

```typescript
function selectJoinedWord(state, wordId) {
  return {
    ...state.data.vocabByWordId[wordId],
    ...state.progress.progressByWordId[wordId],
  };
}
```

- Refactor selectors to join normalized data
- Update components to use new selectors
- Add tests for selector logic and data joining

## Architecture Integration

Selectors provide joined data to components, supporting unified data flow and maintainable UI logic.

## Technical Challenges & Solutions

Problem: Ensuring selector performance and correctness
Solution: Write unit and integration tests for selector logic

## Testing Implementation

- Unit tests for selector logic
- Integration tests for data joining
