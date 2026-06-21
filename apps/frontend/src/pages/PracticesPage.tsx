/**
 * PracticesPage
 *
 * Practices index page showing available quiz types and review options.
 * Displays a card grid with navigation to quiz sessions and the review page.
 *
 * Wireframe Section 1.1: Practices at /practices/*
 * Available after Phase 1.
 *
 * Story 17.7: Added as global nav item matching wireframe.
 * Story 15.x: Replaced placeholder with quiz selection cards.
 */
import { Link } from "react-router-dom";
import "./PracticesPage.css";

export default function PracticesPage() {
  return (
    <div className="practicesPage">
      <div className="practicesPageHeader">
        <h1 className="practicesPageTitle">🎯 Practices</h1>
        <p className="practicesPageSubtitle">Review and Quiz</p>
      </div>

      <div className="practicesCardGrid">
        {/* Phase 1 Gate Quiz */}
        <Link to="/practices/quiz?type=audio-to-type" className="practicesCard">
          <div className="practicesCardIcon">📝</div>
          <h2 className="practicesCardTitle">Phase 1 Gate Quiz</h2>
          <p className="practicesCardDescription">Audio-to-Type — 20 questions, 90% to pass</p>
          <div className="practicesCardFooter">
            <span className="practicesCardBadge">Phase 1</span>
            <span className="practicesCardLink">
              Start Quiz
              <span className="practicesCardLinkArrow">→</span>
            </span>
          </div>
        </Link>

        {/* Review */}
        <Link to="/practices/review" className="practicesCard">
          <div className="practicesCardIcon">🃏</div>
          <h2 className="practicesCardTitle">Review</h2>
          <p className="practicesCardDescription">Spaced repetition flashcard review</p>
          <div className="practicesCardFooter">
            <span className="practicesCardLink">
              Go to Review
              <span className="practicesCardLinkArrow">→</span>
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
