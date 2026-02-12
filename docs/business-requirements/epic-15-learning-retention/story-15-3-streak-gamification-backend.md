# Story 15.3: Streak & Gamification Backend APIs

## Description

**As a** backend developer,
**I want to** implement streak tracking, badge awards, and XP calculation APIs,
**So that** gamification features can drive user engagement.

## Business Value

Gamification elements (streaks, badges, XP) are proven to increase daily active usage by 30-40% in learning apps. This story provides the backend infrastructure for engagement mechanics that reduce churn and drive habit formation.

**Impact:**

- Enables daily return behavior through streak incentives (loss aversion psychology)
- Provides achievement system for milestone celebrations (7/30/100-day badges)
- XP system creates visible progress indicators (motivates continued effort)
- Mystery box rewards add variable reward schedule (dopamine engagement loop)

## Acceptance Criteria

- [x] `GET /api/progress/streak` endpoint returns { currentStreak, longestStreak, freezeCount, lastActivityDate }
- [x] Streak automatically increments when user saves quiz answer within 48 hours of last activity
- [x] Streak resets to 0 if no activity for >48 hours (unless freeze spent)
- [x] `POST /api/progress/streak/freeze` endpoint spends 1 freeze to protect current streak
- [x] Freeze spend validation: reject if freezeCount < 1 or streak not at risk
- [x] `GET /api/gamification/badges` endpoint returns { earned: [], available: [] } badge arrays
- [x] Badge award logic: 7-day (1 week), 30-day (1 month), 100-day (100 days), 365-day (1 year) streak milestones
- [x] XP calculation: +10 base per correct answer, +5 bonus if current streak >= 7 days
- [x] Streak freeze earn logic: award 1 freeze per 10 consecutive perfect quiz completions (10/10 correct)
- [x] Mystery box drop logic: 5% chance on milestone quizzes (streak multiple of 7 days)
- [x] Mystery box rewards: random selection from [50 XP, 1 freeze, "Golden Flame" badge variant]
- [x] All endpoints require JWT authentication
- [x] API documentation updated with gamification endpoint details

## Business Rules

1. **Streak Grace Period:** 48 hours (not 24h) to accommodate time zones and weekend travel; no partial credit for late reviews

2. **Freeze Earning:** Requires 10 consecutive perfect quizzes (100% accuracy on 10+ question quiz); resets counter if any quiz has incorrect answers; maximum 5 freezes stored per user

3. **Freeze Spending:** User can spend freeze when streak is at risk (>48h since last activity); freeze extends grace period by 24 additional hours; maximum 1 freeze spend per 7-day period to prevent hoarding abuse

4. **Badge Uniqueness:** Each badge milestone awarded only once; no duplicate badge awards; "Golden Flame" variant is rare mystery box exclusive

5. **XP Cap:** Maximum 500 XP per day to prevent marathon gaming sessions and encourage daily consistency

6. **Mystery Box Eligibility:** Only drops on streak milestones (7-day multiples: 7, 14, 21, 28...); 5% drop rate; if box does not drop, user sees "Better luck next time" message

## Related Issues

- [**Story 15.1: Progress System Adaptation**](./story-15-1-progress-system-adaptation.md) (Depends on: needs `study_streaks` table)
- [**Story 15.2: Core Quiz Backend Infrastructure**](./story-15-2-core-quiz-backend.md) (Depends on: needs test result saving to trigger streak updates)
- [**Story 15.9: Gamification & AI Integration**](./story-15-9-gamification-ai-integration.md) (Blocks: frontend needs these APIs)
- [**Epic 15 BR**](./README.md) (Parent epic)

## Implementation Status

- **Status**: Completed
- **Commit**: 6bd7c7a
- **PR**: #TBD
- **Merge Date**: N/A
- **Last Update**: 2026-02-12
- **Key Commit**: TBD
