# User Story 1: Select Vocabulary List from Mandarin Page

Part of [Epic 2: Vocabulary Learning Flow](../epic-2-vocabulary-learning-flow.md)

## Description

As a language learner, I want to select from multiple vocabulary lists (such as HSK 3.0 lists) on the Mandarin page, so that I can focus on the specific vocabulary set I want to learn.

## Acceptance Criteria

- User can see a list of available vocabulary lists on the Mandarin page
- Each list shows its name and approximate word count
- User can select a list, and the selection is visually indicated
- Selected list's data is loaded and available for the next steps in the flow

## Implementation Notes

- Created VocabularyListSelector component
- Added HSK 3.0 vocabulary lists as JSON data
- Implemented state management to track selected list
- Updated Mandarin page to display the component

## Status

Completed
