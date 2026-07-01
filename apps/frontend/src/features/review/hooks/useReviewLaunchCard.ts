/**
 * useReviewLaunchCard
 *
 * Hook for the ReviewLaunchCard — provides a single startReview action
 * that navigates to the review page. Content type selection happens on
 * the review page itself via the Picker component (Step 1).
 */
import { useNavigate } from "react-router-dom";
import { practices_review } from "shared/constants";

export function useReviewLaunchCard() {
  const navigate = useNavigate();

  const startReview = () => {
    navigate(practices_review);
  };

  return { startReview };
}
