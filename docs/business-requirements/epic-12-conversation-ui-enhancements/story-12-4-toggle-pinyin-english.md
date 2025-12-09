# Story 12.4: Display and Toggle Pinyin/English in Conversation UI

## Description

**As a** Mandarin learner,
**I want to** view pinyin and English meaning for each line in a generated conversation, and toggle their visibility,
**So that** I can understand pronunciation and meaning flexibly and practice more effectively.

## Business Value

This feature increases accessibility and learning flexibility for users by allowing them to reveal or hide pinyin and English translations as needed. It supports different learning styles, improves comprehension, and helps users focus on either reading or listening skills as desired. It also aligns the product with best practices in language learning apps, improving user satisfaction and retention.

## Acceptance Criteria

- [x] UI displays Chinese, pinyin, and English for each turn in a conversation.
- [x] User can toggle pinyin and English on/off for all turns or per turn.
- [x] User preferences for toggles persist across sessions (localStorage/context).
- [x] Accessibility is verified (keyboard, ARIA, color contrast).
- [x] Unit/component tests cover all display and toggle logic.

## Business Rules

1. By default, both pinyin and English are visible for all conversation turns.
2. Toggling pinyin or English applies to all turns in the current conversation.
3. User preferences for toggles are saved in localStorage and restored on reload.
4. All toggle controls must be accessible via keyboard and have appropriate ARIA attributes.
5. UI must not break or become cluttered when toggles are used rapidly or in sequence.

## Related Issues

- #12.3 / [**Update Conversation API to Return Rich ConversationTurn Structure**](./story-12-3-update-conversation-api.md) (dependency)

## Implementation Status

- **Status**: Completed
- **PR**: [pending or add PR number]
- **Merge Date**: 2025-11-16
- **Key Commit**: [pending or add commit hash] (Implements UI toggles, persistence, and tests)
