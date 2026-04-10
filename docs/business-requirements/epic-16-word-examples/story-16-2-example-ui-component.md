# Story 16.2: Example UI Component

## Description

**As a** learner,
**I want to** see 3-5 single-sentence examples for each word in a compact list with per-example audio playback,
**So that** I can quickly understand different usage contexts without reading lengthy dialogues.

## Business Value

A compact examples panel increases scanability, helps beginners compare usage contexts quickly, and reduces friction on mobile devices compared to modal dialogs.

## Acceptance Criteria

- [ ] `WordExamplesPanel` displays **3–5** examples inline (not a modal) when examples exist for a word.
- [ ] Each example item shows `chinese` (prominent), `pinyin` (secondary), and a short `english` gloss.
- [ ] Each example has a Play button that requests on-demand TTS from the backend and plays audio when available.
- [ ] For cached example payloads, the panel renders within **500ms** on a typical mobile connection (cached response path).
- [ ] Mobile-responsive layout: touch targets >= 44px, readable typography on small screens.
- [ ] Accessible: Play buttons have understandable `aria-label`s, focusable via keyboard, and list semantics use `role=list` / `role=listitem` as appropriate.
- [ ] Unit + RTL tests cover rendering, skeleton loading state, error state, and Play button behavior.

## Business Rules

1. Examples are shown inline or in an expandable panel — never in a modal for this feature.
2. No more than 5 examples are rendered; additional examples are collapsed behind a “more” affordance.
3. The UI does not prefetch audio; audio is requested only when Play is pressed.
4. While fetching examples, the component shows compact skeleton rows matching final layout.
5. Emit analytics events: `examples_shown` (with cache_hit boolean) and `example_played` (with example_index, cache_hit).

## Related Issues

- [**Epic 16: Word Example Simplification**](./README.md) (Epic)
- [**Implementation: Example UI Component**](../../issue-implementation/epic-16-word-examples/story-16-2-example-ui-component.md) (Implementation)
- [**Story 16.1: Single-Line Example API (BR)**](./story-16-1-single-line-example-api.md) (Sibling)
- [**Story 16.3: Example Caching & Performance (BR)**](./story-16-3-example-caching-performance.md) (Sibling)

## Implementation Status

- **Status**: Completed
- **PR**:
- **Merge Date**: 2026-04-09
- **Key Commit**: dbae07c
- **Last Update**: 2026-04-09
