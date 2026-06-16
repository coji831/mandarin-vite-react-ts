/**
 * LearnLayout component
 *
 * Layout for the Learn section (/learn/* routes).
 * Story 17.6: Removed ProgressProvider and UserIdentityProvider wrappers.
 * Zustand stores are used directly — no providers needed.
 * Story 17.7: Changed Vocabulary link from /learn/vocabulary-list to /learn.
 *
 * Provides:
 * - Sub-navbar with Vocabulary, Quiz, Review, Basics links
 * - Outlet for nested Learn routes
 *
 * Phase 2: Navigation redesign - replaces MandarinLayout with contextual sub-nav
 * Phase 3: Routes migrated from /mandarin to /learn
 */
import { Link, Outlet, useLocation } from "react-router-dom";
import "./LearnLayout.css";

export { LearnLayout };

function LearnLayout() {
  const location = useLocation();

  return (
    <div className="learn-layout">
      {/* Learn Sub-Navbar */}
      <nav className="learn-subnav">
        <Link
          to="/learn"
          className={`subnav-link ${location.pathname === "/learn" ? "active" : ""}`}
        >
          📚 Vocabulary
        </Link>

        <Link
          to="/learn/quiz"
          className={`subnav-link ${location.pathname.startsWith("/learn/quiz") ? "active" : ""}`}
        >
          📝 Quiz
        </Link>

        <Link
          to="/learn/review"
          className={`subnav-link ${location.pathname.startsWith("/learn/review") ? "active" : ""}`}
        >
          🔄 Review
        </Link>

        <Link
          to="/learn/basic"
          className={`subnav-link ${location.pathname === "/learn/basic" ? "active" : ""}`}
        >
          🎯 Basics
        </Link>
      </nav>

      {/* Main Content */}
      <div className="learn-content">
        <Outlet />
      </div>
    </div>
  );
}
