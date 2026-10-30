/**
 * CompletionSlot — the `detail` archetype's position-locked next-action region
 * (Epic 26 §26.2.2).
 *
 * ONE shape, no variants. Identity decides the content, so the slot itself never
 * chooses between actions: `primary` is a single ReactNode prop, which makes
 * "exactly one primary" structural instead of policed. The old results surface
 * failed contract item 3 because three peer actions sat in one flex-wrap row —
 * here the primary has a fixed place and cannot move.
 *
 * Placement contract (not enforced by CSS — enforced by where it is mounted):
 *   always the LAST child of the page column, after the value (score/breakdown)
 *   and before optional secondary content (the collapsible answer review).
 *   Static positioning only: no position, no float, no sticky, no page CSS.
 *
 * Accessibility: `role="group"` + `aria-label` gives the region a name, so the
 * primary announced after a results mount has a context ("Next step, group").
 * The slot adds NO live region — the session owns the single `role="status"`
 * node (QuizSessionPage), per §26.2.4.
 *
 * Responsive: one row at >=768px; stacked with a full-width primary at <768px
 * (flex cross-axis stretch, so no width override touches the shared Button).
 */
import type { ReactNode } from "react";
import "./CompletionSlot.css";

export type CompletionSlotProps = {
  /** Accessible name of the region. */
  label?: string;
  /** Exactly one `Button variant="primary"`. */
  primary: ReactNode;
  /** At most two `ghost` / `icon` nodes. */
  secondary?: ReactNode;
  /** Optional supporting line that explains why this is the next step. */
  note?: string;
  className?: string;
};

export function CompletionSlot({
  label = "Next step",
  primary,
  secondary,
  note,
  className,
}: CompletionSlotProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className={["completion-slot flex-col gap-md", className].filter(Boolean).join(" ")}
    >
      {note && <p className="font-sm text-secondary m-0 lh-normal">{note}</p>}
      <div className="completion-slot__primary flex flex-col gap-sm">{primary}</div>
      {secondary && <div className="flex flex-wrap items-center gap-md">{secondary}</div>}
    </div>
  );
}
