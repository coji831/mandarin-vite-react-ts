# Implementation 12-4: Display and Toggle Pinyin/English in Conversation UI

**Epic:** [epic-12-conversation-ui-enhancements](../../business-requirements/epic-12-conversation-ui-enhancements/README.md)
**Story:** [story-12-4-toggle-pinyin-english](../../business-requirements/epic-12-conversation-ui-enhancements/story-12-4-toggle-pinyin-english.md)
**Last Update:** 2025-11-16
**Status:** Completed

## Technical Scope

- UI toggle controls for pinyin and English in ConversationBox and ConversationTurns components
- User preferences persisted in localStorage
- Accessibility: ARIA attributes, keyboard navigation, color contrast
- Unit/component tests for all toggle logic

## Implementation Details

```typescript
// Example: Toggle logic in ConversationBox
const [showPinyin, setShowPinyin] = useState(() => getSettingFromStorage("showPinyin", true));
const handleTogglePinyin = useCallback(() => {
  setShowPinyin((prev) => {
    setSettingToStorage("showPinyin", !prev);
    return !prev;
  });
}, []);

// ConversationTurns receives showPinyin/showEnglish as props
<ConversationTurns turns={conversation.turns} showPinyin={showPinyin} showEnglish={showEnglish} />;
```

## Architecture Integration

Conversation UI integrates toggle controls and persists preferences via localStorage. Accessibility features (ARIA, keyboard navigation) are built into the UI components. All state and logic are managed in the ConversationBox and ConversationTurns components, following the feature folder and state management conventions.

```
[ConversationBox]
  ├─ [Toggle Controls]
  ├─ [ConversationTurns]
  └─ [PlaybackControls]
      ↑
  [useAudioPlayback, useConversationGenerator]
```

## Technical Challenges & Solutions

Problem: Preventing UI clutter/confusion with additional controls
Solution: Used clear, intuitive toggle buttons, grouped together, and styled for clarity

Problem: Ensuring accessibility for all users
Solution: Added ARIA attributes, ensured keyboard navigation, and verified color contrast

## Testing Implementation

- Unit/component tests for toggles and display logic (see ConversationTurns.test.tsx)
- Edge cases: toggles persist, accessibility, rapid toggling
- All tests pass for toggle logic, persistence, and accessibility

## Documentation

- Feature design doc updated for UI/UX changes
- See business requirements: [story-12-4-toggle-pinyin-english.md](../../../business-requirements/epic-12-conversation-ui-enhancements/story-12-4-toggle-pinyin-english.md)
