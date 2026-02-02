# Epic 16: Word Example Simplification

## Epic Summary

**Goal:** Implement single-sentence usage examples as beginner-friendly alternative to multi-turn conversations, reducing cognitive load while enabling multiple usage contexts per word.

**Key Points:**

- Gemini API generates 3-5 single-sentence examples per word with HSK 1-3 vocabulary constraint
- Compact list UI displays examples simultaneously (no modal) with per-example audio playback buttons
- GCS caching with hash-based keys (wordId + difficulty + version) and 30-day lifecycle policy
- On-demand TTS generation reduces costs (audio only when user clicks play button)
- Frontend session cache reduces API calls for repeated example views within same session

**Status:** Planned

**Last Update:** February 2, 2026

## Technical Overview

This epic introduces single-sentence usage examples as a complement to existing conversation features. Examples use simpler grammar and vocabulary (HSK 1-3 restricted) to lower cognitive load for beginners while showcasing word versatility through multiple usage contexts.

**Current Conversation System:**

```javascript
// apps/backend/services/conversationService.js
// Generates 3-5 turn dialogues with full context
```

**New Example System:**

```javascript
// apps/backend/services/exampleService.js (new)
async function generateWordExamples(word, count = 3, difficulty = "beginner") {
  const prompt = `
    Generate ${count} simple Mandarin sentences using "${word}".
    Requirements:
    - Max 10 characters per sentence
    - Use only HSK 1-3 vocabulary
    - Show different usage contexts (verb, noun, formal, casual)
    
    Output JSON:
    [
      {
        "chinese": "我喜欢吃苹果",
        "pinyin": "Wǒ xǐhuan chī píngguǒ",
        "english": "I like to eat apples"
      }
    ]
  `;
  // Use existing Gemini API integration
}
```

**Scope:**

- Backend example generation service with Gemini API
- GCS caching layer (reuse conversation caching strategy)
- Frontend example panel component with compact list UI
- Per-example audio generation using existing TTS service
- Frontend session cache (sessionStorage)

## Architecture Decisions

1. **Complementary feature vs. replacement for conversations** — Examples target beginners; conversations target intermediate learners; UI offers both via tabs or toggle; maintains two generation systems

2. **3-5 examples per word vs. single best example** — Multiple examples showcase word versatility (different grammatical roles, contexts); tradeoff: higher API cost justified by learning value

3. **HSK 1-3 vocabulary restriction** — Prevents advanced grammar in examples; validation step checks vocabulary level against HSK database; tradeoff: limits example complexity but ensures accessibility

4. **On-demand audio generation vs. pre-generation** — Audio only generated when user clicks play button; reduces upfront TTS costs by ~70%; tradeoff: slight delay on first play (1-2 seconds)

## Technical Implementation

### Architecture

```
Frontend: Word Detail View
    ↓
[User clicks "View Examples" tab]
    ↓
WordExamplesPanel.tsx
    ↓
Check sessionStorage cache
    ↓ (cache miss)
POST /api/conversation/examples
  { wordId: "word123", count: 3, difficulty: "beginner" }
    ↓
Backend: exampleService.generateExamples()
    ↓
Check GCS cache (key: SHA-256(wordId + difficulty + version))
    ↓ (cache miss)
Call Gemini API with prompt
    ↓
Validate examples:
  - Max 10 characters
  - Target word present
  - Pinyin format correct
    ↓
Upload to GCS: {
  examples: [...],
  metadata: { generatedAt, version, difficulty }
}
    ↓
Return to frontend: [{ chinese, pinyin, english }]
    ↓
Store in sessionStorage
    ↓
Render ExampleListItem components
    ↓
[User clicks audio button]
    ↓
TTS generation (existing ttsService.js)
    ↓
Cache audio in GCS (same strategy as conversations)
    ↓
Play audio with HTMLAudioElement
```

### API Endpoints

**POST /api/conversation/examples**

**Body:**

```json
{
  "wordId": "word123",
  "count": 3,
  "difficulty": "beginner"
}
```

**Response:**

```json
{
  "examples": [
    {
      "chinese": "我喜欢苹果",
      "pinyin": "Wǒ xǐhuan píngguǒ",
      "english": "I like apples"
    },
    {
      "chinese": "苹果很好吃",
      "pinyin": "Píngguǒ hěn hǎochī",
      "english": "Apples are delicious"
    },
    {
      "chinese": "一个红苹果",
      "pinyin": "Yīgè hóng píngguǒ",
      "english": "A red apple"
    }
  ],
  "cacheHit": false,
  "generatedAt": "2026-02-02T10:30:00Z"
}
```

**POST /api/audio/generate** (existing, reused)

