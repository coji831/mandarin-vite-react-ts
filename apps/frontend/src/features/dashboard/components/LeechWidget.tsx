/**
 * LeechWidget Component
 * Story 15.9: Gamification & AI Integration
 *
 * Displays "Focus Words" - vocabulary with lapseCount >= 5.
 * Only shown when user has 3+ leeches (business rule).
 * Provides quick access to targeted review.
 *
 * Features:
 * - Shows up to 5 leeches with lapse counts
 * - "Review Now" button navigates to quiz
 * - Dismissible with localStorage tracking (daily reset)
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "services";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import "./LeechWidget.css";

export { LeechWidget };

type LeechWord = {
  id: string;
  simplified: string;
  pinyin: string;
  english: string;
  lapseCount: number;
  studyCount: number;
};

type LeechResponse = {
  count: number;
  leeches: LeechWord[];
};

function LeechWidget() {
  const [leeches, setLeeches] = useState<LeechWord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkDismissed = () => {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const dismissedDate = localStorage.getItem("leech_widget_dismissed");
      return dismissedDate === today;
    };

    if (checkDismissed()) {
      setDismissed(true);
      setLoading(false);
      return;
    }

    const fetchLeeches = async () => {
      try {
        const response = await apiClient.get<LeechResponse>(ROUTE_PATTERNS.progressLeeches, {
          params: { minLapseCount: 5 },
        });

        setTotalCount(response.data.count);
        // Show up to 5 leeches
        setLeeches(response.data.leeches.slice(0, 5));
      } catch (err) {
        console.error("Failed to fetch leeches:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeeches();
  }, []);

  const handleDismiss = () => {
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem("leech_widget_dismissed", today);
    setDismissed(true);
  };

  const handleReviewClick = () => {
    navigate("/quiz/daily-review");
  };

  // Business Rule: Only show if 3+ leeches
  if (loading || dismissed || totalCount < 3) {
    return null;
  }

  return (
    <div className="leech-widget">
      <div className="leech-header">
        <h3 className="leech-title">
          🎯 Focus Words <span className="leech-badge">{totalCount}</span>
        </h3>
        <button onClick={handleDismiss} className="dismiss-button" aria-label="Dismiss">
          ×
        </button>
      </div>

      <p className="leech-description">
        Words needing extra practice. Review these to improve your retention!
      </p>

      <ul className="leech-list">
        {leeches.map((leech) => (
          <li key={leech.id} className="leech-item">
            <div className="leech-word">
              <span className="leech-chinese">{leech.simplified}</span>
              <span className="leech-pinyin">{leech.pinyin}</span>
            </div>
            <div className="leech-meta">
              <span className="leech-english">{leech.english}</span>
              <span className="leech-count" title="Consecutive failures">
                🔴 {leech.lapseCount}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <button onClick={handleReviewClick} className="review-button">
        Review Now →
      </button>
    </div>
  );
}
