/**
 * ReviewPage
 * Phase 1 Review — URL-driven router for picker vs session.
 *
 * URL states:
 *   /practices/review                    → shows ReviewPicker
 *   /practices/review?type=T&filter=F    → shows ReviewView (session)
 *   /practices/review?type=T             → shows ReviewPicker with type pre-selected
 *   /practices/review?filter=F           → shows ReviewPicker (no type pre-selected)
 *
 * Story 22.4 follow-up (Issue 4): `type` + `filter` read via useSearchParamState
 * (validated, URL-driven); starting a session PUSHES via withSearchParams so Back
 * exits the session.
 */
import { useNavigate } from "react-router-dom";
import {
  SEARCH_PARAMS,
  practices_page,
  practices_review,
  withSearchParams,
} from "shared/constants";
import { useSearchParamState } from "shared/hooks";
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
      <div className="flex-col-center gap-lg p-xl">
        <ReviewView
          onBack={() => navigate(practices_page)}
          presetType={presetType}
          presetSource={presetSource}
        />
      </div>
    );
  }

  // Show picker (with optional pre-selected type)
  return (
    <div className="flex-col-center gap-lg p-xl">
      <ReviewPicker
        presetType={presetType}
        onStart={(source: ReviewSource, type: string) =>
          navigate(withSearchParams(practices_review, { type, filter: source }))
        }
      />
    </div>
  );
}
