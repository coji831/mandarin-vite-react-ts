# Epic 3: State Management Refactor for Mandarin Feature

## Technical Overview

**Implementation Goal:** Refactor the Mandarin feature's state management to decouple UI and data logic, centralize progress type definitions, and improve persistence handling.

- **Reduced Component Complexity**: `Mandarin.tsx` is now 60% smaller and focuses only on page navigation
- **Improved Code Organization**: Clear separation between data management and UI concerns
- **Centralized Progress Types**: All progress-related types are now in `Progress.ts` and imported via the barrel file
- **Centralized LocalStorage Logic**: All localStorage operations are handled in the custom hook (`useMandarinProgress`)
- **Context-Based State Management**: Progress state and actions are provided via `ProgressContext.tsx` and `ProgressProvider` at the router level
- **Main Component Consumes Context**: `Mandarin.tsx` uses `useProgressContext` for progress state/actions
- **Eliminated Prop Drilling**: Components access only the state they need directly from context
- **Better Testability**: Hook logic can be tested independently of components
- **Easier Maintenance**: Changes to data management don't require updates to UI components
- **Preserved Functionality**: All features work identically to before the refactor

## Known Issues & Limitations

- **Performance**: Context updates trigger re-renders in all consuming components
- **Typescript Complexity**: Type definitions for context require careful management
- **Testing Overhead**: Components using context require test wrapper configuration
- **Documentation**: New pattern requires thorough documentation for team adoption
- **Developer Learning Curve**: Team members need to understand React hooks and context API

## Configuration

```
# No configuration files or environment variables required

# Development Notes:
- React Context API is used natively without additional libraries
- TypeScript strict mode is enabled for all new files
- Jest testing environment includes context providers
```

## Testing Information

**Test Strategy**:

- Unit tests for the custom hook in isolation
- Integration tests for components with context
- End-to-end tests for key user workflows

**Key Test Cases**:

- Hook state management with localStorage persistence
- Context error handling when used outside provider
- Component rendering with various context states
- Performance benchmarks before and after refactor

## References

