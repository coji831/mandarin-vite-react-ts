# Implementation 15-3: Streak & Gamification Backend APIs

## Technical Scope

Implements backend APIs for streak tracking, badge awards, XP calculation, and gamification mechanics (freeze currency, mystery boxes).

**Files Modified:**

- `apps/backend/src/api/controllers/GamificationController.js` - New controller for gamification endpoints
- `apps/backend/src/core/services/GamificationService.js` - Badge, XP, mystery box logic
- `apps/backend/src/core/services/StreakService.js` - Streak calculation, freeze management
- `apps/backend/src/infrastructure/repositories/StreakRepository.js` - study_streaks table access
- `apps/backend/src/api/routes/gamificationRoutes.js` - New route file

**New API Endpoints:**

- `GET /api/progress/streak` - Fetch streak data
- `POST /api/progress/streak/freeze` - Spend freeze to protect streak
- `GET /api/gamification/badges` - Fetch earned/available badges
- Internal: `awardXP()`, `checkMysteryBoxDrop()`, `awardFreezeForPerfectQuiz()` (called by test-result endpoint)

**Dependencies:**

- Requires Story 15.1 (study_streaks table)
- Integrates with Story 15.2 (test-result endpoint triggers streak updates)

## Implementation Details

### Streak Tracking System

```javascript
// apps/backend/src/core/services/StreakService.js

/**
 * Update streak after user activity (quiz completion)
 */
async function updateStreak(userId) {
  const streak = await StreakRepository.findByUser(userId);
  const now = new Date();
  const lastActivity = streak?.lastActivityDate ? new Date(streak.lastActivityDate) : null;

  if (!lastActivity) {
    // First activity ever
    return await StreakRepository.upsert(userId, {
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: now,
    });
  }

  const hoursSinceLastActivity = (now - lastActivity) / (1000 * 60 * 60);

  if (hoursSinceLastActivity <= 48) {
    // Within grace period: increment streak
    const newStreak = streak.currentStreak + 1;
    return await StreakRepository.upsert(userId, {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, streak.longestStreak),
      lastActivityDate: now,
    });
  } else {
    // Grace period expired: reset streak
    return await StreakRepository.upsert(userId, {
      currentStreak: 1,
      longestStreak: streak.longestStreak,
      lastActivityDate: now,
    });
  }
}

/**
 * Spend freeze to extend grace period
 */
async function spendFreeze(userId) {
  const streak = await StreakRepository.findByUser(userId);

  if (!streak || streak.freezeCount < 1) {
    throw new Error("No freezes available");
  }

  const hoursSinceLastActivity =
    (new Date() - new Date(streak.lastActivityDate)) / (1000 * 60 * 60);
  if (hoursSinceLastActivity <= 48) {
    throw new Error("Streak not at risk (within 48h grace period)");
  }

  // Extend lastActivityDate by 24 hours
  const extendedDate = new Date(streak.lastActivityDate);
  extendedDate.setHours(extendedDate.getHours() + 24);

  return await StreakRepository.update(userId, {
    freezeCount: streak.freezeCount - 1,
    lastActivityDate: extendedDate,
  });
}

/**
 * Award freeze for perfect quiz (10 consecutive)
 */
async function checkAndAwardFreeze(userId) {
  // Fetch recent quiz results
  const recentResults = await QuizResultRepository.getRecent(userId, 10);

  if (recentResults.length === 10 && recentResults.every((r) => r.correct)) {
    const streak = await StreakRepository.findByUser(userId);
    if (streak.freezeCount < 5) {
      // Max 5 freezes
      await StreakRepository.update(userId, {
        freezeCount: streak.freezeCount + 1,
      });
      return true; // Freeze awarded
    }
  }

  return false;
}
```

### Badge System

