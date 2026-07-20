/**
 * ProgressBar Component — Simple progress bar
 *
 * Shows a track with a gradient fill bar and optional threshold marker.
 * Uses CSS variables for colors, inline style for dynamic width.
 */
import "./ProgressBar.css";

type ProgressBarProps = {
  value: number; // 0-100
  threshold?: number; // optional marker position (0-100)
  className?: string;
};

export function ProgressBar({ value, threshold, className = "" }: ProgressBarProps) {
  return (
    <div
      className={`progress-bar__track ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="progress-bar__fill" style={{ width: `${Math.max(value, 4)}%` }} />
      {threshold !== undefined && (
        <div className="progress-bar__threshold" style={{ left: `${threshold}%` }} />
      )}
    </div>
  );
}
