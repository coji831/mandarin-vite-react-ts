/**
 * File: MandarinRoutes.tsx
 * Story: 4-1 Create Nested Route Structure
 * Description: Defines nested routing for Mandarin feature, connecting all subpages and parameters.
 * See docs/conventions.md for comment guidelines.
 */
import { Routes, Route, Navigate } from "react-router-dom";
import { MandarinLayout } from "../layouts/MandarinLayout";
import {
  VocabularyListPage,
  DailyCommitmentPage,
  SectionConfirmPage,
  SectionSelectPage,
  FlashCardPage,
} from "../pages";

/**
 * MandarinRoutes - Nested routing configuration for Mandarin feature
 *
 * Routes:
 *   /mandarin (index) - redirects to vocabulary list
 *   /mandarin/vocabulary-list
 *   /mandarin/daily-commitment
 *   /mandarin/section-confirm
 *   /mandarin/section-select
 *   /mandarin/flashcards/:sectionId
 */
export function MandarinRoutes() {
  return (
    <Routes>
      <Route element={<MandarinLayout />}>
        <Route index element={<Navigate to="vocabulary-list" replace />} />
        <Route path="vocabulary-list" element={<VocabularyListPage />} />
        <Route path="daily-commitment" element={<DailyCommitmentPage />} />
        <Route path="section-confirm" element={<SectionConfirmPage />} />
        <Route path="section-select" element={<SectionSelectPage />} />
        <Route path="flashcards/:sectionId" element={<FlashCardPage />} />
      </Route>
    </Routes>
  );
}
