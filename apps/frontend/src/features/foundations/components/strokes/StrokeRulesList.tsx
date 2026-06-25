/**
 * @file components/StrokeRulesList.tsx
 * @description Stroke order rules list component
 * Story 18.4: Stroke Order Reference & Animations
 */

import type { StrokeOrderRule } from "../../types";
import "./StrokeRulesList.css";

export interface StrokeRulesListProps {
  rules: StrokeOrderRule[];
}

/**
 * Renders a list of stroke order rules with number, name, example character, and description.
 */
export function StrokeRulesList({ rules }: StrokeRulesListProps) {
  return (
    <div className="stroke-rules-container bg-surface-dark-alt border-default radius-md p-xs flex-col">
      {rules.map((rule) => (
        <div key={rule.id} className="stroke-rule-card">
          <span className="stroke-rule-number font-sm shrink-0 fw-700">{rule.number}.</span>
          <span className="stroke-rule-name font-sm whitespace-nowrap fw-600 text-secondary">
            {rule.name}
          </span>
          <span className="stroke-rule-example font-lg shrink-0 fw-500 text-primary">
            {rule.example}
          </span>
          <span className="stroke-rule-desc font-xs font-italic text-muted">
            ({rule.description})
          </span>
        </div>
      ))}
    </div>
  );
}
