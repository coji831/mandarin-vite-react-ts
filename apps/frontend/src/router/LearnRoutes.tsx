/**
 * LearnRoutes.tsx
 *
 * Defines the routing for the Learn section (/learn/* routes):
 * - Uses LearnLayout for shared layout
 * - Index route renders ContentBrowserPage (the main content browser)
 * - Phase-gated content routes will be added by subsequent epics
 * - Old routes (flashcards, quiz, review, basic) moved to /practices/*
 *
 * Story 17.7: Replaced VocabularyListPage with ContentBrowser at index route.
 * B1: Removed old routes (flashcards, quiz, review, basic).
 * B2: Added redirects for removed routes.
 */
import { Navigate, Route, Routes } from "react-router-dom";

import { LearnLayout } from "../shared/layouts/LearnLayout";
import ContentBrowserPage from "../pages/ContentBrowserPage";

export function LearnRoutes() {
  return (
    <Routes>
      <Route element={<LearnLayout />}>
        <Route index element={<ContentBrowserPage />} />
        {/* Redirect old routes to their new locations */}
        <Route path="flashcards/*" element={<Navigate to="/learn" replace />} />
        <Route path="quiz" element={<Navigate to="/practices/quiz" replace />} />
        <Route path="review" element={<Navigate to="/practices/review" replace />} />
        <Route path="basic" element={<Navigate to="/learn" replace />} />
      </Route>
    </Routes>
  );
}
