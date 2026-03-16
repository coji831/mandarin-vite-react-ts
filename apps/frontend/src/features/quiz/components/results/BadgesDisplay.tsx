/**
 * BadgesDisplay Component
 * Component Reorganization: Renamed from QuizBadgesSection
 * Story 15.10: Quiz UX Polish - Component Reorganization
 *
 * Displays newly earned badges in a grid layout.
 * Pure presentational component, only renders when badges exist.
 */

import type { Badge } from "../../../gamification/types/GamificationTypes";
import "./BadgesDisplay.css";

type BadgesDisplayProps = {
  badges: Badge[];
};

export function BadgesDisplay({ badges }: BadgesDisplayProps) {
  if (badges.length === 0) return null;

  return (
    <div className="newBadgesSection">
      <h3 className="badgesTitle">🎉 New Badges Earned!</h3>
      <div className="badgesGrid">
        {badges.map((badge) => (
          <div key={badge.id} className="badgeCard">
            <span className="badgeIcon">{badge.icon}</span>
            <div className="badgeInfo">
              <strong>{badge.name}</strong>
              <p>{badge.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
