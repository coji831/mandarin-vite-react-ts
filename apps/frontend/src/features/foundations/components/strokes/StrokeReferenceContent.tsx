/**
 * @file components/StrokeReferenceContent.tsx
 * @description Self-contained stroke reference content — manages data loading internally
 * Story 18.4: Stroke Order Reference & Animations
 *
 * Encapsulates useStrokeReferenceData internally.
 * Pages should import this as a ready-to-use component.
 */

import { useStrokeReferenceData } from "features/foundations/hooks";
import { BasicStrokesGrid } from "./BasicStrokesGrid";
import { StrokeRulesList } from "./StrokeRulesList";

export function StrokeReferenceContent() {
  const { data, isLoading, error } = useStrokeReferenceData();

  if (isLoading) {
    return (
      <>
        <section className="flex-col">
          <h3 className="stroke-ref-heading font-sm m-0">The 8 Basic Strokes</h3>
          <p className="stroke-ref-subtitle font-xs">Learn by sight — no writing required</p>
          <div className="stroke-ref-loading font-lg flex-center text-muted">
            <p>Loading stroke reference...</p>
          </div>
        </section>
      </>
    );
  }

  if (error || !data) {
    return (
      <section className="flex-col">
        <p>Failed to load stroke reference data.</p>
      </section>
    );
  }

  return (
    <>
      <section className="flex-col">
        <h3 className="stroke-ref-heading font-sm text-secondary fw-600 m-0">
          The 8 Basic Strokes
        </h3>
        <p className="stroke-ref-subtitle font-xs text-muted">
          Learn by sight — no writing required
        </p>
        <BasicStrokesGrid strokes={data.strokes} />
      </section>

      <section className="flex-col">
        <h3 className="stroke-ref-heading font-sm text-secondary fw-600 m-0">
          The 4 Stroke Order Rules
        </h3>
        <StrokeRulesList rules={data.strokeOrderRules} />
      </section>

      <p className="stroke-ref-tip font-xs font-italic text-muted m-0 text-center">
        🛈 Once you know these rules, you can guess the stroke order for ~95% of characters.
      </p>
    </>
  );
}
