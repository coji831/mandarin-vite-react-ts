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
  compact?: boolean; // Inline text-only variant (no card styling)
}

function calcTimeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Ready!";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function NextQuizCountdown({ expiresAt, onExpire, compact }: NextQuizCountdownProps) {
  // Initialized synchronously — no empty-string first render (prevents CLS)
  const [timeRemaining, setTimeRemaining] = useState<string>(() =>
    expiresAt ? calcTimeRemaining(expiresAt) : "",
  );
  const [isExpired, setIsExpired] = useState<boolean>(
    () => !!expiresAt && new Date(expiresAt) <= new Date(),
  );

  useEffect(() => {
    if (!expiresAt) return;

    const tick = () => {
      const result = calcTimeRemaining(expiresAt);
      if (result === "Ready!") {
        setIsExpired(true);
        setTimeRemaining("Ready!");
        onExpire?.();
        return true; // expired
      }
      setTimeRemaining(result);
      return false;
    };

    // Already expired on mount — no interval needed
    if (tick()) return;

    // Interval cadence based on live remaining time (avoids stale-closure bug)
    const getInterval = () =>
      new Date(expiresAt).getTime() - Date.now() > 3_600_000 ? 60_000 : 1_000;

    let interval = setInterval(() => {
      const done = tick();
      if (done) {
        clearInterval(interval);
      }
    }, getInterval());

    // Recalculate cadence when crossing the 1-hour boundary
    const cadenceCheck = setInterval(() => {
      clearInterval(interval);
      interval = setInterval(() => {
        const done = tick();
        if (done) clearInterval(interval);
      }, getInterval());
    }, 60_000);

    return () => {
      clearInterval(interval);
      clearInterval(cadenceCheck);
    };
  }, [expiresAt, onExpire]);

  if (!expiresAt) return null;

  if (compact) {
    return (
      <span className="countdown-inline">
        {isExpired ? "🎉 New quiz available!" : `⏰ Next quiz in: ${timeRemaining}`}
      </span>
    );
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
