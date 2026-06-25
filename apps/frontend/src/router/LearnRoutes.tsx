/**
 * LearnRoutes.tsx
 *
 * Defines the routing for the Learn section (/learn/* routes):
 * - Uses LearnLayout with phase-gated tab bar
 * - Index route redirects to /learn/foundations
 * - Each content type has its own route (dedicated page or placeholder)
 * - Old routes (flashcards, basic) redirect to /learn/foundations
 *
 * Story 18.1: Replaced ContentBrowser index with phase-gated route navigation.
 * ContentBrowser still works at /library for freeroam browsing.
 */
import { Navigate, Route, Routes } from "react-router-dom";
import { practices_quiz, practices_review } from "../shared/constants/paths";
import { LearnLayout } from "../shared/layouts/LearnLayout";
import { FoundationsPage, ContentPlaceholderPage } from "../pages/learn";

export function LearnRoutes() {
  return (
    <Routes>
      <Route element={<LearnLayout />}>
        <Route index element={<Navigate to="/learn/foundations" replace />} />
        <Route path="foundations" element={<FoundationsPage />} />
        {/* Future content type placeholders */}
        <Route path="radicals" element={<ContentPlaceholderPage title="Radicals" />} />
        <Route path="grammar" element={<ContentPlaceholderPage title="Grammar" />} />
        <Route
          path="phonetic-clusters"
          element={<ContentPlaceholderPage title="Phonetic Clusters" />}
        />
        <Route path="readers" element={<ContentPlaceholderPage title="Graded Readers" />} />
        <Route path="chengyu" element={<ContentPlaceholderPage title="Chengyu" />} />
        {/* Redirect old routes */}
        <Route path="flashcards/*" element={<Navigate to="/learn/foundations" replace />} />
        <Route path="quiz" element={<Navigate to={practices_quiz} replace />} />
        <Route path="review" element={<Navigate to={practices_review} replace />} />
        <Route path="basic" element={<Navigate to="/learn/foundations" replace />} />
      </Route>
    </Routes>
  );
}
