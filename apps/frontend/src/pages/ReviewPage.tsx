/**
 * ReviewPage
 * Phase 1 Review — Flip-card SRS review for pinyin, tones, and strokes.
 * Replaces the old placeholder page.
 */
import { useNavigate } from "react-router-dom";
import { ReviewView } from "../features/review";

export function ReviewPage() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "var(--space-xl) var(--space-lg)" }}>
      <ReviewView onBack={() => navigate("/practices")} />
    </div>
  );
}