**Body:**

```json
{
  "text": "我喜欢苹果",
  "language": "zh-CN"
}
```

**Response:**

```json
{
  "audioUrl": "https://storage.googleapis.com/...",
  "duration": 2.5
}
```

### Component Relationships

```
WordDetailView.tsx
    ├─ <Tab label="Conversation"> (existing)
    │   └─ ConversationPanel.tsx
    └─ <Tab label="Examples"> (new)
        └─ WordExamplesPanel.tsx
            ├─ LoadingSpinner (while fetching)
            └─ ExampleList.tsx
                └─ ExampleListItem.tsx (×3-5)
                    ├─ <p className="chinese">{chinese}</p>
                    ├─ <p className="pinyin">{pinyin}</p>
                    ├─ <p className="english">{english}</p>
                    └─ <AudioButton onClick={playAudio} />
```

### Dependencies

**New Files:**

- `apps/backend/services/exampleService.js` (new)
- `apps/frontend/src/features/mandarin/components/WordExamplesPanel.tsx` (new)
- `apps/frontend/src/features/mandarin/components/ExampleListItem.tsx` (new)

**Modified Files:**

- `apps/backend/src/routes/conversationRoutes.js` (add `/examples` endpoint)
- `apps/frontend/src/features/mandarin/components/WordDetailView.tsx` (add Examples tab)

**No New Dependencies** (uses existing Axios client, Gemini API, TTS service, GCS)

### Testing Strategy

**Unit Tests:**

- `exampleService.test.js` - Test example generation with mocked Gemini API
  - Verify examples <10 characters
  - Verify target word present in each example
  - Verify pinyin format correct
- `WordExamplesPanel.test.tsx` - Test component rendering and audio playback

**Integration Tests:**

- `example-generation-flow.test.js` - Mock Gemini API, test full generation + caching flow
- `example-ui-integration.test.tsx` - Test tab switching, example loading, audio playback

**Manual Testing:**

- Generate examples for 10 different words, verify quality
- Test audio playback on mobile devices
- Verify GCS cache hit rate (should be >80% after initial generation)

### Performance Considerations

**Optimizations:**

- sessionStorage cache reduces redundant API calls within session
- GCS cache reduces AI generation costs (reuse examples across users)
- Lazy load audio (generate only when played)
- Lazy load ExamplesPanel component (code-split)

**Metrics to Monitor:**

- Example generation time (target: <2s for cache miss)
- Cache hit rate (target: >80%)
- TTS generation time per example (target: <1.5s)
- API cost per example request (target: <$0.01)

**Tradeoffs:**

- Multiple examples increase API cost vs. single example (3x cost, justified by learning value)
- On-demand audio adds latency on first play (1-2s delay, acceptable UX)

### Security Considerations

- Validate `wordId` exists in vocabulary database (prevent invalid requests)
- Rate limit example endpoint (max 50 requests/hour per user)
- Sanitize user input if allowing custom difficulty levels (prevent prompt injection)
- Validate Gemini API responses (detect malicious content, inappropriate examples)

### Migration Strategy

**Phase 1 (Story 16.1):**

- Add `exampleService.js` backend service
- Add `/api/conversation/examples` endpoint
- GCS caching implemented
- No UI changes (API only)

**Phase 2 (Story 16.2):**

- Create `WordExamplesPanel.tsx` and `ExampleListItem.tsx`
- Add Examples tab to `WordDetailView.tsx`
- Integrate with backend API
- Add sessionStorage cache

**Phase 3 (Story 16.3):**

- Add GCS lifecycle rules
- Optimize cache key generation
- Add performance monitoring
- Mobile optimization

**Rollback Plan:**

- Remove Examples tab from UI (conversation remains default)
- Disable `/api/conversation/examples` endpoint
- GCS cached data expires after 30 days automatically

### Documentation Updates

- Document example generation in `docs/architecture.md`
- Add API endpoint to `apps/backend/docs/api-spec.md`
- Document UI patterns in `docs/guides/code-conventions.md`
- Add user guide: `docs/guides/word-examples-guide.md`

---

**Related Documentation:**

- [Epic 16 BR](../../business-requirements/epic-16-word-examples/README.md)
- [Story 16.1 Implementation](./story-16-1-single-line-example-api.md)
- [Story 16.2 Implementation](./story-16-2-example-ui-component.md)
- [Story 16.3 Implementation](./story-16-3-example-caching-performance.md)
- [Epic 14: API Modernization](../epic-14-api-modernization/README.md) (dependency)
- [Epic 8: Conversation Generation](../epic-8-conversation-generation/README.md) (related)
- [Architecture Overview](../../architecture.md)
