/**
 * DailyCompleteBanner
 * Story 15.11: Fixed 80px strip shown above results when the daily quiz limit is reached.
 * Displays the completion title and an inline countdown timer.
 * When countdown expires: timer replaced with "Start New Quiz" button
 */

import { useState } from "react";
import { NextQuizCountdown } from "./NextQuizCountdown";
import { Button } from "../../../../shared/components";
import "./DailyCompleteBanner.css";

export { DailyCompleteBanner };

interface DailyCompleteBannerProps {
  expiresAt?: string | null;
  onExpire: () => void;
  onStartNewQuiz: () => void;
}

function DailyCompleteBanner({ expiresAt, onExpire, onStartNewQuiz }: DailyCompleteBannerProps) {
  const [countdownExpired, setCountdownExpired] = useState<boolean>(
    () => !expiresAt || new Date(expiresAt) <= new Date(),
  );

  const handleCountdownExpire = () => {
    setCountdownExpired(true);
    onExpire();
  };

  return (
    <div className="daily-complete-compact">
      <span className="banner-title">Today's Quiz Complete! ✅</span>
      {!countdownExpired ? (
        <NextQuizCountdown expiresAt={expiresAt || null} onExpire={handleCountdownExpire} compact />
      ) : (
        <Button variant="primary" onClick={onStartNewQuiz} size="sm">
          Start New Quiz
        </Button>
      )}
    </div>
  );
}
