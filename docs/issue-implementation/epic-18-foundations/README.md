# Epic 18: Foundations — Implementation

**BR Reference:** `docs/business-requirements/epic-18-foundations/README.md`

---

## Architecture Decisions

| Decision                       | Choice                                               | Rationale                                                                 |
| ------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------- |
| **Pinyin data**                | Static JSON in `public/data/foundations/pinyin.json` | No backend needed. 21 initials + 39 finals + tone combinations are fixed. |
| **Stroke animations**          | Hanzi Writer npm library (MIT)                       | 9000+ chars, built-in playback, SVG-based. No backend.                    |
| **Audio**                      | Reuse existing AudioService/Google Cloud TTS         | Already implemented for vocabulary.                                       |
| **Character Detail Hub**       | React portal overlay component                       | Slides up from any context. No route change. Zustand store for state.     |
| **Hub progressive disclosure** | Phase gate check in Hub component                    | Sections appear/disappear based on `user_phase_gates` API response.       |
| **Quiz storage**               | Backend API (`POST /api/progress/quiz`)              | Phase gate data must persist (Decision #6).                               |

---

## Stories

### Story 17.1: Knowledge Hub Structure

**Files:** `src/features/knowledge-hub/`, router, `paths.ts`

**AC:** Routes for all 4-phase tabs. Phase-gated TabBar. 5-item global nav updated.

### Story 17.2: Pinyin System Guide

**Files:** `FoundationsPage.tsx`, `PinyinTab.tsx`, `TonesTab.tsx`

**AC:** Clickable initials grid (21) + finals grid (39). Tone-colored display (ˉred ˊorange ˇgreen ˋblue ·gray). Tone pair drills. Tone change rules (一, 不, 3rd tone sandhi).

**Data:** `public/data/foundations/pinyin.json`

### Story 17.3: Stroke Order Reference + Animations

**Files:** `StrokeReferenceTab.tsx`, `StrokeAnimTab.tsx`

**AC:** 8 basic strokes grid (点横竖撇捺提折钩). 4 stroke order rules with examples. Character search → Hanzi Writer SVG animation. Play/pause/step/speed controls.

### Story 17.4: Character Detail Hub

**Files:** `src/shared/components/CharacterDetailHub.tsx`, `src/shared/store/hubStore.ts`

**AC:** Slide-up overlay. Hero-center layout (64-72px character, stroke anim inline). Info orbiting (radicals left, examples right, mnemonic bottom, related below). Phase-gated sections. Inline popover variant for readers. Save to Review / Mark Learned. Esc to close.

**Replaces:** Existing `FlashCardPage` — redirect `/learn/flashcards/*` → `/learn/foundations`

### Story 17.5: Audio-to-Type Quiz

**Files:** `Phase1QuizPage.tsx`

**AC:** 20 randomized questions. Hear audio → type pinyin in text input → select tone marker (1-4 buttons). Instant feedback (correct/incorrect + play again). Progress bar with 90% pass target. Score ≥90% unlocks Phase 2. Results by category (Pinyin, Tones, Pairs, Rules).

---

## Risks

| Risk                                       | Mitigation                                            |
| ------------------------------------------ | ----------------------------------------------------- |
| Hanzi Writer performance for complex chars | SVG caching, limit simultaneous animations            |
| Hub slow on first open                     | Lazy-load component, preload decomposition data       |
| FlashCardPage removal breaks features      | Audit all imports before removal. Add route redirect. |
| Audio-to-Type quiz audio loading           | Preload TTS audio for common pinyin combinations      |

**Manual Testing:**

- Review content accuracy (sample 10% of entries for correctness)
- Test mobile responsiveness on iOS/Android devices
- Verify attribution links functional

### Performance Considerations

**Optimizations:**

- Lazy load knowledge sections (code-split by route)
- Lazy load SVG animations (only render when in viewport)
- Compress JSON files (minify, gzip)
- Cache JSON responses (Service Worker for offline support)

**Metrics:**

- JSON load time (target: <200ms for all files combined)
- SVG animation render time (target: <100ms)
- Knowledge Hub TTI (target: <2s on 3G)

**Tradeoffs:**

- 214 radicals + 100 SVGs = ~1.5MB total (acceptable for modern devices)
- No backend reduces latency but requires deployment for content updates

### Security Considerations

- Sanitize SVG files (remove embedded scripts, validate XML)
- Validate JSON schemas (prevent malformed data from breaking UI)
- Content Security Policy (CSP) headers for SVG rendering

### Migration Strategy

**Phase 1 (Story 17.1):**

- Create folder structure
- Add routing
- Landing page only (no content)

**Phase 2 (Stories 17.2-17.4):**

- Add foundational content (radicals, pinyin, strokes)
- Interactive components
- Mobile optimization

**Phase 3 (Stories 17.5-17.6):**

- Add production content (grammar, idioms)
- Search functionality
- SEO metadata

**Rollback Plan:**

- Remove `/knowledge` route from navigation
- Content files remain (no backend to clean up)
- Re-enable in future with feature flag

### Documentation Updates

- Document knowledge content sources in `docs/knowledge-base/content-sources.md`
- Add knowledge architecture to `docs/architecture.md`
- Create content contribution guide: `docs/guides/knowledge-content-contribution.md`

### Content JSON Schemas

**radicals.json:**

```json
[
  {
    "id": 1,
    "radical": "ä¸€",
    "pinyin": "yÄ«",
    "strokes": 1,
    "meaning": "one",
    "examples": ["ä¸€", "äºŒ", "ä¸‰", "å¤©"]
  }
]
```

**grammar-patterns.json:**

```json
[
  {
    "id": 1,
    "pattern": "Subject + æ˜¯ + Noun",
    "hskLevel": 1,
    "examples": [
      {
        "chinese": "æˆ‘æ˜¯å­¦ç”Ÿ",
        "pinyin": "WÇ’ shÃ¬ xuÃ©shÄ“ng",
        "english": "I am a student"
      }
    ],
    "notes": "Use æ˜¯ to link a subject with a noun (identity or classification)."
  }
]
```

**idioms.json:**

```json
[
  {
    "id": 1,
    "idiom": "é©¬é©¬è™Žè™Ž",
    "pinyin": "mÇŽmÇŽhÇ”hÇ”",
    "literal": "horse horse tiger tiger",
    "figurative": "so-so, careless, not bad",
    "etymology": "Origin unclear, possibly from folk tales about confusing horses with tigers.",
    "audioUrl": null
  }
]
```

---

**Related Documentation:**

- [Epic 17 BR](../../business-requirements/epic-17-knowledge-hub/README.md)
- Story 17.1 Implementation _(not yet created)_
- Story 17.2 Implementation _(not yet created)_
- Story 17.3 Implementation _(not yet created)_
- Story 17.4 Implementation _(not yet created)_
- Story 17.5 Implementation _(not yet created)_
- Story 17.6 Implementation _(not yet created)_
- [Architecture Overview](../../architecture.md)
- [Knowledge Base](../../knowledge-base/README.md)
