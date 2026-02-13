/**
 * XPProgressBar Component
 * Displays current XP level with visual progress bar
 * Story 15.7: Gamification & AI Feedback Display UI
 */

import { calculateLevel, getXPWithinLevel } from "../utils";
import "./XPProgressBar.css";

type XPProgressBarProps = {
  currentXP: number;
};

export default function XPProgressBar({ currentXP }: XPProgressBarProps) {
  const level = calculateLevel(currentXP);
  const xpWithinLevel = getXPWithinLevel(currentXP);
  const progressPercent = xpWithinLevel;

  return (
    <div className="xp-progress-bar">
      <div className="xp-header">
        <span className="xp-level">Level {level}</span>
        <span className="xp-text">{xpWithinLevel} / 100 XP</span>
      </div>
      <div className="xp-bar-container">
        <div
          className="xp-bar-fill"
          style={{ width: `${progressPercent}%` }}
          role="progressbar"
          aria-valuenow={xpWithinLevel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Experience progress: ${xpWithinLevel} out of 100 XP`}
        />
      </div>
    </div>
  );
}
