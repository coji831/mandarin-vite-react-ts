# Story 5.2: Metadata Integration and Display

## Description

**As a** language learner,
**I want to** see key information about each vocabulary list (word count, difficulty level, tags),
**So that** I can make better-informed decisions about which list to study.

## Business Value

Empowers users to make informed choices by surfacing relevant metadata, reducing time spent on trial and error, and increasing satisfaction with the learning experience. Supports better alignment of study materials with user goals.

## Acceptance Criteria

- [x] Each vocabulary card displays the total word count
- [x] Each vocabulary card shows the difficulty level (beginner, intermediate, advanced)
- [x] Tags are displayed on each card to indicate content categories (e.g., HSK level, topics)
- [x] Metadata is visually distinct from list name and description
- [x] Difficulty level is indicated with both text and visual cues (e.g., color coding)
- [x] Metadata displays consistently across different card sizes
- [x] Word count accurately reflects the actual number of terms in each list
- [x] Tooltips or explanations are available for metadata fields

## Business Rules

1. Difficulty levels must be categorized as "beginner," "intermediate," or "advanced"
2. Tags should be limited to 3-5 per list to prevent visual clutter
3. Word count must be accurate and automatically updated if list content changes
4. Difficulty level should be determined by a combination of factors (e.g., character complexity, usage frequency)
5. Visual indicators for difficulty must follow accessibility guidelines for color contrast

## Related Issues

- #TBD / **Card-Based Layout Implementation** (Dependency)
- #TBD / **Search and Filtering Functionality** (Related)

## Technical Considerations

## Implementation Status

Status: Completed

- Metadata will need to be added to the vocabularyLists.json schema
- The VocabularyList type will need to be extended with optional fields for backward compatibility
- Word count can be calculated dynamically or stored as a pre-computed value
- Color coding for difficulty levels must meet WCAG accessibility standards

## Test Cases

1. **Display Accuracy:**

   - All metadata fields display correctly for lists with complete metadata
   - Lists with missing metadata fields show appropriate defaults or placeholders

2. **Visual Testing:**

   - Metadata is clearly visible on cards of different sizes
   - Color coding is distinguishable even with color vision deficiencies

3. **Responsiveness:**
   - Metadata remains legible across all supported device sizes
   - Layout adapts appropriately when metadata content is longer than expected

## User Experience

This feature enhances the vocabulary selection experience by providing information-rich cards that help users quickly assess whether a list matches their needs. The addition of difficulty indicators and tags allows users to filter their options visually before even using the search functionality, creating a more efficient and satisfying selection process.

This feature directly addresses user feedback requesting more information about list content before selection, reducing the frustration of selecting inappropriate lists and then having to return to the selection screen.
