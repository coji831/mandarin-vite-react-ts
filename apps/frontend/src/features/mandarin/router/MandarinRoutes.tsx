/**
 * MandarinRoutes.tsx
 *
 * Defines the routing for the Learn section (/learn/* routes):
 * - Uses LearnLayout for shared layout and nested routes with sub-navbar
 * - Redirects root to vocabulary list
 * - /vocabulary-list: VocabularyListPage (list selection and search)
 * - /flashcards/:listId: FlashCardPage (study flashcards for selected vocabulary list)
 * - /quiz: QuizPage (quiz feature - Story 15.5+)
 * - /review: ReviewPage (spaced repetition review)
 * - /basic: Basic (reference guide)
 *
 * Updated for Epic 15: Navigation redesign with two-level navbar
 * Phase 3: Routes migrated from /mandarin to /learn
 * Follows project conventions in docs/guides/conventions.md
 */
import { Navigate, Route, Routes } from "react-router-dom";

import { Basic } from "../components/Basic";
import { FlashCardPage, VocabularyListPage } from "../pages";
import { LearnLayout } from "../../../layouts/LearnLayout";
import { QuizPage } from "../../../pages/QuizPage";
import { ReviewPage } from "../../../pages/ReviewPage";

export function MandarinRoutes() {
  return (
    <Routes>
      <Route element={<LearnLayout />}>
        <Route index element={<Navigate to="vocabulary-list" replace />} />
        <Route path="vocabulary-list" element={<VocabularyListPage />} />
        <Route path="flashcards/:listId" element={<FlashCardPage />} />
        <Route path="quiz" element={<QuizPage />} />
        <Route path="review" element={<ReviewPage />} />
        <Route path="basic" element={<Basic />} />
      </Route>
    </Routes>
  );
}
