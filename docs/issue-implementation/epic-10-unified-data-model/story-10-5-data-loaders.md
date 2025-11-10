# Implementation 10-5: Refactor Data Loaders

## Technical Scope

Refactor data loaders to output normalized objects matching the new types, ensuring reliable and consistent state initialization.

## Implementation Details

```typescript
// Example loader output
const vocabByWordId = csvLoader(csvData);
```

- Update loader logic to output normalized objects
- Ensure loaded data matches unified types
- Add tests for loader output and state shape

## Architecture Integration

Data loaders initialize state for vocabulary and progress, supporting unified data flow and maintainable architecture.

## Technical Challenges & Solutions

Problem: Migrating legacy loader logic
Solution: Incremental updates and thorough testing

## Testing Implementation

- Unit tests for loader output
- Integration tests for state initialization
