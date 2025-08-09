# User Story 5: Update Flashcard Page to Support Selected Section

Part of [Epic 2: Vocabulary Learning Flow](../epic-2-vocabulary-learning-flow.md)

## Description

As a language learner, I want the flashcard page to display only words from my selected section, so that I can focus on learning that specific set of words.

## Acceptance Criteria

- Flashcard page loads with only words from the selected section
- Sidebar shows only words from the selected section
- Words maintain their original data (character, pinyin, meaning)
- Audio playback (TTS) works for the words in the section

## Implementation Notes

- Updated FlashCard component to work with section-filtered data
- Modified Sidebar component to display only words from selected section
- Ensured TTS integration works with the filtered word list
- Added navigation breadcrumb to show current section
- Implemented toggle switches for showing/hiding pinyin and meaning

## Status

Completed
