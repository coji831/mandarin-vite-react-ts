# Epic 17: Basic Knowledge Resources

## Epic Summary

**Goal:** Provide comprehensive reference materials covering character composition, pinyin system, stroke order, grammar patterns, and idioms to support foundational Mandarin learning.

**Key Points:**

- Character composition breakdown using 214 Kangxi radicals with meanings and stroke counts
- Interactive pinyin guide with tone chart, audio examples, and tone change rules
- Animated stroke order demonstrations for 100 most common HSK 1-2 characters
- Grammar pattern library with 20 common sentence structures and examples
- Idiom (chengyu) database with 50 entries including literal and figurative meanings plus etymologies

**Status:** Planned

**Last Update:** February 2, 2026

## Background

The current platform focuses exclusively on vocabulary learning through flashcards, conversations, and quizzes. While effective for word acquisition, it lacks foundational reference materials that explain **how** Mandarin works (character structure, pronunciation system, grammar rules).

**Current Gaps:**

- **No character composition explanations**: Users see 明 but don't know it's 日+月 (sun + moon)
- **No pinyin reference**: Beginners struggle with initials, finals, tone marks without guide
- **No stroke order visualization**: Users can't learn proper handwriting technique
- **No grammar pattern library**: Users lack sentence structure templates for production
- **No idiom context**: Users encounter 马马虎虎 but don't know cultural meaning

**User Pain Points:**

- "How do I type pinyin with tone marks?"
- "What's the difference between zh and j?"
- "How do I write this character in the correct stroke order?"
- "What does this idiom actually mean?"

**Business Impact:**

- Incomplete learning experience → users seek external resources (lower engagement)
- No SEO content → missed organic traffic from educational searches
- Competitors offer comprehensive reference sections → perceived feature gap

**Market Research:**

- Pleco, HelloChinese, ChineseSkill all include knowledge bases
- Educational content drives 40%+ of organic traffic for language platforms
- Reference materials increase session time by 2-3x (users browse while studying)

This epic addresses these gaps by creating a comprehensive Knowledge Hub with static reference materials.

## User Stories

This epic consists of the following user stories:

1. [**Story 17.1: Knowledge Hub Structure**](./story-17-1-knowledge-hub-structure.md)
   - As a **frontend developer**, I want to **scaffold the Knowledge Hub feature folder and navigation**, so that **reference materials are organized and accessible from the main menu**.

2. [**Story 17.2: Character Composition (Radicals)**](./story-17-2-character-composition-radicals.md)
   - As a **learner**, I want to **see how Chinese characters are composed from radicals**, so that **I understand character meanings and can remember them more easily**.

3. [**Story 17.3: Pinyin System Guide**](./story-17-3-pinyin-system-guide.md)
   - As a **learner**, I want to **access an interactive pinyin reference with tone examples**, so that **I can master correct pronunciation and tone distinctions**.

4. [**Story 17.4: Stroke Order Animations**](./story-17-4-stroke-order-animations.md)
   - As a **learner**, I want to **watch animated stroke order demonstrations**, so that **I can learn proper handwriting technique for common characters**.

5. [**Story 17.5: Grammar Patterns Library**](./story-17-5-grammar-patterns-library.md)
   - As a **learner**, I want to **reference common sentence patterns with examples**, so that **I can construct grammatically correct sentences in Mandarin**.

6. [**Story 17.6: Idiom (Chengyu) Database**](./story-17-6-idiom-chengyu-database.md)
   - As a **learner**, I want to **explore common Chinese idioms with etymologies**, so that **I understand cultural context and figurative meanings beyond literal translations**.

## Story Breakdown Logic

This epic is divided into stories based on content type and complexity:

- **Story 17.1** establishes infrastructure (folder structure, navigation, routing)
- **Stories 17.2-17.4** focus on foundational mechanics (radicals, pinyin, strokes) - most critical for beginners
- **Stories 17.5-17.6** focus on production skills (grammar, idioms) - build on foundational knowledge

Each story delivers standalone value and can be deployed independently.

## Acceptance Criteria

- [ ] Knowledge Hub accessible from main navigation menu
- [ ] `/knowledge` route renders Knowledge Hub landing page
- [ ] Radical database covers all 214 Kangxi radicals with English meanings
- [ ] Radical breakdown interactive (click radical → see other characters using it)
- [ ] Pinyin guide includes interactive tone chart with audio examples
- [ ] Tone chart plays audio for each of 4 tones + neutral tone (ma¹ ma² ma³ ma⁴ ma)
- [ ] Tone change rules documented (3rd tone sandhi, 一/不 tone changes)
- [ ] Stroke order animations cover 100 most common HSK 1-2 characters
- [ ] Stroke animations have playback controls (play, pause, loop, speed)
- [ ] Grammar pattern library includes 20 common structures with 3+ examples each
- [ ] Grammar patterns searchable by English keyword or HSK level
- [ ] Idiom database includes 50 entries with literal + figurative meanings
- [ ] Idiom entries include origin stories (etymology) where available
- [ ] All knowledge content mobile-responsive
- [ ] Knowledge Hub content indexed for site search

## Architecture Decisions

- **Decision: Static content (JSON) vs. backend API** (JSON files in `public/data/knowledge/`)
  - **Rationale**: Content rarely changes; no user-specific data; reduces backend complexity and API calls
  - **Alternatives considered**: PostgreSQL storage, headless CMS (Contentful)
  - **Implications**: Content updates require code deployment; no dynamic personalization; simpler architecture

