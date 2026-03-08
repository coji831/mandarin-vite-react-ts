/**
 * MysteryBoxModal Component
 * Story 15.9: Gamification & AI Integration
 *
 * Displays mystery box reward with celebration animation.
 * Triggered on 7-day streak multiples with 5% drop rate.
 *
 * Features:
 * - Confetti celebration animation
 * - Gift box reveal with fade-in
 * - Displays reward type (XP/freeze/badge) with icon
 */

import { useEffect, useState } from "react";
import type { MysteryBox } from "../../quiz/types";
import "./MysteryBoxModal.css";

export { MysteryBoxModal };

type MysteryBoxModalProps = {
  mysteryBox: MysteryBox;
  isOpen: boolean;
  onClose: () => void;
};

function MysteryBoxModal({ mysteryBox, isOpen, onClose }: MysteryBoxModalProps) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Delay reward reveal for suspense
      const timer = setTimeout(() => setRevealed(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setRevealed(false);
    }
  }, [isOpen]);

  if (!isOpen || !mysteryBox) return null;

  const getRewardText = () => {
    switch (mysteryBox.type) {
      case "xp":
        return `+${mysteryBox.amount} XP Boost!`;
      case "freeze":
        return `${mysteryBox.amount} Streak Freeze${(mysteryBox.amount || 0) > 1 ? "s" : ""}!`;
      case "badge":
        return `New Badge: ${mysteryBox.name}!`;
      default:
        return mysteryBox.name;
    }
  };

  return (
    <div className="mystery-box-overlay" onClick={onClose}>
      <div className="mystery-box-modal" onClick={(e) => e.stopPropagation()}>
        {/* Confetti using CSS animation instead of react-confetti for simplicity */}
        {revealed && (
          <div className="confetti-container">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  backgroundColor: ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A"][
                    Math.floor(Math.random() * 5)
                  ],
                }}
              />
            ))}
          </div>
        )}

        <div className="mystery-box-content">
          {/* Gift box icon */}
          <div className={`gift-box ${revealed ? "revealed" : ""}`}>
            <div className="gift-icon">🎁</div>
          </div>

          {/* Reward reveal */}
          {revealed && (
            <div className="reward-reveal">
              <div className="reward-icon">{mysteryBox.icon}</div>
              <h2 className="reward-title">Mystery Box!</h2>
              <p className="reward-text">{getRewardText()}</p>
              <p className="reward-subtitle">{mysteryBox.name}</p>
            </div>
          )}

          {/* Close button */}
          {revealed && (
            <button onClick={onClose} className="close-button">
              Awesome! 🎉
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
