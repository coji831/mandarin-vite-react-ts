/**
 * StatsGrid Component
 * Component Reorganization: Renamed from QuizStatsGrid
 * Story 15.10: Quiz UX Polish - Component Reorganization
 *
 * Displays quiz completion statistics in a grid layout.
 * Pure presentational component for accuracy, XP, and correct answer metrics.
 */

import { LeechWarning } from "./LeechWarning";
import "./StatsGrid.css";

type StatsGridProps = {
  correctCount: number;
  totalCount: number;
  accuracy: number;
  xpEarned: number;
  leechCount?: number;
};

export function StatsGrid({
  correctCount,
  totalCount,
  accuracy,
  xpEarned,
  leechCount = 0,
}: StatsGridProps) {
  return (
    <div className="w-full">
      <div className="statsGrid w-full grid-3-col">
        <div className="statCard flex-col">
          <span className="statLabel">Accuracy</span>
          <span className="statValue">
            {Number(accuracy)
              .toFixed(2)
              .replace(/\.?0+$/, "")}
            %
          </span>
        </div>

        <div className="statCard flex-col">
          <span className="statLabel">XP Earned</span>
          <span className="statValue xpValue">+{xpEarned}</span>
        </div>

        <div className="statCard flex-col">
          <span className="statLabel">Correct Answers</span>
          <span className="statValue">
            {correctCount} / {totalCount}
          </span>
        </div>
      </div>
      <LeechWarning leechCount={leechCount} />
    </div>
  );
}