```javascript
// apps/backend/src/core/services/GamificationService.js

const BADGE_MILESTONES = [
  { id: "bronze_flame", name: "Bronze Flame", streakRequired: 7, icon: "🔥" },
  { id: "silver_flame", name: "Silver Flame", streakRequired: 30, icon: "🔥" },
  { id: "gold_flame", name: "Gold Flame", streakRequired: 100, icon: "🔥" },
  { id: "diamond_flame", name: "Diamond Flame", streakRequired: 365, icon: "💎" },
];

async function getBadges(userId) {
  const streak = await StreakRepository.findByUser(userId);
  const userBadges = await BadgeRepository.findByUser(userId);
  const earnedBadgeIds = userBadges.map((b) => b.badgeId);

  const earned = BADGE_MILESTONES.filter((badge) => earnedBadgeIds.includes(badge.id)).map(
    (badge) => ({
      ...badge,
      earnedDate: userBadges.find((ub) => ub.badgeId === badge.id).earnedDate,
    }),
  );

  const available = BADGE_MILESTONES.filter((badge) => !earnedBadgeIds.includes(badge.id)).map(
    (badge) => ({
      ...badge,
      progress: streak.longestStreak,
      required: badge.streakRequired,
      percentComplete: Math.min(100, (streak.longestStreak / badge.streakRequired) * 100),
    }),
  );

  return { earned, available };
}

async function checkAndAwardBadges(userId, currentStreak) {
  const userBadges = await BadgeRepository.findByUser(userId);
  const earnedBadgeIds = userBadges.map((b) => b.badgeId);

  const newBadges = BADGE_MILESTONES.filter(
    (badge) => badge.streakRequired <= currentStreak && !earnedBadgeIds.includes(badge.id),
  );

  for (const badge of newBadges) {
    await BadgeRepository.create({
      userId,
      badgeId: badge.id,
      earnedDate: new Date(),
    });
  }

  return newBadges; // Return newly awarded badges for notification
}
```

### XP Calculation & Mystery Box

```javascript
// apps/backend/src/core/services/GamificationService.js

function calculateXP(correct, currentStreak) {
  const baseXP = correct ? 10 : 0;
  const streakBonus = currentStreak >= 7 ? 5 : 0;
  return baseXP + streakBonus;
}

function checkMysteryBoxDrop(currentStreak) {
  // Only drop on streak milestones (7, 14, 21, ...)
  if (currentStreak % 7 !== 0) {
    return null;
  }

  // 5% drop rate
  const roll = Math.random();
  if (roll < 0.05) {
    const rewards = [
      { type: "xp", amount: 50 },
      { type: "freeze", amount: 1 },
      { type: "badge", id: "golden_flame_rare" },
    ];
    return rewards[Math.floor(Math.random() * rewards.length)];
  }

  return null;
}
```

### API Endpoints

```javascript
// apps/backend/src/api/controllers/GamificationController.js

async function getStreak(req, res) {
  try {
    const userId = req.user.id;
    const streak = await StreakService.getStreak(userId);

    return res.status(200).json({
      currentStreak: streak.currentStreak || 0,
      longestStreak: streak.longestStreak || 0,
      freezeCount: streak.freezeCount || 0,
      lastActivityDate: streak.lastActivityDate,
    });
  } catch (error) {
    console.error("Error fetching streak:", error);
    return res.status(500).json({ error: "Failed to fetch streak" });
  }
}

async function spendFreeze(req, res) {
  try {
    const userId = req.user.id;
    const result = await StreakService.spendFreeze(userId);

    return res.status(200).json({
      message: "Freeze spent successfully",
      freezeCount: result.freezeCount,
      lastActivityDate: result.lastActivityDate,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function getBadges(req, res) {
  try {
    const userId = req.user.id;
    const badges = await GamificationService.getBadges(userId);

    return res.status(200).json(badges);
  } catch (error) {
    console.error("Error fetching badges:", error);
    return res.status(500).json({ error: "Failed to fetch badges" });
  }
}
```

## Architecture Integration

```
POST /api/progress/test-result (Story 15.2)
    ↓
Save quiz answer → Update progress
    ↓
Trigger gamification side effects:
  1. StreakService.updateStreak(userId)
  2. GamificationService.calculateXP(correct, streak)
  3. GamificationService.checkAndAwardBadges(userId, streak)
  4. StreakService.checkAndAwardFreeze(userId)
  5. GamificationService.checkMysteryBoxDrop(streak)
    ↓
Return quiz result + gamification data:
  { nextReviewDate, lapseCount, xpEarned, newBadges, mysteryBox, freezeAwarded }
```

## Technical Challenges & Solutions

### Challenge: Race Condition in Streak Updates

**Problem:** Multiple concurrent quiz answers could cause race condition in streak increment (two requests both read currentStreak=5, both write currentStreak=6 instead of 6 and 7).

**Solution:** Use database transaction with row-level locking (`SELECT ... FOR UPDATE`) or atomic increment operation (`UPDATE ... SET currentStreak = currentStreak + 1`).

---

**Related Documentation:**

- [Story 15.3 BR](../../business-requirements/epic-15-learning-retention/story-15-3-streak-gamification-backend.md)
- [Epic 15 Implementation](./README.md)
