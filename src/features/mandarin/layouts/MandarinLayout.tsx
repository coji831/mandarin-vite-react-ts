/**
 * File: MandarinLayout.tsx
 * Story: 4-2 Create Layout Component with Outlet
 * Story: 4-8 Update Flashcard Navigation with Parameters
 * Description: Layout component for Mandarin feature routes. Wraps content with ProgressProvider (context access),
 * renders shared UI elements (NavBar), and uses React Router's Outlet for nested routes.
 * See docs/conventions.md for comment guidelines.
 */

import { Outlet } from "react-router-dom";
import { ProgressProvider } from "../context/ProgressContext";
import { NavBar } from "../components/NavBar";

export function MandarinLayout() {
  return (
    <ProgressProvider>
      <div className="mandarin-container">
        <NavBar />
        <div className="mandarin-content">
          <Outlet />
        </div>
      </div>
    </ProgressProvider>
  );
}
