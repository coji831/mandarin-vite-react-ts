/**
 * ReviewPage
 * Phase 1 Review — URL-driven router for picker vs session.
 *
 * URL states:
 *   /practices/review                    → shows ReviewPicker (Browse — the entry surface)
 *   /practices/review?type=T&filter=F    → shows ReviewView (Focus — the session)
 *   /practices/review?type=T             → shows ReviewPicker with type pre-selected
 *   /practices/review?filter=F           → shows ReviewPicker (no type pre-selected)
 *
 * Story 22.4 follow-up (Issue 4): `type` + `filter` read via useSearchParamState
 * (validated, URL-driven); starting a session PUSHES via withSearchParams so Back
 * exits the session.
 *
 * Rework (§4): the bug was structural — BOTH branches used to render inside
 * `PageShell archetype="detail"`, so choosing a deck happened in Focus chrome
 * with the rail collapsed. The picker is now the overview/Browse entry surface
 * (a real PageHeader, the corrected copy) and only the session is detail/Focus.
 * `pageChrome`'s session-query rule makes the CHROME agree with this shell.
 */
import { useNavigate } from "react-router-dom";
import {
  SEARCH_PARAMS,
  practices_page,
  practices_review,
  withSearchParams,
} from "shared/constants";
import { useSearchParamState } from "shared/hooks";
import { PageHeader, PageShell, PageStack } from "shared/components";
import { ReviewView, ReviewPicker } from "../../features/review";
import type { ReviewSource } from "../../features/review";

export function ReviewPage() {
  const navigate = useNavigate();
  const [presetType] = useSearchParamState<string | null>(SEARCH_PARAMS.type, {
    defaultValue: null,
    parse: (raw) => (raw ? raw : null),
  });
  const [presetSource] = useSearchParamState<string | null>(SEARCH_PARAMS.filter, {
    defaultValue: null,
    parse: (raw) => (raw ? raw : null),
  });

  // Only auto-start when BOTH type and filter are explicitly provided
  const hasBothParams = presetType && presetSource;

  if (hasBothParams) {
    return (
      <PageShell archetype="detail">
        <PageStack size="default">
          <ReviewView
            onBack={() => navigate(practices_page)}
            presetType={presetType}
            presetSource={presetSource}
          />
        </PageStack>
      </PageShell>
    );
  }

  // Entry surface: choosing a deck is not a session yet, so it stays Browse.
  return (
    <PageShell archetype="overview">
      <PageStack size="default">
        <PageHeader
          title="Review"
          description="Type the answer, then rate yourself: Again / Good / Easy."
        />
        <ReviewPicker
          presetType={presetType}
          onStart={(source: ReviewSource, type: string) =>
            navigate(withSearchParams(practices_review, { type, filter: source }))
          }
        />
      </PageStack>
    </PageShell>
  );
}
