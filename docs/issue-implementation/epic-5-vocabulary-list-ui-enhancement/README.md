src/features/mandarin/pages/
src/features/mandarin/pages/

# Epic 5: Vocabulary List UI Enhancement

## 📌 Executive Summary

**Goal:** Refactor the vocabulary list selection interface to a modern, card-based, metadata-rich, and responsive UI with advanced search and filtering.

**Key Points:**

- Card-based grid layout for vocabulary lists
- Metadata (word count, difficulty, tags) on each card
- Real-time search and filtering
- Responsive and accessible design
- Visual feedback and progress indicators

**Status:** Planned

## Technical Overview

**Implementation Goal:** Redesign the vocabulary list selection page to improve usability, information density, and accessibility, while maintaining compatibility with the CSV-based vocabulary system.

**Status:** Planned

**Last Updated:** October 2, 2025

## Architecture Decisions

1. **Componentization:** Use dedicated components (VocabularyCard, SearchBar, FilterTags, EmptyState) for modularity and maintainability.
2. **CSS Grid Layout:** Use CSS Grid for responsive card layout, avoiding external UI libraries for performance and consistency.
3. **Metadata Schema Extension:** Extend `VocabularyList` type and `vocabularyLists.json` to support metadata fields, with backward compatibility.
4. **State Management:** Use React's built-in hooks for local state (search/filter), keeping global state minimal.
5. **Accessibility:** Ensure all UI elements are keyboard navigable and meet WCAG color/contrast standards.
6. **Progressive Enhancement:** UI works with or without new metadata fields.

## Technical Implementation

### Architecture

```
User
   ↓
VocabularyListPage.tsx
   ├─ SearchBar.tsx
   ├─ FilterTags.tsx
   ├─ EmptyState.tsx
   └─ VocabularyCard.tsx (for each list)
         └─ [Metadata, Progress, Select Button]
```

**Data Flow:**

- Vocabulary lists loaded from CSV/JSON
- Local state for search/filter
- Filtered lists rendered as cards
- Card click triggers list selection

### Data Model Changes

Extend `VocabularyList` in `src/features/mandarin/types/Vocabulary.ts`:

```typescript
export type VocabularyList = {
  name: string;
  description: string;
  file: string;
  wordCount?: number;
  difficulty?: "beginner" | "intermediate" | "advanced";
  tags?: string[];
  estimatedTimeMinutes?: number;
};
```

### Component Relationships

- `VocabularyListPage` is the main container
- `SearchBar` and `FilterTags` update local state
- `VocabularyCard` displays list info and metadata
- `EmptyState` shows when no results match

### API Endpoints

N/A (all data is local or static for this epic)

## Story-by-Story Technical Breakdown

### Story 5.1: Card-Based Layout Implementation

- **Components:** `VocabularyCard`, `VocabularyListPage`
- **UI/UX:** Grid layout, card structure, select button
- **State:** List of vocabulary lists
- **Key Steps:**
  1.  Create `VocabularyCard` component
  2.  Refactor `VocabularyListPage` to render cards in a grid
  3.  Remove sample word display from main list
  4.  Add basic hover/focus states
  5.  Ensure responsive grid with CSS Grid
- **Edge Cases:** Long list names/descriptions, empty list
- **Testing:** Unit tests for card rendering, manual responsive checks

### Story 5.2: Metadata Integration and Display

- **Components:** `VocabularyCard`, data model
- **UI/UX:** Show word count, difficulty, tags on card
- **State:** Metadata fields in each list
- **Key Steps:**
  1.  Extend `VocabularyList` type and JSON schema
  2.  Update card to display metadata
  3.  Add color coding for difficulty
  4.  Add tooltips for metadata fields
- **Edge Cases:** Missing metadata, long tag lists
- **Testing:** Visual checks, accessibility for color/contrast

### Story 5.3: Search and Filtering Functionality

- **Components:** `SearchBar`, `FilterTags`, `VocabularyListPage`
- **UI/UX:** Real-time search/filter, clear all, empty state
- **State:** Search/filter state in parent
- **Key Steps:**
  1.  Implement search input with debouncing
  2.  Add filter tags for difficulty and categories
  3.  Combine search and filter logic
  4.  Show `EmptyState` if no results
- **Edge Cases:** No matches, multiple filters, case/diacritic insensitivity
- **Testing:** Unit tests for filter logic, manual filter/search checks

### Story 5.4: Visual Enhancements and Responsive Design

- **Components:** All UI components
- **UI/UX:** Responsive layout, visual feedback, progress indicators, dark mode
- **State:** Progress status, theme
- **Key Steps:**
  1.  Add progress indicators to cards
  2.  Implement dark mode and theming
  3.  Add animations for card interactions
  4.  Ensure all elements are accessible and responsive
- **Edge Cases:** Small screens, high-contrast mode, reduced motion
- **Testing:** Accessibility audits, device/browser testing

## Design Decisions & Tradeoffs

1. **CSS Modules vs. Styled Components:** CSS Modules chosen for simplicity and performance.
2. **No external UI libraries:** Maintains consistent look and reduces bundle size.
3. **Local state for filters/search:** Avoids unnecessary global state complexity.
4. **Progressive enhancement:** UI works with partial metadata.

## Known Issues & Limitations

1. Metadata may be missing for some lists (fallbacks required)
2. Large list sets may require virtualization in the future
3. CSS Grid support is required (older browsers may have issues)

## Testing Information

### Unit Tests

- Card rendering with/without metadata
- Search/filter logic
- Progress indicator display

### Integration Tests

- Data loading and transformation
- Search/filter interaction
- Responsive layout

### Manual Testing Checklist

- Responsive layout on all device sizes
- Keyboard navigation and screen reader compatibility
- Filter/search combinations
- Dark mode and accessibility

## Component Reference

1. `VocabularyListPage.tsx` (main container)
2. `VocabularyCard.tsx` (card UI)
3. `SearchBar.tsx` (search input)
4. `FilterTags.tsx` (filter controls)
5. `EmptyState.tsx` (empty results)

## References

- [Business Requirements Epic 5](../../business-requirements/epic-5-vocabulary-list-ui-enhancement/README.md)
- [Story 5.1](../../business-requirements/epic-5-vocabulary-list-ui-enhancement/story-5-1-card-based-layout-implementation.md)
- [Story 5.2](../../business-requirements/epic-5-vocabulary-list-ui-enhancement/story-5-2-metadata-integration-display.md)
- [Story 5.3](../../business-requirements/epic-5-vocabulary-list-ui-enhancement/story-5-3-search-filtering-functionality.md)
- [Story 5.4](../../business-requirements/epic-5-vocabulary-list-ui-enhancement/story-5-4-visual-enhancements-responsive-design.md)
- [React performance optimization](https://reactjs.org/docs/optimizing-performance.html)
- [CSS Grid guide](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout)
- [Current VocabularyListPage](../../../src/features/mandarin/pages/VocabularyListPage.tsx)

## Completion Checklist

- [ ] Card-based layout implemented
- [ ] Metadata displayed on cards
- [ ] Search and filtering functional
- [ ] Responsive and accessible design
- [ ] Visual feedback and progress indicators
- [ ] All acceptance criteria from stories met
