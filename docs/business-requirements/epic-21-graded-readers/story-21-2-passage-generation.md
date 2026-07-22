# Story 21.2: Passage Generation Backend

## Description

**As a** learner,
**I want to** receive AI-generated reading passages on demand that are accurately segmented and leveled to my ability,
**So that** I always have fresh, level-appropriate reading material.

## Business Value

This story builds the entire server-side foundation for the graded readers feature. It enables AI-generated reading passages via Gemini, smart word segmentation against the word index, and reliable error handling. Together with the data foundation (Story 21.1), it powers the reading experience that learners interact with in Story 21.3.

## Acceptance Criteria

- [ ] Gemini API integration for passage generation (free prompt, 5 beginner topics, JSON format enforced)
- [ ] Backend segmenter: parses passage text into words against word index, caches segmented result
- [ ] Error-catching middleware for Gemini, TTS, and Segmenter services with typed error classes
- [ ] Passage stores plain text only — segmented result cached separately
- [ ] HSK profile computed by segmenter and cached alongside passage
- [ ] Rate limiting: max 5 generation requests per user per day, 0 for guests
- [ ] Max total passages per user limit enforced
- [ ] GeminiService updated with `generatePassage()` method (no 500-char cap)

## Business Rules

1. **Gemini returns JSON** — Response format: `{ "sentences": [{ "index": 0, "text": "我今天去学校。" }] }`. Backend parses, segments, caches.
2. **5 predefined beginner topics**: (1) School life, (2) Daily routine, (3) Family, (4) Weather & seasons, (5) Shopping & food. User selects topic.
3. **Rate limiting**: Authenticated users: 5 generations/day. Guests: 0. Max 20 passages per HSK level in DB.
4. **Backend segments at read time** — Passage stored as plain text. Segmenter identifies word boundaries using in-memory word index at read time.
5. **HSK profile computed lazily** — `hskProfile` (e.g., 70% HSK 2, 20% HSK 3, 10% unknown) computed by segmenter on first read, cached alongside passage.
6. **Three-tier cache** — Lightweight word index (~500KB) at startup. Full word data loaded lazily for passage words and user-tapped words.
7. **GeminiService.MAX_OUTPUT_LENGTH = 500** must be increased — Add `generatePassage()` method without the 500-char truncation (do not modify existing `generateText()`).
8. **Error-catching middleware** per external service (Gemini, TTS, Segmenter). Typed error classes. Consumers handle at their level. User sees fallback UI per error type.
9. **API endpoints** — `GET /v1/readers/passages?hskLevel=N` (list cached), `GET /v1/readers/passages/:id` (detail with segmentation + audio), `POST /v1/readers/generate` (generate, auth-only, body: `{ topic }`). All require authentication.

## Related Issues

- Epic 21: Graded Readers — BR (`../README.md`) (epic parent)
- **Story 21.1: Data Lifecycle** ([BR](story-21-1-data-lifecycle.md)) (dependency — must be completed first)
- **Story 21.3: Reading UI + LexicalHub Phase 1** ([BR](story-21-3-reading-ui-lexical-hub.md)) (consumer of this API)

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
