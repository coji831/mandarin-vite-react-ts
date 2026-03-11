/**
 * XPProgressBar Component
 *
 * Displays user's current XP level with a visual progress bar showing progress
 * toward the next level. Includes level number and XP within level (0-100).
 *
 * Architecture:
 * - Part of gamification header UI, appears in daily complete banner and quiz results
 * - Uses utility functions to calculate level and progress (exponential growth)
 * - Styled with CSS Grid for responsive layout
 *
 * Related Stories:
 * - Story 15.7: Gamification & AI Feedback Display UI
 * - Story 15.9: Mystery Box rewards (draws from same earning mechanism)
 * - Story 15.11: Quiz session completion triggers XP updates
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
