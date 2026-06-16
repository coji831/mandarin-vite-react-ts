/**
 * LearnRoutes.tsx (formerly MandarinRoutes.tsx)
 *
 * Defines the routing for the Learn section (/learn/* routes):
 * - Uses LearnLayout for shared layout and nested routes with sub-navbar
 * - Index route renders ContentBrowserPage (replaces old VocabularyListPage)
 * - /flashcards/:listId: FlashCardPage (vocabulary feature)
 * - /quiz: QuizPage (quiz feature)
 * - /review: ReviewPage (placeholder)
 * - /basic: Basic (reference guide)
 *
 * Story 17.7: Replaced VocabularyListPage with ContentBrowser at index route.
 * Phase 3 restructure: Moved from features/mandarin/router/ to src/router/
 * Follows project conventions in docs/guides/conventions/frontend.md
 */
import { Route, Routes } from "react-router-dom";

import { Basic } from "features/vocabulary";
import { LearnLayout } from "../shared/layouts/LearnLayout";
import { FlashCardPage } from "../pages/FlashCardPage";
import { ReviewPage } from "../pages/ReviewPage";
import { ContentBrowserPage } from "../pages/ContentBrowserPage";
import { QuizPage } from "../pages/QuizPage";

export function LearnRoutes() {
  return (
    <Routes>
      <Route element={<LearnLayout />}>
        <Route index element={<ContentBrowserPage />} />
        <Route path="flashcards/:listId" element={<FlashCardPage />} />
        <Route path="quiz" element={<QuizPage />} />
        <Route path="review" element={<ReviewPage />} />
        <Route path="basic" element={<Basic />} />
      </Route>
    </Routes>
  );
}
