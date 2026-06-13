# Epic 17: Basic Knowledge Resources

## Epic Summary

**Goal:** Build comprehensive reference section with character radicals, pinyin system, stroke animations, grammar patterns, and idioms using static JSON content and interactive React components.

**Key Points:**

- Static JSON files in `public/data/knowledge/` eliminate backend dependencies and API calls
- Radical database (214 Kangxi radicals) sourced from Unicode Han Database with interactive breakdown UI
- SVG stroke order animations from Wikimedia Commons with playback controls (play/pause/loop/speed)
- Grammar pattern library (20 structures) with HSK level tagging and searchable by keyword
- Idiom database (50 entries) with etymology stories and audio pronunciation via TTS

**Status:** Planned

**Last Update:** February 2, 2026

## Technical Overview

This epic creates a standalone Knowledge Hub feature with static educational content delivered via JSON files and interactive React components. Content is frontend-only (no backend API required) to minimize complexity and maximize performance.

**Architecture Pattern:**

```
Static Content (JSON)
    â†“
Frontend Loader Utility
    â†“
React Components (interactive UI)
    â†“
User
```

**Content Sources:**

- **Radicals**: Unicode Han Database (public domain)
- **Stroke Order SVGs**: Wikimedia Commons (CC-BY-SA licensed)
- **Grammar Patterns**: Open textbooks with citations (fair use)
- **Idioms**: Public domain collections + original curation
- **Audio**: Google Cloud TTS (existing service)

**Scope:**

- 6 knowledge sections (radicals, pinyin, strokes, grammar, idioms, tones)
- ~300 content items total (214 radicals + 100 stroke animations + 20 patterns + 50 idioms)
- Mobile-responsive UI with touch-friendly interactions
- SEO-optimized landing pages for organic traffic

## Architecture Decisions

1. **Static JSON vs. backend API** â€” JSON files reduce complexity, eliminate API latency, enable offline support; tradeoff: content updates require deployment vs. dynamic CMS

2. **SVG animations vs. video files** â€” SVGs are scalable, smaller file size (~10KB vs. 500KB video), customizable playback speed; tradeoff: requires SVG sourcing/creation vs. recording videos

3. **Open-source content with attribution vs. proprietary curation** â€” Reduces content creation effort from 40+ hours to 10 hours; builds community trust; tradeoff: limited differentiation vs. competitors

4. **Standalone knowledge section vs. integrated tooltips** â€” Enables deep-linking for SEO, browsing behavior separate from learning flow; tradeoff: requires navigation vs. contextual inline tips

## Technical Implementation

### Architecture

```
React Router
    â†“
/knowledge â†’ KnowledgeHub.tsx (landing page)
    â”œâ”€ /knowledge/radicals â†’ RadicalSection.tsx
    â”‚   â””â”€ RadicalBreakdown.tsx (interactive)
    â”œâ”€ /knowledge/pinyin â†’ PinyinSection.tsx
    â”‚   â””â”€ ToneChart.tsx (audio playback)
    â”œâ”€ /knowledge/strokes â†’ StrokeSection.tsx
    â”‚   â””â”€ StrokeAnimation.tsx (SVG + controls)
    â”œâ”€ /knowledge/grammar â†’ GrammarSection.tsx
    â”‚   â””â”€ PatternCard.tsx (searchable)
    â””â”€ /knowledge/idioms â†’ IdiomSection.tsx
        â””â”€ IdiomCard.tsx (etymology)
```

**Data Flow:**

```
User navigates to /knowledge/radicals
    â†“
RadicalSection.tsx mounts
    â†“
useEffect â†’ fetch('/data/knowledge/radicals.json')
    â†“
Parse JSON â†’ setState(radicals)
    â†“
Render RadicalBreakdown components
    â†“
[User clicks radical æ—¥]
    â†“
Filter characters containing æ—¥
    â†“
Display related characters (æ˜Ž, æ—¶, æ—©, etc.)
```

### API Endpoints

**No backend APIs required** â€” All content served statically from `public/data/knowledge/`.

