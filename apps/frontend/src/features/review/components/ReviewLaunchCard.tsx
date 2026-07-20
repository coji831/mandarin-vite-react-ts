/**
 * ReviewLaunchCard
 *
 * Self-contained review launch card for the Practices index page.
 * Shows a single "Start Review" CTA that navigates to the review page.
 * Content type and source selection happen on the review page via the
 * Picker component (Step 1: pick type, Step 2: pick source).
 */
import { useReviewLaunchCard } from "../hooks/useReviewLaunchCard";
import { Box, Button } from "shared/components";

export function ReviewLaunchCard() {
  const { startReview } = useReviewLaunchCard();

  return (
    <Box variant="dark" padding="lg" className="flex-col gap-md">
      <h2 className="font-2xl fw-700 text-primary m-0">🃏 Review</h2>
      <p className="font-sm text-secondary m-0 lh-normal">
        Focus on one content type. No timer, self-rated.
      </p>

      <Button variant="primary" onClick={startReview}>
        🃏 Start Review
        <span>▸</span>
      </Button>
    </Box>
  );
}
