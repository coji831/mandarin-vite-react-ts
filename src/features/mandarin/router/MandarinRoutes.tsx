/**
 * MandarinRoutes.tsx
 *
 * Defines the routing for the Mandarin feature:
 * - Uses MandarinLayout for shared layout and nested routes
 * - Redirects root to vocabulary list
 * - /vocabulary-list: VocabularyListPage (list selection and search)
 * - /flashcards/:listId: FlashCardPage (study flashcards for selected vocabulary list)
 *
 * Updated for Epic 7: List-based navigation, no daily commitment or section routes
 * Follows project conventions in docs/guides/conventions.md
 */
import { Navigate, Route, Routes } from "react-router-dom";

import { MandarinLayout } from "../layouts";
import { FlashCardPage, VocabularyListPage } from "../pages";

export function MandarinRoutes() {
  return (
    <Routes>
      <Route element={<MandarinLayout />}>
        <Route index element={<Navigate to="vocabulary-list" replace />} />
        <Route path="vocabulary-list" element={<VocabularyListPage />} />
        <Route path="flashcards/:listId" element={<FlashCardPage />} />
      </Route>
    </Routes>
  );
}
