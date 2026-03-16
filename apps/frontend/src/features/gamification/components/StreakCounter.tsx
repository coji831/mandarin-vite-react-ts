/**
 * StreakCounter Component
 *
 * Displays user's current streak with visual state indicators.
 * Three states:
 * - Active: Last activity within 24 hours (green theme)
 * - At Risk: Last activity 24-48 hours ago (yellow theme, warns user)
 * - Broken: No activity for 48+ hours (gray theme)
 *
 * Architecture:
 * - Part of gamification header UI, shown in dashboard and quiz results
 * - Calculates status dynamically based on lastActivityDate timestamp
 * - Used by spaced repetition system to track learning consistency
 * - Connected to freeze power-up (temporarily pauses streak decay)
 *
 * Related Stories:
 * - Story 15.7: Gamification & AI Feedback Display UI
 * - Story 15.15: Spaced Repetition Integration (uses for scheduling)
 * - Story 15.9: Mystery Box freeze reward (prevents streak break)
 */

import type { StreakData } from "../types/GamificationTypes";
import "./StreakCounter.css";

type StreakCounterProps = {
  streakData: StreakData;
};

type StreakStatus = "active" | "at-risk" | "broken";

function getStreakStatus(lastActivityDate: Date): StreakStatus {
  const now = new Date();
  const hoursSinceActivity = (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60);

  if (hoursSinceActivity < 24) return "active";
  if (hoursSinceActivity < 48) return "at-risk";
  return "broken";
}

export default function StreakCounter({ streakData }: StreakCounterProps) {
  const { currentStreak, freezeCount, lastActivityDate } = streakData;
  const status = getStreakStatus(lastActivityDate);

  const statusConfig = {
    active: {
      icon: "🔥",
      message: `${currentStreak} Day Streak!`,
      className: "streak-active",
    },
    "at-risk": {
      icon: "🔥",
      message: "Streak at risk!",
      className: "streak-at-risk",
    },
    broken: {
      icon: "🪦",
      message: "Build your streak",
      className: "streak-broken",
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`streak-counter ${config.className}`}>
      <div className="streak-main">
        <span className="streak-icon" aria-label={`Streak status: ${status}`}>
          {config.icon}
        </span>
        <div className="streak-content">
          <div className="streak-message">{config.message}</div>
          {status === "active" && <div className="streak-subtitle">Keep it going!</div>}
          {status === "at-risk" && (
            <div className="streak-subtitle">
              Complete a quiz today to save your {currentStreak}-day streak
            </div>
          )}
        </div>
      </div>

      <div className="streak-freeze">
        <span className="freeze-icon" aria-label="Streak freezes available">
          ❄️
        </span>
        <span className="freeze-count">x{freezeCount} Freezes Available</span>
        <div className="freeze-tooltip" role="tooltip">
          Streak Freezes protect your streak when you miss a day. Use them wisely!
        </div>
      </div>
    </div>
  );
}
