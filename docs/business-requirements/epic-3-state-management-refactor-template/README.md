# Epic 3: State Management Refactor for Mandarin Feature

## Epic Summary

**Epic Goal:** Refactor the Mandarin feature's state management to decouple learning logic from progress tracking and reduce prop drilling by implementing a custom hook and context-based state management pattern.

**Status:** Planned

**Last Update:** August 16, 2025

## Background

The current implementation in `Mandarin.tsx` has two significant architectural issues:

1. **Coupled Logic**: Learning flow logic and progress tracking are tightly integrated, making the component difficult to maintain and extend.
2. **Prop Drilling**: State and handler functions are passed through multiple component layers, creating unnecessary dependencies.

This refactoring will address these issues by:

- Extracting progress tracking logic to a custom hook
- Implementing a context provider for state management
- Refactoring components to consume context directly
- Preserving all existing functionality

## Business Value

This refactoring provides significant value to the development team and users:

- **Improved Developer Experience**: Cleaner code structure and easier maintenance
- **Better Extensibility**: New features can be added more easily with decoupled components
- **Faster Bug Fixing**: Issues can be isolated and fixed more quickly
- **Enhanced Performance**: Potential for performance optimizations with reduced re-renders
- **Future-Proofing**: Better architecture supports future feature development

## Implementation Timeline

- **Phase 1 (Week 1)**: Create custom progress tracking hook and initial tests
- **Phase 2 (Week 1)**: Implement context provider and integration
- **Phase 3 (Week 2)**: Refactor components to use the new architecture
- **Phase 4 (Week 2)**: Update tests and documentation

## User Stories

This epic consists of the following user stories:

1. [**Move Progress Tracking Logic to Custom Hook**](../../issue-implementation/epic-3-state-management-refactor/story-3-1-move-progress-logic-to-hook.md)
   - As a developer, I want to move all progress tracking logic from the main component into a custom hook for maintainability.
2. [**Add TypeScript Types and LocalStorage Handling to Hook**](../../issue-implementation/epic-3-state-management-refactor/story-3-2-add-types-and-localstorage-to-hook.md)
   - As a developer, I want the hook to use strict TypeScript types and handle all localStorage operations internally.
3. [**Create Context and Provider**](../../issue-implementation/epic-3-state-management-refactor/story-3-3-create-context-and-provider.md)
   - As a developer, I want to create a context and provider to share Mandarin state and actions across components.
4. [**Create Consumer Hook and Add Types**](../../issue-implementation/epic-3-state-management-refactor/story-3-4-create-consumer-hook-and-types.md)
   - As a developer, I want a custom hook for consuming context and strict typing for all context values.
5. [**Refactor VocabularyListSelector to Use Context**](../../issue-implementation/epic-3-state-management-refactor/story-3-5-refactor-vocabularylistselector.md)
   - As a developer, I want VocabularyListSelector to consume context directly and remove progress-related props.
6. [**Refactor DailyCommitment to Use Context**](../../issue-implementation/epic-3-state-management-refactor/story-3-6-refactor-dailycommitment.md)
   - As a developer, I want DailyCommitment to consume context directly and remove progress-related props.
7. [**Refactor SectionConfirm to Use Context**](../../issue-implementation/epic-3-state-management-refactor/story-3-7-refactor-sectionconfirm.md)
   - As a developer, I want SectionConfirm to consume context directly and remove progress-related props.
8. [**Refactor SectionSelect to Use Context**](../../issue-implementation/epic-3-state-management-refactor/story-3-8-refactor-sectionselect.md)
   - As a developer, I want SectionSelect to consume context directly and remove progress-related props.
9. [**Refactor FlashCard to Use Context**](../../issue-implementation/epic-3-state-management-refactor/story-3-9-refactor-flashcard.md)
   - As a developer, I want FlashCard to consume context directly and remove progress-related props.
10. [**Refactor Sidebar to Use Context**](../../issue-implementation/epic-3-state-management-refactor/story-3-10-refactor-sidebar.md)

- As a developer, I want Sidebar to consume context directly and remove progress-related props.

## Story Breakdown Logic

This epic has been divided into 10 distinct stories to facilitate incremental development:

1. **Move Progress Tracking Logic to Custom Hook**
2. **Add TypeScript Types and LocalStorage Handling to Hook**
3. **Create Context and Provider**
4. **Create Consumer Hook and Add Types**
5. **Refactor VocabularyListSelector to Use Context**
6. **Refactor DailyCommitment to Use Context**
7. **Refactor SectionConfirm to Use Context**
8. **Refactor SectionSelect to Use Context**
9. **Refactor FlashCard to Use Context**
10. **Refactor Sidebar to Use Context**

This breakdown allows developers to focus on one aspect at a time, making code reviews more focused and reducing the risk of regressions.

## Acceptance Criteria

- [ ] Custom hook `useMandarinProgress` successfully encapsulates all progress tracking logic
- [ ] Context provider `MandarinContext` is implemented and provides state to components
- [ ] Consumer hook is created and all context values are strictly typed
- [ ] VocabularyListSelector, DailyCommitment, SectionConfirm, SectionSelect, FlashCard, and Sidebar are refactored to use context
- [ ] All existing functionality works identically after refactoring

## Implementation Plan

1. Move all progress tracking logic to a custom hook
2. Add TypeScript types and localStorage handling to the hook
3. Create context and provider
4. Create consumer hook and add types
5. Refactor VocabularyListSelector to use context
6. Refactor DailyCommitment to use context
7. Refactor SectionConfirm to use context
8. Refactor SectionSelect to use context
9. Refactor FlashCard to use context
10. Refactor Sidebar to use context

## Technical Context

This epic is focused on internal code architecture and does not directly depend on other features. However, it is foundational for Epic 4: Routing Improvements, which will build on this improved architecture.

## Dependencies

- None

## Related Issues

- #2 (Initial implementation of Mandarin feature)

## Technical Implementation Reference

See the detailed technical documentation at:  
[Epic 3: State Management Refactor](../../issue-implementation/epic-3-state-management-refactor/README.md)

## Future Considerations

- Explore advanced state management patterns like Redux if application complexity increases
- Consider performance optimizations using React.memo and useMemo for context consumers
- Evaluate the pattern for adoption in other feature areas
- Add telemetry to track performance improvements
