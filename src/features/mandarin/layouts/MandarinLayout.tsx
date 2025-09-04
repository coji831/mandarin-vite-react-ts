/**
 * File: MandarinLayout.tsx
 * Story: 4-2 Create Layout Component with Outlet
 * Description: Layout component for Mandarin feature routes. Wraps content with ProgressProvider (context access),
 * renders shared UI elements (e.g., Navbar), and uses React Router's Outlet for nested routes.
 * See docs/conventions.md for comment guidelines.
 */

import { Outlet } from "react-router-dom";
import { ProgressProvider } from "../context/ProgressContext";
// import { Navbar } from "../components/Navbar"; // Uncomment if Navbar exists

export function MandarinLayout() {
  return (
    <ProgressProvider>
      <div className="mandarin-container">
        {/* Shared UI element: Uncomment and implement <Navbar /> if needed */}
        {/* <Navbar /> */}
        <div className="mandarin-content">
          <Outlet />
        </div>
      </div>
    </ProgressProvider>
  );
}
