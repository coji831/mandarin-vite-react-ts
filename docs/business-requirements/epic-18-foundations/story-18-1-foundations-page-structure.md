# Story 18.1: Foundations Page Structure

**Last Updated:** June 17, 2026

## Description

**As a** learner,
**I want to** access the Foundations page from the Learn section with 4 organized sub-tabs (Pinyin, Tones, Strokes, Animations),
**So that** I can navigate between reference materials in a structured way.

## Business Value

This story establishes the foundational UI infrastructure for Phase 1 learning. Without this structure, learners have no guided path through the reference materials. The 4-tab layout provides clear navigation that scales to future content epics. Phase-gated tab visibility ensures learners focus on current-phase content without being overwhelmed.

## Acceptance Criteria

- [ ] Foundations page renders at `/learn/foundations` with 4 sub-tabs: Pinyin, Tones, Strokes, Animations (verify: navigate to route, all 4 tabs visible and clickable)
- [ ] TabBar component is reused from `shared/components/ContentBrowser/TabBar.tsx` (verify: imported, not reimplemented)
- [ ] Clicking each tab switches content without page reload (verify: tab-switching is instant, URL hash updates)
- [ ] Phase-gated LearnLayout shows Foundations as active for Phase 1 users, all other Learn tabs (Radicals, Grammar, etc.) locked with 🔒 badge and tooltip (verify: Phase 1 user sees correct tab state)
- [ ] Progress bar at bottom of page shows "X of 4 sections completed" using FoundationProgress backend data (verify: bar renders, count updates after completing sections)
- [ ] Global navigation updated to 5 items: Dashboard (/), Learn (/learn/_), Practices (/practices/_), Library (/library), Progress (/progress) (verify: all 5 nav items present with correct routes and icons)
- [ ] Existing `/learn/flashcards` route redirects to `/learn/foundations` with a console deprecation warning (verify: navigation to old route → 302 redirect)
- [ ] Page is mobile-responsive: 4-tab layout collapses to scrollable tab bar on viewports <640px (verify: mobile emulation shows scrollable tabs)
- [ ] Foundations feature folder scaffolded with empty tab placeholder components (verify: folder structure matches project convention)
- [ ] Backend `/api/v1/progression/foundation-progress` endpoint returns 4 auto-initialized records on first GET for new user (verify: fresh user → GET returns 4 records with completed=false)

## Business Rules

1. The Foundations page is always unlocked (Phase 1 content is the default starting point)
2. Progress is tracked per-section via FoundationProgress backend API, not localStorage
3. The 4-tab structure must match the FOUNDATION_SECTIONS constant in `packages/shared-constants/src/foundations.ts`
4. Tab order must be: Pinyin → Tones → Strokes → Animations (pedagogical sequence)

## Related Issues

- Epic 18 BR: `docs/business-requirements/epic-18-foundations/README.md` (Parent epic)
- Story 18.2: Pinyin System Guide (Sibling — content for Pinyin tab)
- Story 18.3: Tones Reference & Practice (Sibling — content for Tones tab)
- Story 18.4: Stroke Order Reference & Animations (Sibling — content for Strokes + Animations tabs)

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
