/**
 * BadgeDisplay Component
 * Displays earned and locked badges with modal details
 * Story 15.7: Gamification & AI Feedback Display UI
 */

import { useState, useEffect } from "react";
import type { Badge } from "../types/GamificationTypes";
import "./BadgeDisplay.css";

type BadgeDisplayProps = {
  badges: Badge[];
};

export default function BadgeDisplay({ badges }: BadgeDisplayProps) {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  // Close modal on Escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSelectedBadge(null);
      }
    }

    if (selectedBadge) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [selectedBadge]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedBadge) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedBadge]);

  const handleBadgeClick = (badge: Badge) => {
    setSelectedBadge(badge);
  };

  const handleCloseModal = () => {
    setSelectedBadge(null);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  return (
    <div className="badge-display">
      <h3 className="badge-title">Achievements</h3>
      <div className="badge-grid" role="list">
        {badges.map((badge) => {
          const isEarned = Boolean(badge.earnedDate);
          return (
            <button
              key={badge.id}
              className={`badge-item ${isEarned ? "badge-earned" : "badge-locked"}`}
              onClick={() => handleBadgeClick(badge)}
              aria-label={`${badge.name}${isEarned ? " - Earned" : " - Locked"}`}
              role="listitem"
            >
              <span className="badge-icon">{badge.icon}</span>
              <span className="badge-name">{badge.name}</span>
              {!isEarned && badge.percentComplete !== undefined && (
                <span className="badge-progress">{badge.percentComplete}%</span>
              )}
            </button>
          );
        })}
      </div>

      {selectedBadge && (
        <div
          className="badge-modal-backdrop"
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="badge-modal">
            <button className="modal-close" onClick={handleCloseModal} aria-label="Close modal">
              ✕
            </button>
            <div className="modal-icon-container">
              <span className="modal-icon">{selectedBadge.icon}</span>
            </div>
            <h2 id="modal-title" className="modal-title">
              {selectedBadge.name}
            </h2>
            <p className="modal-description">{selectedBadge.description}</p>

            {selectedBadge.earnedDate ? (
              <div className="modal-earned">
                <span className="earned-label">Earned on:</span>
                <span className="earned-date">
                  {new Date(selectedBadge.earnedDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            ) : (
              <div className="modal-progress">
                <div className="progress-info">
                  <span className="progress-label">Progress</span>
                  <span className="progress-numbers">
                    {selectedBadge.progress} / {selectedBadge.streakRequired} days
                  </span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${selectedBadge.percentComplete || 0}%`,
                    }}
                  />
                </div>
                <div className="progress-percent">{selectedBadge.percentComplete}% Complete</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
