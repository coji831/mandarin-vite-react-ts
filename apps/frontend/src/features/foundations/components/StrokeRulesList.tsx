/**
 * @file components/StrokeRulesList.tsx
 * @description Stroke order rules list component
 * Story 18.4: Stroke Order Reference & Animations
 */

import type { StrokeOrderRule } from "../types";

export interface StrokeRulesListProps {
  rules: StrokeOrderRule[];
}

/**
 * Renders a list of stroke order rules with number, name, example character, and description.
 */
export function StrokeRulesList({ rules }: StrokeRulesListProps) {
  return (
    <div className="stroke-rules-container">
      {rules.map((rule) => (
        <div key={rule.id} className="stroke-rule-card">
          <span className="stroke-rule-number">{rule.number}.</span>
          <span className="stroke-rule-name">{rule.name}</span>
          <span className="stroke-rule-example">{rule.example}</span>
          <span className="stroke-rule-desc">({rule.description})</span>
        </div>
      ))}
    </div>
  );
}
