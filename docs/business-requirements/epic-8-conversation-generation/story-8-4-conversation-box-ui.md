# Story 8.4: Conversation Box UI: wire to scaffolder

## Description

**As a** learner,
**I want to** view conversation examples on flashcard detail pages,
**So that** I can see vocabulary words used in realistic dialogue context and understand practical usage.

## Business Value

This story delivers the core user-facing feature that provides contextual conversation examples to language learners. By showing vocabulary in realistic dialogue, learners can better understand word usage, tone, and context, significantly improving their language comprehension and retention. This addresses a key gap in traditional flashcard learning by providing practical usage examples.

## Acceptance Criteria

- [ ] Conversation Box component renders conversation turns with proper formatting
- [ ] Component displays speaker labels and dialogue text clearly
- [ ] "View Example" button triggers conversation loading from scaffolder endpoint
- [ ] Loading and error states are handled gracefully with appropriate UI feedback
- [ ] Component supports toggle between scaffolder and generator mode via feature flag
- [ ] Speech synthesis fallback works for interactive development using browser TTS
- [ ] Turn-by-turn highlighting works during audio playback
- [ ] Component is responsive and works well on mobile devices

## Business Rules

1. Conversations must be displayed in easy-to-read dialogue format
2. Each speaker turn must be visually distinct and clearly labeled
3. Audio playback controls must be accessible and intuitive
4. Component must gracefully handle network failures and missing data
5. Feature flag must allow seamless switching between scaffolder and real generator

## Related Issues

- #8-1 / [**Design Conversation Schema & Scaffolder**](./story-8-1-design-schema-and-scaffolder.md) (Dependency)
- #8-2 / [**Scaffolder — Text endpoint**](./story-8-2-scaffolder-text-endpoint.md) (Dependency)
- #8-3 / [**Scaffolder — Audio endpoint (deterministic)**](./story-8-3-scaffolder-audio-endpoint.md) (Dependency)
- #8-5 / [**Generator — Text generation & cache (backend)**](./story-8-5-generator-text-cache.md) (Will integrate with this UI)

## Implementation Status

- **Status**: Planned
- **PR**: #[PR-NUMBER]
- **Merge Date**: [Date]
- **Key Commit**: [commit-hash] ([Brief commit description])

## User Journey

1. Learner views flashcard detail page for vocabulary word
2. Learner clicks "View Example" button to see conversation
3. Conversation Box loads and displays sample dialogue using the word
4. Learner reads through conversation turns to understand word usage
5. Learner optionally clicks play button to hear conversation audio
6. Audio plays with turn-by-turn highlighting for better comprehension
7. Learner gains contextual understanding of vocabulary word usage
