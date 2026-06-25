/**
 * ReviewPage
 * Phase 1 Review — URL-driven router for picker vs session.
 *
 * URL states:
 *   /practices/review              → shows ReviewPicker
 *   /practices/review?type=T&filter=F → shows ReviewView (session)
 *   /practices/review?type=T       → redirects to /practices/review
 *   /practices/review?filter=F     → redirects to /practices/review
 */
import { useNavigate, useSearchParams } from "react-router-dom";
import { practices_page, practices_review } from "../../shared/constants/paths";
import { ReviewView, ReviewPicker } from "../../features/review";
import type { ReviewSource } from "../../features/review";

export function ReviewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetType = searchParams.get("type");
  const presetSource = searchParams.get("filter");

  // If only one param is set, redirect to clean picker URL
  if ((presetType && !presetSource) || (!presetType && presetSource)) {
    navigate(practices_review, { replace: true });
    return null;
  }

  // Both type and filter present → show review session
  if (presetType && presetSource) {
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

  // No params → show picker
  return (
    <div className="flex-col-center gap-lg p-xl">
      <ReviewPicker
        onStart={(source: ReviewSource, type: string) =>
          navigate(`${practices_review}?type=${type}&filter=${source}`)
        }
      />
    </div>
  );
}
