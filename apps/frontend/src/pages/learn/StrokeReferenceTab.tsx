/**
 * @file StrokeReferenceTab.tsx
 * @description Stroke Reference page — pure layout orchestration
 * Story 18.4: Stroke Order Reference & Animations
 */

import { StrokeReferenceContent } from "features/foundations/components";
import "./StrokeReferenceTab.css";

export function StrokeReferenceTab() {
  return (
    <div className="stroke-ref-tab flex-col gap-xs w-full">
      <StrokeReferenceContent />
    </div>
  );
}
