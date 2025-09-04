import { Outlet } from "react-router-dom";
import { ProgressProvider } from "../context/ProgressContext";
// import { Navbar } from "../components/Navbar"; // Uncomment if Navbar exists

/**
 * MandarinLayout - Layout component for Mandarin feature routes
 * Wraps content with MandarinProvider and renders shared UI elements.
 */
export function MandarinLayout() {
  return (
    <ProgressProvider>
      /** * File: MandarinLayout.tsx * Story: 4-1 Create Nested Route Structure * Description:
      Layout component for Mandarin feature routes, wraps content with ProgressProvider. * See
      docs/conventions.md for comment guidelines. */
      <div className="mandarin-container">
        {/* <Navbar /> */}
        <div className="mandarin-content">
          <Outlet />
        </div>
      </div>
    </ProgressProvider>
  );
}
