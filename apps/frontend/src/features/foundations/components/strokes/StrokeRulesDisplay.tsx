/**
 * @file components/StrokeRulesDisplay.tsx
 * @description Stroke order rule info display for current character
 * Story 18.4: Stroke Order Reference & Animations
 */

export interface StrokeRulesDisplayProps {
  appliedRules: string[];
}

/**
 * Renders the stroke order rule(s) that apply to the current character.
 * Falls back to a default message when no specific rules are detected.
 */
export function StrokeRulesDisplay({ appliedRules }: StrokeRulesDisplayProps) {
  return (
    <div className="stroke-anim-rules font-xs text-muted text-center">
      <span className="stroke-anim-rules-label text-muted">Rule applied: </span>
      <span className="stroke-anim-rules-value text-primary font-italic">
        {appliedRules.length > 0
          ? appliedRules.join(" \u00b7 ")
          : "Determined by character structure"}
      </span>
    </div>
  );
}