**Audio Generation** (reuse existing TTS service):

- `POST /api/audio/generate` for tone examples and idiom pronunciation

### Component Relationships

```
KnowledgeHub.tsx (landing)
    â”œâ”€ SectionCard (Ã—6)
    â”‚   â”œâ”€ Icon
    â”‚   â”œâ”€ Title
    â”‚   â””â”€ Description
    â””â”€ KnowledgeNav.tsx (sidebar)

RadicalSection.tsx
    â”œâ”€ SearchBar (filter by meaning/pinyin)
    â”œâ”€ RadicalGrid.tsx
    â”‚   â””â”€ RadicalCard.tsx (Ã—214)
    â”‚       â”œâ”€ Character (large)
    â”‚       â”œâ”€ Pinyin
    â”‚       â”œâ”€ Meaning
    â”‚       â””â”€ Stroke Count
    â””â”€ RadicalDetailModal.tsx
        â”œâ”€ Radical info
        â””â”€ Related characters list

ToneChart.tsx
    â”œâ”€ ToneRow (Ã—5: tone 1-4 + neutral)
    â”‚   â”œâ”€ Pinyin (mÄ mÃ¡ mÇŽ mÃ  ma)
    â”‚   â”œâ”€ Audio button
    â”‚   â””â”€ Tone curve visualization
    â””â”€ ToneRulesPanel.tsx (sandhi rules)

StrokeAnimation.tsx
    â”œâ”€ SVG canvas (stroke paths)
    â”œâ”€ PlaybackControls
    â”‚   â”œâ”€ Play/Pause button
    â”‚   â”œâ”€ Loop toggle
    â”‚   â””â”€ Speed slider (0.5x, 1x, 2x)
    â””â”€ StrokeCounter (stroke X of Y)

PatternCard.tsx
    â”œâ”€ Pattern title ("Subject + æ˜¯ + Noun")
    â”œâ”€ HSK level badge
    â”œâ”€ ExampleList (Ã—3)
    â”‚   â””â”€ ExampleRow (Chinese, Pinyin, English)
    â””â”€ UsageNotes (when to use this pattern)

IdiomCard.tsx
    â”œâ”€ Idiom (å››å­—æˆè¯­)
    â”œâ”€ Pinyin
    â”œâ”€ Literal meaning
    â”œâ”€ Figurative meaning
    â”œâ”€ Audio button
    â””â”€ Etymology (expandable)
```

### Dependencies

**New Files:**

- `src/features/knowledge/` folder structure
- `public/data/knowledge/radicals.json`
- `public/data/knowledge/pinyin-guide.json`
- `public/data/knowledge/stroke-order/` (SVG files)
- `public/data/knowledge/grammar-patterns.json`
- `public/data/knowledge/idioms.json`

**New Dependencies:**

- None (uses existing React, React Router, TTS service)

**Content Licensing:**

- Unicode Han Database: Public domain
- Wikimedia Commons SVGs: CC-BY-SA 3.0 (attribution required)
- Grammar examples: Fair use (educational content with citations)

### Testing Strategy

**Unit Tests:**

- `RadicalBreakdown.test.tsx` - Test filtering and related character lookup
- `ToneChart.test.tsx` - Test audio playback triggers
- `StrokeAnimation.test.tsx` - Test playback controls (play/pause/speed)

**Integration Tests:**

- `knowledge-hub-routing.test.tsx` - Test all knowledge routes render correctly
- `content-loading.test.ts` - Test JSON files load and parse correctly

**Content Validation:**

- Script to validate JSON schemas (all required fields present)
- Script to check SVG file integrity (valid XML, proper dimensions)

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
- Story 17.1 Implementation *(not yet created)*
- Story 17.2 Implementation *(not yet created)*
- Story 17.3 Implementation *(not yet created)*
- Story 17.4 Implementation *(not yet created)*
- Story 17.5 Implementation *(not yet created)*
- Story 17.6 Implementation *(not yet created)*
- [Architecture Overview](../../architecture.md)
- [Knowledge Base](../../knowledge-base/README.md)

