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
    ↓
Frontend Loader Utility
    ↓
React Components (interactive UI)
    ↓
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

1. **Static JSON vs. backend API** — JSON files reduce complexity, eliminate API latency, enable offline support; tradeoff: content updates require deployment vs. dynamic CMS

2. **SVG animations vs. video files** — SVGs are scalable, smaller file size (~10KB vs. 500KB video), customizable playback speed; tradeoff: requires SVG sourcing/creation vs. recording videos

3. **Open-source content with attribution vs. proprietary curation** — Reduces content creation effort from 40+ hours to 10 hours; builds community trust; tradeoff: limited differentiation vs. competitors

4. **Standalone knowledge section vs. integrated tooltips** — Enables deep-linking for SEO, browsing behavior separate from learning flow; tradeoff: requires navigation vs. contextual inline tips

## Technical Implementation

### Architecture

```
React Router
    ↓
/knowledge → KnowledgeHub.tsx (landing page)
    ├─ /knowledge/radicals → RadicalSection.tsx
    │   └─ RadicalBreakdown.tsx (interactive)
    ├─ /knowledge/pinyin → PinyinSection.tsx
    │   └─ ToneChart.tsx (audio playback)
    ├─ /knowledge/strokes → StrokeSection.tsx
    │   └─ StrokeAnimation.tsx (SVG + controls)
    ├─ /knowledge/grammar → GrammarSection.tsx
    │   └─ PatternCard.tsx (searchable)
    └─ /knowledge/idioms → IdiomSection.tsx
        └─ IdiomCard.tsx (etymology)
```

**Data Flow:**

```
User navigates to /knowledge/radicals
    ↓
RadicalSection.tsx mounts
    ↓
useEffect → fetch('/data/knowledge/radicals.json')
    ↓
Parse JSON → setState(radicals)
    ↓
Render RadicalBreakdown components
    ↓
[User clicks radical 日]
    ↓
Filter characters containing 日
    ↓
Display related characters (明, 时, 早, etc.)
```

### API Endpoints

**No backend APIs required** — All content served statically from `public/data/knowledge/`.

**Audio Generation** (reuse existing TTS service):

- `POST /api/audio/generate` for tone examples and idiom pronunciation

### Component Relationships

```
KnowledgeHub.tsx (landing)
    ├─ SectionCard (×6)
    │   ├─ Icon
    │   ├─ Title
    │   └─ Description
    └─ KnowledgeNav.tsx (sidebar)

RadicalSection.tsx
    ├─ SearchBar (filter by meaning/pinyin)
    ├─ RadicalGrid.tsx
    │   └─ RadicalCard.tsx (×214)
    │       ├─ Character (large)
    │       ├─ Pinyin
    │       ├─ Meaning
    │       └─ Stroke Count
    └─ RadicalDetailModal.tsx
        ├─ Radical info
        └─ Related characters list

ToneChart.tsx
    ├─ ToneRow (×5: tone 1-4 + neutral)
    │   ├─ Pinyin (mā má mǎ mà ma)
    │   ├─ Audio button
    │   └─ Tone curve visualization
    └─ ToneRulesPanel.tsx (sandhi rules)

StrokeAnimation.tsx
    ├─ SVG canvas (stroke paths)
    ├─ PlaybackControls
    │   ├─ Play/Pause button
    │   ├─ Loop toggle
    │   └─ Speed slider (0.5x, 1x, 2x)
    └─ StrokeCounter (stroke X of Y)

PatternCard.tsx
    ├─ Pattern title ("Subject + 是 + Noun")
    ├─ HSK level badge
    ├─ ExampleList (×3)
    │   └─ ExampleRow (Chinese, Pinyin, English)
    └─ UsageNotes (when to use this pattern)

IdiomCard.tsx
    ├─ Idiom (四字成语)
    ├─ Pinyin
    ├─ Literal meaning
    ├─ Figurative meaning
    ├─ Audio button
    └─ Etymology (expandable)
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
    "radical": "一",
    "pinyin": "yī",
    "strokes": 1,
    "meaning": "one",
    "examples": ["一", "二", "三", "天"]
  }
]
```

**grammar-patterns.json:**

```json
[
  {
    "id": 1,
    "pattern": "Subject + 是 + Noun",
    "hskLevel": 1,
    "examples": [
      {
        "chinese": "我是学生",
        "pinyin": "Wǒ shì xuéshēng",
        "english": "I am a student"
      }
    ],
    "notes": "Use 是 to link a subject with a noun (identity or classification)."
  }
]
```

**idioms.json:**

```json
[
  {
    "id": 1,
    "idiom": "马马虎虎",
    "pinyin": "mǎmǎhǔhǔ",
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
- [Story 17.1 Implementation](./story-17-1-knowledge-hub-structure.md)
- [Story 17.2 Implementation](./story-17-2-character-composition-radicals.md)
- [Story 17.3 Implementation](./story-17-3-pinyin-system-guide.md)
- [Story 17.4 Implementation](./story-17-4-stroke-order-animations.md)
- [Story 17.5 Implementation](./story-17-5-grammar-patterns-library.md)
- [Story 17.6 Implementation](./story-17-6-idiom-chengyu-database.md)
- [Architecture Overview](../../architecture.md)
- [Content Sources](../../knowledge-base/content-sources.md)
