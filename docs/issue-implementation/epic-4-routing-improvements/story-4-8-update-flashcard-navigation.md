# Story 4.8: Update Flashcard Navigation with Parameters

## Story Summary

**Story Goal:** Update navigation to flashcard pages to use route parameters for dynamic data.

**Status:** Planned

**Epic:** Epic 4: Routing Improvements

## Background

The current implementation uses state variables to determine which flashcards to display. This story focuses on updating flashcard navigation to use route parameters, enabling direct URL access to specific flashcard sections.

## Acceptance Criteria

- [ ] Update navigation to flashcard page to include section ID parameter
- [ ] Replace `setCurrentPage` calls with parameterized `navigate` calls
- [ ] Ensure sections are correctly loaded based on route parameters
- [ ] Update any components that navigate to or from the flashcard page
- [ ] Document all navigation changes
- [ ] Create unit tests for updated navigation logic
- [ ] Test direct URL access to different flashcard sections
- [ ] Verify flashcard navigation works identically after refactoring

## Implementation Notes

Navigation should be updated like this:

```tsx
// Before
function handleSectionSelect(sectionId) {
  setSelectedSectionId(sectionId);
  setCurrentPage("flashcards");
}

// After
function handleSectionSelect(sectionId) {
  navigate(`/mandarin/flashcards/${sectionId}`);
}
```

Key updates:

- Use route parameters for section IDs
- Extract parameters in the flashcard component
- Enable direct URL access to specific sections

## Estimated Time

- Development: 2 hours
- Testing: 1.5 hours
- Documentation: 30 minutes
- Total: 4 hours

## Dependencies

- Story #4.1: Create Nested Route Structure
- Story #4.2: Create Layout Component with Outlet
- Story #4.5: Convert Flashcard Page with Parameters
