# Story 15.9: Gamification & AI Integration

## Description

**As a** learner,
**I want to** earn badges, XP, and streak rewards with AI-powered feedback,
**So that** I feel rewarded for consistent study and understand my mistakes.

## Business Value

This final integration story completes the engagement layer by connecting gamification UI (Story 15.7) and AI feedback display to backend services (Stories 15.3-15.4). The combination of visible achievements, loss aversion (streaks), and personalized error explanations creates a comprehensive retention system proven to increase daily active usage by 30-40%.

**Impact:**

- Completes full gamification loop (earn → display → celebrate achievements)
- AI feedback reduces learning frustration by explaining confusion roots (not just "wrong")
- Streak freeze system provides safety net (reduces anxiety about missed days)
- Mystery box variable rewards add dopamine-driven surprise element

## Acceptance Criteria

- [x] Dashboard displays StreakCounter with live data from `GET /api/progress/streak`
- [x] Streak counter updates in real-time after quiz completion (optimistic UI + backend sync)
- [x] Badge display fetches earned/available badges from `GET /api/gamification/badges`
- [x] New badge unlock triggers celebration modal with confetti animation
- [x] XP progress bar updates with animation after quiz completion (fetch latest XP from quiz summary response)
- [x] AI feedback panel calls `POST /api/quiz/feedback` after incorrect answer
- [x] Feedback displays asynchronously (user can advance to next question while feedback loads)
- [x] Fallback message shown if AI feedback times out (3-second limit) or fails
- [x] Streak freeze spend button enabled when streak at risk (>48h since activity)
- [x] Mystery box modal appears on milestone quizzes (7-day multiples) with 5% drop rate
- [x] Mystery box reward reveal animation (sliding gift box → reveal contents)
- [x] Leech dashboard widget shows "Focus Words" list (words with lapseCount >= 5) with retry button
- [x] Mobile-optimized animations (reduced motion respected for accessibility)

## Business Rules

1. **Streak Update Timing:** Streak increments immediately after first quiz answer of the day (not at completion); enables "quick check-in" behavior; backend validates 48-hour window server-side

2. **Badge Unlock Celebration:** New badge modal auto-displays once per badge; user can dismiss; modal not re-shown on subsequent logins (localStorage flag: `badge_${badgeId}_celebrated`)

3. **XP Animation:** XP bar fills smoothly over 1.5 seconds; shows "+X XP" floating text animation; celebrates level-up with sound effect (optional, muted by default)

4. **AI Feedback Async Pattern:**
   - User answers incorrectly → show "Incorrect" feedback immediately → advance to next question → fetch AI explanation in background → notification badge appears ("💡 Explanation ready") → user can view explanation later in quiz summary

5. **Streak Freeze Confirmation:** Spending freeze shows confirmation modal: "Use 1 freeze to protect your 15-day streak? You have 3 freezes remaining."; user must confirm to spend; cooldown: 1 freeze per 7 days maximum

6. **Mystery Box Drop Rate:** 5% checked server-side (not client-side to prevent manipulation); if no drop, show encouraging message: "Keep going! Mystery boxes appear randomly on milestone streaks."; drop rate may increase based on A/B testing results

7. **Leech Dashboard Priority:** "Focus Words" widget shown if user has 3+ leeches; widget dismissible but reappears daily until leeches < 3; clicking word opens targeted mini-quiz (5 questions, all same leech word)

## Related Issues

- [**Story 15.3: Streak & Gamification Backend APIs**](./story-15-3-streak-gamification-backend.md) (Depends on: needs streak, badge, XP APIs)
- [**Story 15.4: AI Feedback Backend Service**](./story-15-4-ai-feedback-backend.md) (Depends on: needs AI feedback API)
- [**Story 15.7: Gamification & Feedback Display UI**](./story-15-7-gamification-feedback-display-ui.md) (Depends on: uses gamification UI components)
- [**Story 15.8: Core Quiz Backend Integration**](./story-15-8-core-quiz-integration.md) (Depends on: builds on core quiz foundation)
- [**Epic 15 BR**](./README.md) (Parent epic)

## Implementation Status

- **Status**: Code Review
- **PR**: Pending
- **Merge Date**: N/A
- **Last Update**: February 16, 2026
