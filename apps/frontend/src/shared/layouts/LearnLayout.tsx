/**
 * LearnLayout component
 *
 * Layout for the Learn section (/learn/* routes).
 * Story 17.6: Removed ProgressProvider and UserIdentityProvider wrappers.
 * Zustand stores are used directly — no providers needed.
 * Story 17.7: Changed Vocabulary link from /learn/vocabulary-list to /learn.
 * Story 17.7: Removed sub-navbar (redundant with ContentBrowser TabBar per wireframe Section 1.1).
 *
 * Provides:
 * - Outlet for nested Learn routes
 *
 * Phase 2: Navigation redesign - replaces MandarinLayout with contextual sub-nav
 * Phase 3: Routes migrated from /mandarin to /learn
 */
import { Outlet } from "react-router-dom";
import "./LearnLayout.css";

export { LearnLayout };

function LearnLayout() {
  return (
    <div className="learn-layout">
      <div className="learn-content">
        <Outlet />
      </div>
    </div>
  );
}
