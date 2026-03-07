/**
 * NextQuizCountdown
 * Displays countdown timer until next quiz is available (midnight reset)
 *
 * Shows time remaining until expiresAt timestamp
 * Format: "Next quiz in: 5h 23m" or "23m 45s" for <1 hour remaining
 * Calls onExpire callback when countdown reaches zero
 *
 * Used by: ResultsLayout when isDailyComplete = true
 */

import { useState, useEffect } from "react";
import "./NextQuizCountdown.css";

interface NextQuizCountdownProps {
  expiresAt: string | null; // ISO 8601 timestamp (midnight)
  onExpire?: () => void; // Callback when countdown reaches zero
}

export function NextQuizCountdown({ expiresAt, onExpire }: NextQuizCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) {
      return;
    }

    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const expireTime = new Date(expiresAt).getTime();
      const diff = expireTime - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining("Ready!");
        if (onExpire && !isExpired) {
          onExpire();
        }
        return "expired";
      }

      // Calculate hours, minutes, seconds
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // Format based on time remaining
      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }

      return "active";
    };

    // Initial calculation
    const status = calculateTimeRemaining();
    if (status === "expired") {
      return;
    }

    // Update interval based on time remaining
    const updateInterval = timeRemaining.includes("h") ? 60000 : 1000; // 1 minute for hours, 1 second otherwise
    const interval = setInterval(calculateTimeRemaining, updateInterval);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire, isExpired, timeRemaining]);

  if (!expiresAt) {
    return null;
  }

  return (
    <div className={`next-quiz-countdown ${isExpired ? "expired" : ""}`}>
      <div className="countdown-icon">⏰</div>
      <div className="countdown-content">
        <div className="countdown-label">{isExpired ? "New quiz available!" : "Next quiz in:"}</div>
        <div className="countdown-time">{timeRemaining}</div>
      </div>
    </div>
  );
}
