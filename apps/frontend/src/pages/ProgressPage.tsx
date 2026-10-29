/**
 * Progress page
 *
 * Says what is true, or says nothing (rework-proposal §6). The page this
 * replaces rendered three stub cards whose copy promised future surfaces, one of
 * which carried a dev receipt ("Backend integration: Story 15.3 (Completed)")
 * inside an alert — that receipt is gone, and so are the promises.
 *
 * What remains is the shape the proposal names: ONE populated card built from
 * numbers the API can actually return (foundation sections completed, radicals
 * memorized) plus ONE honest empty state for badges, whose single primary CTA is
 * the action that makes those numbers move. A visitor with no data gets the empty
 * state alone — an empty grid reads as broken, an empty state reads as early.
 *
 * Anatomy (page-anatomy law): PageShell(settings measure) → PageStack →
 * PageHeader → card / empty state. No page-scoped layout CSS.
 */
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  EmptyState,
  PageHeader,
  PageShell,
  PageStack,
  Skeleton,
} from "shared/components";
import { practices_review } from "shared/constants";
import { ProgressSummaryCard, useProgressSummary } from "features/progress";

export { ProgressPage };

function ProgressPage() {
  const navigate = useNavigate();
  const summary = useProgressSummary();

  return (
    <PageShell archetype="settings">
      <PageStack size="default">
        <PageHeader title="Your Progress" description="The numbers PinyinPal can measure today." />

        {summary.isLoading ? (
          <div className="flex-col gap-md" role="status" aria-label="Loading progress">
            <Skeleton variant="card" height="160px" />
            <Skeleton variant="card" height="120px" />
          </div>
        ) : summary.hasData ? (
          <>
            <ProgressSummaryCard summary={summary} />
            <Box variant="dashed" radius="lg" padding="2xl">
              <EmptyState
                icon="star"
                iconTone="accent"
                title="Badges appear after your first review"
                description="Milestone badges are not built yet. Reviewed items and masteries are what they will be counted from."
                action={
                  <Button variant="primary" onClick={() => navigate(practices_review)}>
                    Start a review
                  </Button>
                }
              />
            </Box>
          </>
        ) : (
          <Box variant="dashed" radius="lg" padding="2xl">
            <EmptyState
              icon="progress"
              iconTone="accent"
              title="Nothing to show yet"
              description="Finish a review or a foundation section and your numbers appear here."
              action={
                <Button variant="primary" onClick={() => navigate(practices_review)}>
                  Start a review
                </Button>
              }
            />
          </Box>
        )}
      </PageStack>
    </PageShell>
  );
}
