# Implementation 11.4: Refactor Components to Use Services

## Technical Scope

Refactor all components and pages (e.g., PlayButton, FlashCardPage, VocabularyListPage) to use the new service layer for all data/audio access. Remove all direct fetch/API calls from UI code. Update tests to mock the service layer.

## Implementation Details

```typescript
// Example refactor pattern
// Before:
const res = await fetch("/api/vocab");
// After:
const vocab = await vocabularyDataService.fetchAllLists();
```

All data/audio access in UI code must use the new service layer. Tests are updated to mock service functions.

## Architecture Integration

```
[Components/Pages] → use → [Service Layer] → [Backend/API or Fallback]
```

## Technical Challenges & Solutions

Problem: Identifying all direct fetch/API calls in components
Solution: Use code search and review to ensure all are refactored

Problem: Updating tests to mock service layer
Solution: Use Jest/RTL mocks for service functions

## Testing Implementation

All refactored components/pages must pass existing and new tests with service layer mocked

---

_Last updated: 2025-11-10_
