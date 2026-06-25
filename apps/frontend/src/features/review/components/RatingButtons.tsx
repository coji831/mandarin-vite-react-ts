/**
 * RatingButtons.tsx
 * Phase 1 Review — Again/Good/Easy SRS rating buttons.
 */
import type { Rating } from "../types";
import "./RatingButtons.css";

type RatingButtonsProps = {
  onRate: (rating: Rating) => void;
  disabled?: boolean;
};

const RATINGS: { value: Rating; label: string; color: string; description: string }[] = [
  { value: "again", label: "Again", color: "var(--color-error)", description: "Didn't remember" },
  { value: "good", label: "Good", color: "var(--color-warning)", description: "Took some effort" },
  { value: "easy", label: "Easy", color: "var(--color-success)", description: "Instant recall" },
];

export function RatingButtons({ onRate, disabled = false }: RatingButtonsProps) {
  return (
    <div className="flex-center gap-md flex-wrap">
      {RATINGS.map((r) => (
        <button
          key={r.value}
          className="rating-btn radius-md fw-700 hover-lift flex-col-center gap-xs p-md font-md"
          onClick={() => onRate(r.value)}
          disabled={disabled}
          style={{
            border: `2px solid ${r.color}`,
            background: `${r.color}15`,
            color: r.color,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
          }}
          type="button"
        >
          <span>
            {r.value === "again" ? "🔴" : r.value === "good" ? "🟡" : "🟢"} {r.label}
          </span>
          <span className="rating-btn__label fw-400 font-sm op-80">{r.description}</span>
        </button>
      ))}
    </div>
  );
}
