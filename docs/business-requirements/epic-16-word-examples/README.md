# Epic 16: Word Example Simplification

## Epic Summary

**Goal:** Replace verbose 3-5 turn conversation examples with concise single-line usage examples to accelerate comprehension and enable showing multiple use cases per word.

**Key Points:**

- Single-sentence examples under 10 characters reduce cognitive load for beginners vs. multi-turn dialogues
- Generate 3-5 examples per word using Gemini API, showcasing different contexts and sentence patterns
- Compact list UI displays multiple examples simultaneously vs. modal-based conversation view
- Per-example audio playback (single sentence TTS) reduces generation cost and latency
- Cache examples in GCS with same strategy as conversations (hash-based keys, 30-day lifecycle)

**Status:** Planned

**Last Update:** February 2, 2026

## Background

The current conversation feature generates 3-5 turn dialogues demonstrating vocabulary in context. While educational, these conversations present challenges for beginners:

**Current Pain Points:**

- **Cognitive overload**: 3-5 turns require tracking multiple speakers and context across turns
- **Slow comprehension**: Users must read entire dialogue to find target word usage
- **Limited examples**: One conversation per word means seeing only one usage context
- **Verbose UI**: Modal dialog hides rest of interface; hard to compare examples
- **High TTS cost**: 3-5 turn audio generation expensive (~$0.05 per conversation)

**User Feedback Signals:**

- Beginners request "simpler examples"
- Users want to see multiple usage contexts quickly
- Mobile users find conversation modal cumbersome

**Business Rationale:**

- Simpler examples lower barrier to entry (improve onboarding completion)
- Multiple examples per word increase learning effectiveness
- Faster comprehension → higher user satisfaction
- Reduced TTS costs (single sentence vs. full dialogue)

This epic addresses these issues by introducing single-line examples as a complementary (or replacement) feature to conversations.

## User Stories

This epic consists of the following user stories:

1. [**Story 16.1: Single-Line Example API**](./story-16-1-single-line-example-api.md)
   - As a **backend developer**, I want to **generate and cache single-sentence usage examples via Gemini API**, so that **the frontend can display concise, beginner-friendly examples**.

2. [**Story 16.2: Example UI Component**](./story-16-2-example-ui-component.md)
   - As a **learner**, I want to **see 3-5 single-sentence examples for each word in a compact list**, so that **I can quickly understand different usage contexts without reading lengthy conversations**.

3. [**Story 16.3: Example Caching & Performance**](./story-16-3-example-caching-performance.md)
   - As a **backend developer**, I want to **cache generated examples in GCS with lifecycle policies**, so that **API costs remain low and response times are fast for subsequent users**.

## Story Breakdown Logic

This epic is divided into stories based on vertical slice approach:

- **Story 16.1** establishes backend API (Gemini generation, validation, caching)
- **Story 16.2** builds frontend UI (compact list display, audio playback buttons)
- **Story 16.3** optimizes performance (GCS caching, lifecycle rules, frontend cache)

Each story delivers incremental value and can be tested independently.

## Acceptance Criteria

- [ ] Backend generates 3-5 single-sentence examples per word via Gemini API
- [ ] Examples limited to 10 characters max (beginner-friendly length)
- [ ] Examples use HSK 1-3 vocabulary only (configurable difficulty)
- [ ] Each example includes: `{ chinese, pinyin, english }` fields
- [ ] Examples cached in GCS with hash-based keys (same strategy as conversations)
- [ ] Cache hit rate logged for monitoring
- [ ] Frontend displays examples in compact list format (not modal)
- [ ] Audio playback button per example (TTS for single sentence only)
- [ ] Examples load within 500ms for cached content
- [ ] Mobile-responsive layout (optimized for small screens)
- [ ] GCS lifecycle rule enforces 30-day retention for examples
- [ ] API documented in `apps/backend/docs/api-spec.md`

## Architecture Decisions

- **Decision: Single-sentence examples vs. full conversations** (Complementary, not replacement)
  - **Rationale**: Beginners benefit from simple examples; advanced learners still value contextual dialogues; offer both (tabs or toggle)
  - **Alternatives considered**: Replace conversations entirely, adaptive complexity
  - **Implications**: Maintain two generation systems; UI must accommodate both modes; users choose preference

