/**
 * BadgeCelebrationModal Component
 * Story 15.11: Business Logic Flows - Badge Award Celebration (Flow 2.6)
 *
 * Displays badge celebration modal with confetti animation on quiz completion.
 * Triggered when user earns new badges (7, 30, 100, or 365-day streak milestones).
 *
 * Features:
 * - Confetti celebration animation (30 pieces, randomized colors/delays)
 * - Auto-dismiss after 5 seconds
 * - Manual dismiss via button or overlay click
 * - Displays first badge (if multiple awarded simultaneously)
 * - Purple gradient background with bounce animation
 */

import { useEffect, useRef, useState } from "react";
import type { Badge } from "../types/GamificationTypes";
import "./BadgeCelebrationModal.css";

export { BadgeCelebrationModal };

type BadgeCelebrationModalProps = {
  badges: Badge[];
  isOpen: boolean;
  onClose: () => void;
};

function BadgeCelebrationModal({ badges, isOpen, onClose }: BadgeCelebrationModalProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);

      // Auto-dismiss after 5 seconds
      timerRef.current = window.setTimeout(() => {
        onClose();
      }, 5000);

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    } else {
      // Delay unmounting to allow exit animation
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  const handleClose = () => {
    // Clear auto-dismiss timer on manual dismiss
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onClose();
  };

  if (!shouldRender || badges.length === 0) return null;

  // Display first badge only (if multiple awarded)
  const badge = badges[0];

  return (
    <div className="modal-overlay badge-celebration" onClick={handleClose}>
      <div className="modal-content celebration" onClick={(e) => e.stopPropagation()}>
        {/* Confetti Animation */}
        <div className="confetti-container">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                backgroundColor: ["#ffd700", "#ff6b6b", "#4ecdc4", "#45b7d1", "#f7b801"][i % 5],
              }}
            />
          ))}
        </div>

        {/* Badge Display */}
        <div className="badge-celebration-icon">{badge.icon}</div>
        <h2 className="badge-celebration-title">🎉 New Badge Earned!</h2>
        <h3 className="badge-celebration-name">{badge.name}</h3>
        {badge.description && <p className="badge-celebration-description">{badge.description}</p>}

        {/* Multiple badges indicator */}
        {badges.length > 1 && (
          <p className="badge-celebration-multiple">
            +{badges.length - 1} more badge{badges.length > 2 ? "s" : ""}
          </p>
        )}

        {/* Dismiss Button */}
        <button onClick={handleClose} className="modal-button celebrate">
          Awesome! 🎉
        </button>
      </div>
    </div>
  );
}
