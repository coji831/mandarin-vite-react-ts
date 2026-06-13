# Gamification Endpoints

All gamification endpoints require authentication via JWT Bearer token (`Authorization: Bearer <access_token>`).

## GET /api/v1/progress/streak

Get current study streak data.

**Response (200 OK):**

```json
{
  "currentStreak": 14,
  "longestStreak": 28,
  "freezeCount": 2,
  "lastActivityDate": "2026-02-11T15:30:00.000Z"
}
```

**Business Rules:**

- **48-hour grace period**: User has 48h from `lastActivityDate` to complete another quiz before streak resets
- Streak increments by 1 per calendar day (multiple quizzes/day = 1)
- Freeze count: max 5

## POST /api/v1/progress/streak/freeze

Spend 1 freeze to protect current streak by extending grace period by 24 hours.

**Response (200 OK):**

```json
{
  "message": "Freeze spent successfully",
  "freezeCount": 1,
  "lastActivityDate": "2026-02-10T15:30:00.000Z"
}
```

**Rules:** Can only spend when streak is at risk (>48h). Max 1 freeze per 7-day period.

**Errors:** `400 NO_FREEZES_AVAILABLE`, `400 STREAK_NOT_AT_RISK`, `404 NO_STREAK_RECORD`

## GET /api/v1/gamification/badges

Get earned badges and progress toward available badges.

**Response (200 OK):**

```json
{
  "earned": [
    {
      "id": "bronze_flame",
      "name": "Bronze Flame",
      "streakRequired": 7,
      "icon": "🔥",
      "earnedDate": "2026-01-18T10:00:00.000Z"
    }
  ],
  "available": [
    {
      "id": "gold_flame",
      "name": "Gold Flame",
      "streakRequired": 100,
      "icon": "🔥",
      "progress": 42,
      "percentComplete": 42
    }
  ]
}
```

**Badge Milestones:**

| Badge               | Streak                | Icon |
| ------------------- | --------------------- | ---- |
| Bronze Flame        | 7 days                | 🔥   |
| Silver Flame        | 30 days               | 🔥   |
| Gold Flame          | 100 days              | 🔥   |
| Diamond Flame       | 365 days              | 💎   |
| Golden Flame (Rare) | Mystery box exclusive | ✨🔥 |

Awarded based on `longestStreak` (permanent achievement). Each badge awarded only once.

## Mystery Box System

Awarded as part of `POST /api/v1/progress/test-result` response. **Not a standalone endpoint.**

**Drop Conditions:**

- User on a streak milestone (7-day multiple: 7, 14, 21, 28...)
- 5% random chance per eligible quiz
- Only drops once per milestone

**Reward Types:** XP bonus (50), Streak Freeze (1), or Golden Flame Rare badge.

## XP System

Awarded via quiz completion. No standalone XP endpoint.

```
xpEarned = baseXP + streakBonus
baseXP = correct ? 10 : 0
streakBonus = currentStreak >= 7 ? 5 : 0
```

- Only correct answers award XP
- Streak bonus at 7+ day streak
- Daily XP cap: **500 XP** (mystery box rewards bypass cap)
