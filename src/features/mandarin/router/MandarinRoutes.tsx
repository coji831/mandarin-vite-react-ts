/**
 * File: MandarinRoutes.tsx
 * Story: 4-1 Create Nested Route Structure
 * Description: Defines nested routing for Mandarin feature, connecting all subpages and parameters.
 * See docs/conventions.md for comment guidelines.
 */
import { Routes, Route, Navigate } from "react-router-dom";
import { MandarinLayout } from "../layouts/MandarinLayout";
import { VocabularyListPage, FlashCardPage } from "../pages";

export function MandarinRoutes() {
  return (
    <Routes>
      <Route element={<MandarinLayout />}>
        <Route index element={<Navigate to="vocabulary-list" replace />} />
        <Route path="vocabulary-list" element={<VocabularyListPage />} />
        {/* Old routes removed for Story 7-4. Archive if needed. */}
        <Route path="flashcards/:listId" element={<FlashCardPage />} />
      </Route>
    </Routes>
  );
}
