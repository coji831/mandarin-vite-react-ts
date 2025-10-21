/**
 * File: MandarinLayout.tsx
 * Purpose: Layout component for Mandarin feature routes
 * Features:
 *   - Wraps all Mandarin pages with ProgressProvider for context access
 *   - Renders shared UI elements (NavBar)
 *   - Uses React Router's Outlet for nested routing
 *   - Supports navigation and progress tracking for vocabulary and flashcard pages
 * Related: Story 4-2 (Layout Component), Story 4-8 (Flashcard Navigation)
 * Last updated: 2025-10-09
 * See docs/conventions.md for comment guidelines.
 */

import { Outlet } from "react-router-dom";

import { NavBar } from "../components";
import { ProgressProvider, UserIdentityProvider, VocabularyProvider } from "../context";

export function MandarinLayout() {
  return (
    <UserIdentityProvider>
      <ProgressProvider>
        <VocabularyProvider>
          <div className="mandarin-container">
            <NavBar />
            <div className="mandarin-content">
              <Outlet />
            </div>
          </div>
        </VocabularyProvider>
      </ProgressProvider>
    </UserIdentityProvider>
  );
}