- **Decision: Open-source content vs. proprietary curation** (Open-source + attribution)
  - **Rationale**: Radicals/strokes are public domain; reduces content creation effort; community trust
  - **Alternatives considered**: Hire linguists to create original content, license commercial datasets
  - **Implications**: Must provide attribution; quality varies; limited differentiation vs. competitors

- **Decision: SVG animations vs. video/GIF** (SVG with CSS animations)
  - **Rationale**: Scalable (vector graphics); smaller file size; customizable playback speed; accessible
  - **Alternatives considered**: MP4 videos, animated GIFs, Canvas-based animations
  - **Implications**: Requires SVG creation/sourcing; browser compatibility (IE not supported, acceptable)

- **Decision: Standalone Knowledge Hub vs. integrated into vocabulary** (Standalone section)
  - **Rationale**: Reference materials serve browsing behavior (not tied to specific words); SEO-friendly URLs
  - **Alternatives considered**: Inline tooltips on flashcards, word-specific knowledge panels
  - **Implications**: Users must navigate to separate section; enables deep-linking for SEO

## Implementation Plan

1. Create `src/features/knowledge/` folder structure (`components/`, `data/`, `types/`)
2. Add `/knowledge` route to React Router configuration
3. Create `KnowledgeHub.tsx` landing page with section cards
4. Create `KnowledgeNav.tsx` navigation component (sidebar or tabs)
5. Source radical data from Unicode Han Database (public domain)
6. Create `radicals.json` with 214 entries: `{ id, character, pinyin, strokes, meaning }`
7. Create `RadicalBreakdown.tsx` component with interactive character decomposition
8. Create `pinyin-guide.json` with initials, finals, tone rules
9. Create `ToneChart.tsx` interactive component with audio playback
10. Record or generate TTS for tone examples (ma¹ ma² ma³ ma⁴ ma)
11. Source stroke order SVGs from Wikimedia Commons (CC-licensed)
12. Create `StrokeAnimation.tsx` component with playback controls
13. Curate 20 grammar patterns from open textbooks (cite sources)
14. Create `grammar-patterns.json` with structures and examples
15. Create `PatternCard.tsx` component with examples and HSK level tagging
16. Curate 50 common idioms from public domain collections
17. Create `idioms.json` with literal, figurative meanings, and etymologies
18. Create `IdiomCard.tsx` component with expandable origin stories
19. Mobile-optimize all knowledge components
20. Add site search integration (index knowledge content)
21. Add SEO metadata for all knowledge pages (titles, descriptions)
22. Write user documentation: `docs/guides/knowledge-hub-guide.md`

## Risks & Mitigations

- **Risk: Content curation takes longer than development (10+ hours)** — Severity: Medium
  - **Mitigation**: Start with 50% content (10 patterns, 25 idioms); iterate based on usage; crowdsource community contributions
  - **Rollback**: Launch with partial content; add "Coming Soon" placeholders

- **Risk: SVG animations load slowly on mobile devices** — Severity: Medium
  - **Mitigation**: Lazy load animations (render only when in viewport); compress SVG files with SVGO; limit animations to 50 strokes max
  - **Rollback**: Replace SVGs with static images; remove animation feature

- **Risk: Attribution requirements create legal issues** — Severity: Low
  - **Mitigation**: Document all sources in `docs/knowledge-base/content-sources.md`; include attribution in UI; use only CC-BY or public domain content
  - **Rollback**: Remove content without clear licensing; replace with proprietary content

- **Risk: Users don't discover Knowledge Hub (low traffic)** — Severity: Medium
  - **Mitigation**: Add prominent navigation link; contextual links from flashcards ("Learn about radicals"); onboarding tour highlighting Knowledge Hub
  - **Rollback**: Integrate knowledge inline into vocabulary views

- **Risk: Content becomes outdated (grammar rules change, broken links)** — Severity: Low
  - **Mitigation**: Annual content review process; user reporting feature for errors; version control for content files
  - **Rollback**: Archive outdated content; link to external authoritative sources

## Implementation notes

- **Conventions**: Follow `docs/guides/code-conventions.md` and `docs/guides/solid-principles.md`
- **Content sources**: Document all sources and licenses in `docs/knowledge-base/content-sources.md`; ensure CC-BY or public domain only
- **Static content**: Store JSON files in `public/data/knowledge/` (no backend API needed)
- **SVG animations**: Compress with SVGO tool; lazy load with Intersection Observer
- **SEO**: Add meta tags for each knowledge page; submit sitemap to Google Search Console
- **Accessibility**: Ensure all content WCAG 2.1 AA compliant (alt text, keyboard navigation, screen reader friendly)

---

**Related Documentation:**

- [Epic 17 Implementation](../../issue-implementation/epic-17-knowledge-hub/README.md)
- [Story 17.1 BR](./story-17-1-knowledge-hub-structure.md)
- [Story 17.2 BR](./story-17-2-character-composition-radicals.md)
- [Story 17.3 BR](./story-17-3-pinyin-system-guide.md)
- [Story 17.4 BR](./story-17-4-stroke-order-animations.md)
- [Story 17.5 BR](./story-17-5-grammar-patterns-library.md)
- [Story 17.6 BR](./story-17-6-idiom-chengyu-database.md)
- [Architecture Overview](../../architecture.md)
