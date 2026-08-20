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
  /** Accessible name for the progressbar (axe aria-progressbar-name). */
  "aria-label"?: string;
};

export function ProgressBar({
  value,
  threshold,
  className = "",
  "aria-label": ariaLabel,
}: ProgressBarProps) {
  return (
    <div
      className={`progress-bar__track ${className}`}
      role="progressbar"
      aria-label={ariaLabel ?? "Progress"}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="progress-bar__fill" style={{ width: `${Math.max(value, 4)}%` }} />
      {/* inline: dynamic width/left — percentage values computed from props */}
      {threshold !== undefined && (
        <div className="progress-bar__threshold" style={{ left: `${threshold}%` }} />
      )}
    </div>
  );
}
