/**
 * ReviewPage
 * Phase 1 Review — URL-driven router for picker vs session.
 *
 * URL states:
 *   /practices/review                    → shows ReviewPicker
 *   /practices/review?type=T&filter=F    → shows ReviewView (session)
 *   /practices/review?type=T             → shows ReviewPicker with type pre-selected
 *   /practices/review?filter=F           → shows ReviewPicker (no type pre-selected)
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
          navigate(`${practices_review}?type=${type}&filter=${source}`)
        }
      />
    </div>
  );
}
