# Story 15.10: Quiz UX Polish & Results Enhancement

## Description

**As a** learner,
**I want** a polished quiz experience with stable layouts, clear instructions, and enhanced results display,
**So that** the quiz feels professional, intuitive, and provides actionable feedback without visual jarring or confusion.

## Business Value

Story 15.9 delivered core gamification & AI features, but the UX has several rough edges that reduce perceived quality and increase user frustration. This polish story addresses layout instability, unclear UI states, and results page usability—all critical for first impressions and retention.

**Impact:**

- Reduces bounce rate from quiz (users leaving mid-quiz due to confusing UX)
- Improves perceived product quality (stable layouts = professional feel)
- Increases AI feedback comprehension (clearer prompts + improved display)
- Enhances results page utility (visual indicators + relative dates + tooltips)
- Improves mobile experience (dashboard fits in 1 screen, better spacing)

**User Pain Points Addressed:**

- Layout jumps when AI feedback appears (distracting, feels broken)
- Unclear which answer was submitted vs. correct answer (AI feedback confusion)
- Results page overflows horizontally on mobile (poor UX)
- Technical jargon ("Leeches", "Lapse Count") intimidates beginners
- Dashboard overflows when quiz button added (scrolling required)
- Pinyin validation fails for "ni hao" vs. "nǐhǎo" (inconsistent space handling)
- Sub-navbar lacks clear active state and consistent spacing
- Question types don't have visual indicators for input expectations

## Acceptance Criteria

### Quiz Page Stability (4 AC)

- [x] Quiz page layout has reserved space for AI feedback/rewards (no jumping when elements appear)
- [x] Submit button smoothly transitions to Next button without layout shift
- [x] Button states clearly visible (disabled → loading → clickable)
- [x] Quiz element spacing consistent across question types (multiple choice, typing, tone)

### Navigation & Question Display (3 AC)

- [x] Sub-navbar has consistent spacing and clear active state styling
- [x] Question types have visual icons (🎯 multiple choice, ✏️ typing, 🔊 tone)
- [x] Question display has reserved height to prevent layout shifts between types

### Guidance Features (2 AC)

- [x] Hint button shows word meaning/pinyin in expandable panel (hidden by default)
- [x] Tone input has tooltip explaining numeric notation ("Type ma3 for mǎ")

### Styling & AI Feedback (3 AC)

- [x] All quiz components use app theme colors, fonts, and spacing
- [x] AI feedback highlights user answer vs. correct answer clearly (bold/color distinction)
- [x] AI prompt updated to be concise for mobile ("Focus on tone/character/meaning differences. Keep it brief.")

### Results Page Enhancements (5 AC)

- [x] Results page fits without horizontal scroll on mobile (320px min width)
- [x] Next review shows relative time ("in 3 days" instead of "Feb 19, 2026")
- [x] Lapse count has tooltip explaining "Times missed in a row"
- [x] Wrong answers have red left border instead of separate status column
- [x] Results table rows alternate background color for readability

### User-Friendly Wording (2 AC)

- [x] "Leeches" replaced with "Struggling Words" in LeechWidget
- [x] "Lapse Count" replaced with "Times Missed" in results table

### Dashboard & Input Fixes (2 AC)

- [x] Dashboard layout fits in 1 screen (no scroll) with quiz button + due count badge visible
- [x] Pinyin validation ignores spaces ("ni hao" === "nǐhǎo", "ma3 ma4" === "mǎmà")

## Business Rules

1. **Layout Stability Priority**: Reserved space for dynamic elements (AI feedback, rewards) must be allocated before quiz starts to prevent cumulative layout shift (CLS) penalties affecting SEO and perceived performance.

2. **Hint Button Behavior**: Hints hidden by default to encourage active recall; expandable on click; shows meaning + pinyin only (character composition hints deferred to Epic 17 Knowledge Hub integration).

3. **Tone Input Tooltip**: Displayed on focus or hover; explains numeric notation (1-4 for tones, 5 for neutral); examples: "ma1 → mā, ma3 → mǎ"; dismissible after first view (localStorage flag).

4. **AI Feedback Display**: User answer shown in red with strikethrough; correct answer shown in green with checkmark; explanation below with concise formatting (max 150 characters for mobile).

5. **Relative Time Display**: "Next review" shown as relative time for dates within 7 days ("in 2 hours", "tomorrow", "in 5 days"); absolute dates for > 7 days ("Feb 25, 2026").

6. **Pinyin Space Normalization**: Validation removes all whitespace before comparison; applies to both user input and correct answer; ensures "ni hao", "nǐ hǎo", "nǐhǎo" all match.

7. **Dashboard 1-Screen Constraint**: Maximum viewport height usage without scroll on desktop (1080px) and mobile (844px iPhone 14); achieved through reduced spacing, compact leech widget, collapsible sections.

## Related Issues

- [**Story 15.9: Gamification & AI Integration**](./story-15-9-gamification-ai-integration.md) (Prerequisite: builds on core features)
- [**Story 15.8: Core Quiz Backend Integration**](./story-15-8-core-quiz-integration.md) (Prerequisite: quiz container base)
- [**Story 15.11: Feature Extensions & Future Adaptability**](./story-15-11-feature-extensions.md) (Follows this story)
- [**Story 15.12: Documentation Finalization**](./story-15-12-documentation-finalization.md) (Final closure)
- [**Epic 15 BR**](./README.md) (Parent epic)

## Implementation Status

- **Status**: Completed
- **PR**: N/A
- **Merge Date**: N/A
- **Last Update**: February 27, 2026
