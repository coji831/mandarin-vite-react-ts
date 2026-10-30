/**
 * PracticesRoutes.tsx
 *
 * Defines routing for the Practices section (/practices/* routes).
 * - /practices index: the two practice pathways (Review + Quiz)
 * - /practices/review: ReviewPage (the picker at Browse, the session at Focus)
 * - /practices/quiz: QuizPage
 *
 * Wireframe Section 1.3: Review + Quiz moved from /learn/* to /practices/*
 * C1: Nested under practices/ in Router.tsx
 *
 * Rework (§1 / BM-1): the review route is NO LONGER behind `ProtectedRoute`. A
 * guest can run a review (the queue is session-local — see
 * `features/review/services/guestReviewSource.ts`); only persistence needs an
 * account, and that ask lands at the end of the session.
 */
import { Navigate, Route, Routes } from "react-router-dom";
import { practices_page } from "shared/constants";
import PracticesPage from "../pages/practices/PracticesPage";
import { ReviewPage } from "../pages/practices/ReviewPage";
import { QuizPage } from "../pages/practices/QuizPage";

export function PracticesRoutes() {
  return (
    <Routes>
      <Route index element={<PracticesPage />} />
      <Route path="review" element={<ReviewPage />} />
      <Route path="quiz" element={<QuizPage />} />
      <Route path="*" element={<Navigate to={practices_page} replace />} />
    </Routes>
  );
}
