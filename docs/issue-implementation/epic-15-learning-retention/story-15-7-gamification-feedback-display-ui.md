# Implementation 15-7: Gamification & Feedback Display UI

## Technical Scope

Build display components for streaks, badges, XP, and AI feedback. Accepts mocked props (no API calls).

**Files Created:**

- `apps/frontend/src/features/gamification/components/StreakCounter.tsx`
- `apps/frontend/src/features/gamification/components/BadgeDisplay.tsx`
- `apps/frontend/src/features/gamification/components/XPProgressBar.tsx`
- `apps/frontend/src/features/quiz/components/AIFeedbackPanel.tsx`

## Implementation Details

### StreakCounter Component

```typescript
// apps/frontend/src/features/gamification/components/StreakCounter.tsx

import React from 'react';
import styles from './StreakCounter.module.css';

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
  freezeCount: number;
  lastActivityDate: Date;
}

export const StreakCounter: React.FC<StreakCounterProps> = ({
  currentStreak,
  longestStreak,
  freezeCount,
  lastActivityDate
}) => {
  const hoursSinceActivity = (new Date().getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60);
  const isAtRisk = hoursSinceActivity > 24 && hoursSinceActivity <= 48;
  const isBroken = hoursSinceActivity > 48;

  const flameIcon = isBroken ? '🪦' : isAtRisk ? '🔥' : '🔥';
  const flameColor = isBroken ? 'gray' : isAtRisk ? 'red' : 'green';

  return (
    <div className={styles.streakContainer}>
      <div className={styles.streakDisplay}>
        <span className={styles.flame} style={{ color: flameColor }}>
          {flameIcon}
        </span>
        <div>
          <div className={styles.currentStreak}>{currentStreak} Day Streak</div>
          <div className={styles.longestStreak}>Longest: {longestStreak} days</div>
        </div>
      </div>

      {isAtRisk && (
        <div className={styles.warning}>
          ⚠️ Streak at risk! Complete a quiz within {48 - Math.floor(hoursSinceActivity)} hours.
        </div>
      )}

      <div className={styles.freezeCount} title="Streak freezes protect your streak when you miss a day">
        ❄️ {freezeCount} Freezes Available
      </div>
    </div>
  );
};
```

### BadgeDisplay Component

```typescript
// apps/frontend/src/features/gamification/components/BadgeDisplay.tsx

import React, { useState } from 'react';
import styles from './BadgeDisplay.module.css';

interface Badge {
  id: string;
  name: string;
  icon: string;
  streakRequired?: number;
  earnedDate?: Date;
  progress?: number;
  percentComplete?: number;
}

interface BadgeDisplayProps {
  earned: Badge[];
  available: Badge[];
}

export const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ earned, available }) => {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  return (
    <div className={styles.badgeContainer}>
      <h3>Your Badges</h3>

      <div className={styles.badgeGrid}>
        {earned.map(badge => (
          <div
            key={badge.id}
            className={styles.badgeItem}
            onClick={() => setSelectedBadge(badge)}
          >
            <div className={styles.badgeIcon}>{badge.icon}</div>
            <div className={styles.badgeName}>{badge.name}</div>
          </div>
        ))}

        {available.map(badge => (
          <div
            key={badge.id}
            className={`${styles.badgeItem} ${styles.locked}`}
            onClick={() => setSelectedBadge(badge)}
          >
            <div className={styles.badgeIcon} style={{ filter: 'grayscale(100%)' }}>
              {badge.icon}
            </div>
            <div className={styles.badgeName}>{badge.name}</div>
            <div className={styles.progress}>{badge.percentComplete}%</div>
          </div>
        ))}
      </div>

      {selectedBadge && (
        <div className={styles.modal} onClick={() => setSelectedBadge(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h4>{selectedBadge.name}</h4>
            {selectedBadge.earnedDate ? (
              <p>Earned on {selectedBadge.earnedDate.toLocaleDateString()}</p>
            ) : (
              <p>Progress: {selectedBadge.progress} / {selectedBadge.streakRequired} days</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
```

### XPProgressBar Component

```typescript
// apps/frontend/src/features/gamification/components/XPProgressBar.tsx

import React from 'react';
import styles from './XPProgressBar.module.css';

interface XPProgressBarProps {
  currentXP: number;
}

export const XPProgressBar: React.FC<XPProgressBarProps> = ({ currentXP }) => {
  const level = Math.floor(currentXP / 100);
  const xpInLevel = currentXP % 100;
  const nextLevelXP = 100;
  const percentage = (xpInLevel / nextLevelXP) * 100;

  return (
    <div className={styles.xpContainer}>
      <div className={styles.levelDisplay}>
        Level {level}
      </div>

      <div className={styles.xpBar}>
        <div className={styles.xpFill} style={{ width: `${percentage}%` }} />
      </div>

      <div className={styles.xpText}>
        {xpInLevel} / {nextLevelXP} XP
      </div>
    </div>
  );
};
```

### AIFeedbackPanel Component

```typescript
// apps/frontend/src/features/quiz/components/AIFeedbackPanel.tsx

import React from 'react';
import styles from './AIFeedbackPanel.module.css';

type ErrorType = 'tone' | 'character' | 'meaning' | 'generic';

interface AIFeedbackPanelProps {
  explanation: string;
  errorType: ErrorType;
  loading?: boolean;
}

export const AIFeedbackPanel: React.FC<AIFeedbackPanelProps> = ({
  explanation,
  errorType,
  loading = false
}) => {
  const errorBadges = {
    tone: { label: '🔊 Tone Difference', color: '#fbbf24' },
    character: { label: '✏️ Character Confusion', color: '#60a5fa' },
    meaning: { label: '💡 Meaning Mix-up', color: '#a78bfa' },
    generic: { label: 'ℹ️ Review Needed', color: '#9ca3af' }
  };

  const badge = errorBadges[errorType];

  if (loading) {
    return (
      <div className={styles.feedbackPanel}>
        <div className={styles.skeleton}>Loading explanation...</div>
      </div>
    );
  }

  return (
    <div className={styles.feedbackPanel}>
      <div className={styles.errorBadge} style={{ backgroundColor: badge.color }}>
        {badge.label}
      </div>
      <p className={styles.explanation}>{explanation}</p>
    </div>
  );
};
```

## Architecture Integration

```
DailyReviewTest (Story 15.6) or Dashboard
    ↓
Renders gamification components with mocked props:
  - StreakCounter({ currentStreak: 5, longestStreak: 10, freezeCount: 2, lastActivityDate })
  - BadgeDisplay({ earned: [...], available: [...] })
  - XPProgressBar({ currentXP: 280 })
  - AIFeedbackPanel({ explanation: "...", errorType: "tone" })
    ↓
Story 15.9 will replace mocked props with API-fetched data
```

---

**Related Documentation:**

- [Story 15.7 BR](../../business-requirements/epic-15-learning-retention/story-15-7-gamification-feedback-display-ui.md)
- [Epic 15 Implementation](./README.md)