- **Decision: 3-5 examples per word vs. single example** (Multiple examples)
  - **Rationale**: Different usage contexts improve understanding; showcases word versatility (verb vs. noun usage, formal vs. casual)
  - **Alternatives considered**: Single "best" example, unlimited examples
  - **Implications**: Higher API cost vs. single example; balanced against learning value

- **Decision: HSK 1-3 vocabulary restriction** (Controlled difficulty)
  - **Rationale**: Prevents overwhelming beginners with advanced grammar in examples; ensures accessibility
  - **Alternatives considered**: Adaptive difficulty based on user level, no restrictions
  - **Implications**: Requires HSK level tagging for vocabulary; limits example complexity

- **Decision: Per-example audio vs. combined audio file** (Granular playback)
  - **Rationale**: Users can replay individual examples vs. entire set; reduces initial TTS cost (generate only played examples)
  - **Alternatives considered**: Pre-generate all audio, no audio option
  - **Implications**: Higher UI complexity (5 buttons vs. 1); lower TTS costs (on-demand generation)

## Implementation Plan

1. Design JSON schema for example responses: `[{ chinese, pinyin, english }]`
2. Add `POST /api/conversation/examples` endpoint in backend
3. Implement Gemini API prompt for single-sentence generation
4. Add validation: Ensure examples <10 chars, include target word
5. Implement GCS caching with hash-based keys (wordId + difficulty level)
6. Add GCS lifecycle rule for 30-day retention
7. Create `WordExamplesPanel.tsx` component with compact list UI
8. Create `ExampleListItem.tsx` component with audio button
9. Add frontend cache for examples (session storage)
10. Integrate examples panel into word detail view (tab or toggle)
11. Add loading states and error handling
12. Implement per-example TTS generation (reuse existing `ttsService.js`)
13. Mobile-optimize layout (responsive grid, touch-friendly buttons)
14. Add analytics logging (cache hit rate, generation time)
15. Write unit tests for example generation and validation
16. Update API documentation
17. Add user preference: Examples vs. Conversations (localStorage toggle)

## Risks & Mitigations

- **Risk: AI generates examples with advanced grammar beginners can't understand** — Severity: Medium
  - **Mitigation**: Explicit prompt constraint: "Use HSK 1-3 vocabulary only"; validation step checks vocab level; manual review of first 100 examples
  - **Rollback**: Increase difficulty filter to HSK 1-2 only; add human curation queue

- **Risk: Users prefer conversations and don't use examples feature** — Severity: Medium
  - **Mitigation**: A/B test: Show examples by default for new users; track usage metrics (click rate, audio playback); gather user feedback
  - **Rollback**: Make examples opt-in (settings toggle); keep conversations as default

- **Risk: TTS costs increase if all examples generate audio upfront** — Severity: High
  - **Mitigation**: On-demand audio generation (only when user clicks play button); cache audio indefinitely in GCS
  - **Rollback**: Remove audio buttons; text-only examples

- **Risk: GCS cache misses due to hash collisions** — Severity: Low
  - **Mitigation**: Use SHA-256 hash with wordId + difficulty + version; include version in key for cache busting
  - **Rollback**: Increase hash length; add collision detection and regeneration

- **Risk: Example quality degrades (AI hallucinations, incorrect pinyin)** — Severity: Medium
  - **Mitigation**: Validation step checks pinyin accuracy with regex; detect target word presence; log suspicious examples for review
  - **Rollback**: Add human review queue; fallback to pre-curated examples

## Implementation notes

- **Conventions**: Follow `docs/guides/code-conventions.md` and `docs/guides/solid-principles.md`
- **API integration**: Reuse existing Gemini API setup from `apps/backend/services/conversationService.js`
- **Caching strategy**: Follow same GCS caching pattern as conversations (hash-based keys, 30-day lifecycle)
- **HSK vocabulary validation**: May require HSK level database or API; document if external dependency needed
- **Testing**: Manual review first 50-100 examples to validate quality before production rollout

---

**Related Documentation:**

- [Epic 16 Implementation](../../issue-implementation/epic-16-word-examples/README.md)
- [Story 16.1 BR](./story-16-1-single-line-example-api.md)
- [Story 16.2 BR](./story-16-2-example-ui-component.md)
- [Story 16.3 BR](./story-16-3-example-caching-performance.md)
- [Architecture Overview](../../architecture.md)
- [Epic 14: API Modernization](../epic-14-api-modernization/README.md) (dependency)
- [Epic 8: Conversation Generation](../epic-8-conversation-generation/README.md) (related)
