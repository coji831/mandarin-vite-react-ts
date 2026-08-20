/**
 * @file components/StrokeReferenceContent.tsx
 * @description Self-contained stroke reference content — manages data loading internally
 * Story 18.4: Stroke Order Reference & Animations
 *
 * Encapsulates useStrokeReferenceData internally.
 * Pages should import this as a ready-to-use component.
 */

import { useStrokeReferenceData } from "features/foundations/hooks";
import { Button, Box } from "shared/components";
import { BasicStrokesGrid } from "./BasicStrokesGrid";
import { StrokeRulesList } from "./StrokeRulesList";

export function StrokeReferenceContent() {
  const { data, isLoading, error, retry } = useStrokeReferenceData();

  if (isLoading) {
    return (
      <>
        <section className="flex-col">
          <h3 className="stroke-ref-heading font-sm m-0">The 5 Basic Strokes</h3>
          <p className="stroke-ref-subtitle font-xs">Learn by sight — no writing required</p>
          <Box variant="dark-alt" padding="xs" className="stroke-grid flex flex-wrap">
            {[1, 2, 3, 4, 5].map((i) => (
              <Box key={i} variant="dark-alt" padding="xs" className="stroke-card flex-col gap-xs">
                <span className="stroke-glyph font-3xl lh-1 fw-600 text-muted">?</span>
                <span className="stroke-pinyin font-xs text-muted">loading...</span>
                <span className="stroke-meaning font-xs text-muted">loading...</span>
              </Box>
            ))}
          </Box>
        </section>
      </>
    );
  }

  if (error || !data) {
    return (
      <section className="stroke-ref-error flex-col-center gap-sm">
        <span className="font-lg text-muted">Failed to load stroke reference data</span>
        <Button variant="primary" onClick={retry}>
          Retry
        </Button>
      </section>
    );
  }

  return (
    <>
      {/* Intro header — full width */}
      <Box variant="dark" padding="md" className="stroke-ref-header flex-col gap-xs">
        <h2 className="font-xl fw-700 text-secondary m-0">Stroke Reference Guide</h2>
        <p className="font-sm text-muted m-0">
          {data.strokes.length} basic strokes &middot; {data.strokeOrderRules.length} stroke order
          rules &middot; 95% character coverage
        </p>
        <p className="font-sm text-muted m-0">
          Master these fundamentals to write any Chinese character
        </p>
      </Box>

      {/* Basic Strokes */}
      <section className="flex-col">
        <h3 className="stroke-ref-heading font-sm text-secondary fw-600 m-0">
          The {data.strokes.length} Basic Strokes
        </h3>
        <p className="stroke-ref-subtitle font-xs text-muted">
          Learn by sight — no writing required
        </p>
        <BasicStrokesGrid strokes={data.strokes} />
      </section>

      {/* Stroke Order Rules */}
      <section className="flex-col">
        <h3 className="stroke-ref-heading font-sm text-secondary fw-600 m-0">
          The {data.strokeOrderRules.length} Stroke Order Rules
        </h3>
        <StrokeRulesList rules={data.strokeOrderRules} />
      </section>

      {/* Suggested Characters */}
      <section className="flex-col">
        <h3 className="stroke-ref-heading font-sm text-secondary fw-600 m-0">
          Try These Characters
        </h3>
        <p className="stroke-ref-subtitle font-xs text-muted">
          Switch to the Animations tab to see stroke order in motion
        </p>
        <Box
          variant="dark-alt"
          padding="xs"
          className="stroke-ref-suggested flex-center flex-wrap gap-xs"
        >
          {data.suggestedCharacters.map((char: string) => (
            <Box
              key={char}
              variant="item"
              as="span"
              className="stroke-ref-suggested-char text-secondary font-lg fw-500"
            >
              {char}
            </Box>
          ))}
        </Box>
      </section>

      {/* Tip callout — full width */}
      <Box variant="dark" padding="md" className="stroke-ref-tip">
        <div className="flex-center gap-xs stroke-ref-tip-header">
          <span className="font-lg">💡</span>
          <span className="font-sm fw-600 text-secondary">Tip:</span>
        </div>
        <p className="font-sm text-tertiary mt-xs">
          Once you know these rules, you can guess the stroke order for ~95% of characters. Stroke
          order matters for handwriting recognition — even phone keyboards expect the correct stroke
          count.
        </p>
      </Box>
    </>
  );
}
