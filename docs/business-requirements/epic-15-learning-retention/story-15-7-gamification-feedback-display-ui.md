# Story 15.7: Gamification & Feedback Display UI

## Description

**As a** frontend developer,
**I want to** build display components for streaks, badges, XP, and AI feedback,
**So that** learners see their achievements and receive contextual error explanations.

## Business Value

Gamification UI elements transform objective learning data (streaks, XP, badges) into emotionally engaging visuals that drive habit formation. AI feedback display makes error corrections actionable rather than demotivating. These components are the "visible rewards" layer that increases daily active usage.

**Impact:**

- Visual streak counter leverages loss aversion psychology (fear of breaking streak drives daily returns)
- Badge display provides social proof and milestone celebrations (dopamine triggers)
- XP progress creates visible growth indicator (motivates continued effort)
- AI feedback display makes mistakes feel like learning opportunities (reduces frustration-driven churn)

## Acceptance Criteria

- [x] `StreakCounter.tsx` component displays current streak with flame icon (🔥) and number
- [x] Streak counter shows visual warning state when streak at risk (>48h since last activity, red flame)
- [x] Freeze count displayed below streak: "❄️ x3 Freezes Available" with tooltip explaining usage
- [x] `BadgeDisplay.tsx` component shows grid of earned badges (colored icons) and locked badges (grayscale)
- [x] Badge milestones: 7-day (Bronze Flame), 30-day (Silver Flame), 100-day (Gold Flame), 365-day (Diamond Flame)
- [x] Clicking badge shows modal with achievement details (earned date, description, progress to next)
- [x] `XPProgressBar.tsx` component shows current XP with level indicator (e.g., "Level 5: 280 / 500 XP")
- [x] XP bar fills visually (green progress bar) with animation on XP gain
- [x] `AIFeedbackPanel.tsx` component displays error explanation with error type badge ('tone'|'character'|'meaning')
- [x] AI feedback shows loading state (skeleton loader, 3-second timeout) before displaying explanation
- [x] Fallback message shown if AI feedback unavailable (generic error tip)
- [x] All components accept mocked data props (no API calls; integration in Story 15.9)
- [x] Mobile-responsive layout (stack vertically on small screens, grid on desktop)

## Business Rules

1. **Streak Visual States:**
   - Active (green flame): Activity within last 24 hours
   - Warning (red flame): 24-48 hours since last activity (streak at risk)
   - Broken (gray flame with reset indicator): >48 hours, streak reset to 0

2. **Badge Display Order:** Earned badges sorted by achievement date (newest first); locked badges sorted by proximity to unlock (closest milestone first)

3. **XP Leveling Formula:** `level = floor(totalXP / 100)`; next level threshold = `(level + 1) * 100`; example: 280 XP → Level 2 (next level at 300 XP)

4. **AI Feedback Error Type Badges:**
   - Tone: Yellow badge with "🔊 Tone Difference"
   - Character: Blue badge with "✏️ Character Confusion"
   - Meaning: Purple badge with "💡 Meaning Mix-up"
   - Generic: Gray badge with "ℹ️ Review Needed"

5. **Loading States:** All async data (AI feedback, streak, badges, XP) show skeleton loaders; no "flash of empty state" on component mount

6. **Accessibility:** All icons have alt text; color is not the only indicator of state (use icons + text labels); keyboard navigation for badge grid; ARIA live regions for dynamic updates (XP gain, streak updates)

## Related Issues

- [**Story 15.9: Gamification & AI Integration**](./story-15-9-gamification-ai-integration.md) (Blocks: integration connects these components to backend APIs)
- [**Story 15.8: Core Quiz Backend Integration**](./story-15-8-core-quiz-integration.md) (Blocks: quiz summary screen uses these components)
- [**Epic 15 BR**](./README.md) (Parent epic)

## Implementation Status

- **Status**: Completed
- **Last Update**: February 14, 2026
- **PR**: Pending
- **Implementation Doc**: [story-15-7-gamification-feedback-display-ui.md](../../issue-implementation/epic-15-learning-retention/story-15-7-gamification-feedback-display-ui.md)
