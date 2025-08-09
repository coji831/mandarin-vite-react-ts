# User Story 2: Set Daily Word Commitment

Part of [Epic 2: Vocabulary Learning Flow](../epic-2-vocabulary-learning-flow.md)

## Description

As a language learner, I want to set a daily word commitment, so that I can pace my learning and track my progress toward completing the vocabulary list.

## Acceptance Criteria

- User can input the number of words they want to learn each day
- System validates the input to ensure it's a reasonable number
- System calculates and displays the estimated completion time based on the commitment
- User's commitment is saved and persisted between sessions

## Implementation Notes

- Created DailyCommitment component
- Implemented input validation (min/max words per day)
- Added calculation for estimated completion days
- Updated Mandarin page to integrate this component
- Stored commitment data in localStorage

## Status

Completed
