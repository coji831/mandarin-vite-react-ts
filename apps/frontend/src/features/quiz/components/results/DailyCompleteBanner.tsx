/**
 * DailyCompleteBanner
 * Story 15.11: Fixed 80px strip shown above results when the daily quiz limit is reached.
 * Displays the completion title and an inline countdown timer.
 */

import { NextQuizCountdown } from "./NextQuizCountdown";
import "./DailyCompleteBanner.css";

export { DailyCompleteBanner };

interface DailyCompleteBannerProps {
  expiresAt?: string | null;
  onExpire: () => void;
}

function DailyCompleteBanner({ expiresAt, onExpire }: DailyCompleteBannerProps) {
  return (
    <div className="daily-complete-compact">
      <span className="banner-title">Today's Quiz Complete! ✅</span>
      <NextQuizCountdown expiresAt={expiresAt || null} onExpire={onExpire} compact />
    </div>
  );
}
