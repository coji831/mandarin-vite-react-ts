/**
 * PracticesRoutes.tsx
 *
 * Defines routing for the Practices section (/practices/* routes).
 * - /practices index: placeholder with links
 * - /practices/review: ReviewPage (SRS flashcard queue)
 * - /practices/quiz: QuizPage
 *
 * Wireframe Section 1.3: Review + Quiz moved from /learn/* to /practices/*
 * C1: Nested under practices/ in Router.tsx
 */
import { Navigate, Route, Routes } from "react-router-dom";
import PracticesPage from "../pages/PracticesPage";
import { ReviewPage } from "../pages/ReviewPage";
import { QuizPage } from "../pages/QuizPage";

export function PracticesRoutes() {
  return (
    <Routes>
      <Route index element={<PracticesPage />} />
      <Route path="review" element={<ReviewPage />} />
      <Route path="quiz" element={<QuizPage />} />
      <Route path="*" element={<Navigate to="/practices" replace />} />
    </Routes>
  );
}
