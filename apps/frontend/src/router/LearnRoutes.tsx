/**
 * LearnRoutes.tsx (formerly MandarinRoutes.tsx)
 *
 * Defines the routing for the Learn section (/learn/* routes):
 * - Uses LearnLayout for shared layout and nested routes with sub-navbar
 * - Redirects root to vocabulary list
 * - /vocabulary-list: VocabularyListPage (vocabulary feature)
 * - /flashcards/:listId: FlashCardPage (vocabulary feature)
 * - /quiz: QuizPage (quiz feature)
 * - /review: ReviewPage (placeholder)
 * - /basic: Basic (reference guide)
 *
 * Phase 3 restructure: Moved from features/mandarin/router/ to src/router/
 * Follows project conventions in docs/guides/conventions/frontend.md
 */
import { Navigate, Route, Routes } from "react-router-dom";

import { Basic } from "features/vocabulary";
import { LearnLayout } from "../shared/layouts/LearnLayout";
import { FlashCardPage } from "../pages/FlashCardPage";
import { ReviewPage } from "../pages/ReviewPage";
import { VocabularyListPage } from "../pages/VocabularyListPage";
import { QuizPage } from "../pages/QuizPage";

export function LearnRoutes() {
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
