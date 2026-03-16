/**
 * LearnLayout component
 *
 * Layout for the Learn section (/learn/* routes).
 * Provides:
 * - ProgressProvider and UserIdentityProvider contexts
 * - Sub-navbar with Vocabulary, Quiz, Review, Basics links
 * - Outlet for nested Learn routes
 *
 * Phase 2: Navigation redesign - replaces MandarinLayout with contextual sub-nav
 * Phase 3: Routes migrated from /mandarin to /learn
 */
import { Link, Outlet, useLocation } from "react-router-dom";
import { ProgressProvider, UserIdentityProvider } from "../features/mandarin/context";
import "./LearnLayout.css";

export { LearnLayout };

function LearnLayout() {
  const location = useLocation();

  return (
    <UserIdentityProvider>
      <ProgressProvider>
        <div className="learn-layout">
          {/* Learn Sub-Navbar */}
          <nav className="learn-subnav">
            <Link
              to="/learn/vocabulary-list"
              className={`subnav-link ${
                location.pathname === "/learn/vocabulary-list" || location.pathname === "/learn"
                  ? "active"
                  : ""
              }`}
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
      </ProgressProvider>
    </UserIdentityProvider>
  );
}
