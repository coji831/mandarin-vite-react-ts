# Story 4.7: Update Section/List Selection Navigation

## Story Summary

**Story Goal:** Update navigation logic for vocabulary list and section selection to use React Router.

**Status:** Planned

**Epic:** Epic 4: Routing Improvements

## Background

The current implementation uses state changes (`setCurrentPage`) for navigation after selecting vocabulary lists and sections. This story focuses specifically on updating these key interaction points to use router navigation, which will maintain state and history correctly.

## Acceptance Criteria

- [ ] Update navigation in `VocabularyListSelector` component
- [ ] Update navigation in `SectionSelect` component
- [ ] Update navigation in `SectionConfirm` component
- [ ] Replace all relevant `setCurrentPage` calls with `navigate` calls
- [ ] Ensure state updates (like `setSelectedList`) still occur before navigation
- [ ] Document all navigation changes
- [ ] Create unit tests for updated navigation logic
- [ ] Verify all selection-based navigation works identically after refactoring

## Implementation Notes

Navigation should be updated like this:

```tsx
// Before
function VocabularyListSelector({ onNext }) {
  const handleSelectList = (listName) => {
    setSelectedList(listName);
    onNext(); // This calls setCurrentPage("dailycommitment")
  };
}

// After
function VocabularyListSelector() {
  const navigate = useNavigate();
  const { setSelectedList } = useMandarin();

  const handleSelectList = (listName) => {
    setSelectedList(listName);
    navigate("/mandarin/daily-commitment");
  };
}
```

Key updates:

- Replace callback props with direct navigation
- Ensure state updates happen before navigation
- Remove unnecessary prop drilling

## Estimated Time

- Development: 2 hours
- Testing: 1.5 hours