- [React Context API Documentation](https://reactjs.org/docs/context.html)
- [React Hooks Documentation](https://reactjs.org/docs/hooks-intro.html)
- [Epic 2 Implementation](/docs/issue-implementation/epic-2-vocabulary-learning-flow/README.md)
- [Team Discussion on State Management Approaches](link-to-discussion-thread)

## Results and Benefits

- **Reduced Component Complexity**: `Mandarin.tsx` is now 60% smaller and focuses only on page navigation
- **Improved Code Organization**: Clear separation between data management and UI concerns
- **Eliminated Prop Drilling**: Components access only the state they need directly from context
- **Better Testability**: Hook logic can be tested independently of components
- **Easier Maintenance**: Changes to data management don't require updates to UI components
- **Preserved Functionality**: All features work identically to before the refactor

## Lessons Learned

- Separating concerns early leads to more maintainable code
- Context should be used thoughtfully to avoid unnecessary re-renders
- Custom hooks are powerful for encapsulating complex logic

## Next Steps

- This refactoring prepares the ground for Epic 4: Routing Improvements
- Consider optimizing context with memoization if performance issues ariseom progress tracking and reduce prop drilling by implementing a custom hook and context-based state management pattern.

**Status:** Completed

**Last Update:** August 16, 2025

## Architecture Decisions

1. **Custom Hook Pattern**: Create a `useMandarinProgress` hook to encapsulate all progress tracking logic

   - Rationale: Separates data management from UI rendering
   - Alternative considered: Higher-order components (rejected due to complexity and composition issues)

2. **Context API**: Use React Context to make state and actions available throughout the component tree

   - Rationale: Native React solution that eliminates prop drilling
   - Alternative considered: Redux (rejected as overly complex for current requirements)

3. **Separation of Concerns**: Clearly separate UI state from data/progress state

   - Rationale: Improves maintainability and testability
   - Alternative considered: Single state management approach (rejected due to coupling issues)

4. **Zero Behavior Changes**: Refactoring should not change any user-facing behavior

   - Rationale: Ensures refactoring doesn't introduce regressions
   - Implementation: Comprehensive test coverage before and after changes

5. **Incremental Implementation**: Changes will be made in steps to ensure stability
   - Rationale: Reduces risk and allows for focused code reviews
   - Implementation: Four distinct implementation stories with clear boundaries

## Technical Implementation

- Created a new custom hook to manage all progress tracking logic
- Implemented a context provider to share state across components
- Updated components to consume context instead of props
- Ensured full test coverage for new hooks and context
- Updated documentation to reflect the new architecture

### Key Components Added/Modified

The following key components were added or modified as part of this refactoring. For detailed implementation code, please refer to the individual story implementation documents.

1. **useMandarinProgress**: New custom hook for progress tracking logic

   - Extracts all state and state management functions from Mandarin.tsx
   - Handles vocabulary selection, progress tracking, and section management
   - Located at `src/features/mandarin/hooks/useMandarinProgress.ts`
   - _See [Story 3-1](./story-3-1-create-custom-progress-tracking-hook.md) for detailed implementation_

2. **MandarinContext**: New context provider for state management

   - Wraps the custom hook in a React Context provider
   - Provides a consumer hook (useMandarin) for components
   - Located at `src/features/mandarin/context/MandarinContext.tsx`
   - _See [Story 3-2](./story-3-2-implement-context-provider.md) for detailed implementation_

3. **Mandarin.tsx**: Simplified main component using hooks and context

   - Reduced to only handling page navigation logic
   - Wraps children with MandarinProvider
   - Located at `src/features/mandarin/pages/Mandarin.tsx`
   - _See [Story 3-3](./story-3-3-refactor-components.md) for detailed implementation_

4. **Component Updates**: Various components updated to consume context directly
   - Components now import useMandarin() instead of receiving props
   - Simplified props interfaces with fewer dependencies
   - _See [Story 3-3](./story-3-3-refactor-components.md) for detailed implementation_

## Implementation Stories

This epic consists of the following implementation stories:

1. [Move Progress Tracking Logic to Custom Hook](./story-3-1-move-progress-logic-to-hook.md) - Move all progress tracking logic from the main component into a custom hook for maintainability.
2. [Add TypeScript Types and LocalStorage Handling to Hook](./story-3-2-add-types-and-localstorage-to-hook.md) - The hook uses strict TypeScript types and handles all localStorage operations internally.
3. [Create Context and Provider](./story-3-3-create-context-and-provider.md) - Create a context and provider to share Mandarin state and actions across components.
4. [Create Consumer Hook and Add Types](./story-3-4-create-consumer-hook-and-types.md) - Custom consumer hook implemented and strictly typed.
5. [Refactor VocabularyListSelector to Use Context](./story-3-5-refactor-vocabularylistselector.md) - VocabularyListSelector consumes context directly and removes progress-related props.
6. [Refactor DailyCommitment to Use Context](./story-3-6-refactor-dailycommitment.md) - DailyCommitment consumes context directly and removes progress-related props.
7. [Refactor SectionConfirm to Use Context](./story-3-7-refactor-sectionconfirm.md) - SectionConfirm consumes context directly and removes progress-related props.
8. [Refactor SectionSelect to Use Context](./story-3-8-refactor-sectionselect.md) - SectionSelect consumes context directly and removes progress-related props.
9. [Refactor FlashCard to Use Context](./story-3-9-refactor-flashcard.md) - FlashCard consumes context directly and removes progress-related props.
10. [Refactor Sidebar to Use Context](./story-3-10-refactor-sidebar.md) - Sidebar consumes context directly and removes progress-related props.

## Design Decisions & Tradeoffs

- **Reduced Component Complexity**: `Mandarin.tsx` is now 60% smaller and focuses only on page navigation
- **Improved Code Organization**: Clear separation between data management and UI concerns
- **Eliminated Prop Drilling**: Components access only the state they need directly from context
- **Better Testability**: Hook logic can be tested independently of components
- **Easier Maintenance**: Changes to data management don't require updates to UI components
- **Preserved Functionality**: All features work identically to before the refactor

## Lessons Learned

- Separating concerns early leads to more maintainable code
- Context should be used thoughtfully to avoid unnecessary re-renders
- Custom hooks are powerful for encapsulating complex logic

## Next Steps

- This refactoring prepares the ground for Epic 4: Routing Improvements
- Consider optimizing context with memoization if performance issues arise

## Related Issues

- #3-1 / [**Move Progress Tracking Logic to Custom Hook**](./story-3-1-move-progress-logic-to-hook.md)
- #3-2 / [**Add TypeScript Types and LocalStorage Handling to Hook**](./story-3-2-add-types-and-localstorage-to-hook.md)
- #3-3 / [**Create Context and Provider**](./story-3-3-create-context-and-provider.md)
- #3-4 / [**Create Consumer Hook and Add Types**](./story-3-4-create-consumer-hook-and-types.md)
- #3-5 / [**Refactor VocabularyListSelector to Use Context**](./story-3-5-refactor-vocabularylistselector.md)
- #3-6 / [**Refactor DailyCommitment to Use Context**](./story-3-6-refactor-dailycommitment.md)
- #3-7 / [**Refactor SectionConfirm to Use Context**](./story-3-7-refactor-sectionconfirm.md)
- #3-8 / [**Refactor SectionSelect to Use Context**](./story-3-8-refactor-sectionselect.md)
- #3-9 / [**Refactor FlashCard to Use Context**](./story-3-9-refactor-flashcard.md)
- #3-10 / [**Refactor Sidebar to Use Context**](./story-3-10-refactor-sidebar.md)
