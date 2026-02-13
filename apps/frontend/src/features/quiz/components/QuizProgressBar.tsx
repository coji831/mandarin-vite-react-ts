/**
 * Quiz progress bar component
 * Story 15.6: Quiz Container & State Management
 *
 * Displays quiz progress: "X / Y completed" with visual bar
 */

import "./QuizProgressBar.css";

type QuizProgressBarProps = {
  current: number;
  total: number;
};

export function QuizProgressBar({ current, total }: QuizProgressBarProps) {
  const percentage = (current / total) * 100;

  return (
    <div className="progressContainer">
      <div className="progressText">
        {current} / {total}
      </div>
      <div className="progressBarBackground">
        <div className="progressBarFill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
