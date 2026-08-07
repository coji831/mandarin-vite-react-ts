/**
 * @file index.ts
 * @description Barrel exports for the grammar feature — Grammar pattern library.
 * Story 22.3: Grammar UI
 *
 * Only re-exports — no inline definitions.
 */

export { GRAMMAR_PHASES } from "./constants";
export { GrammarFilterBar, GrammarCard, GrammarList, GrammarHub } from "./components";
export type {
  GrammarFilterBarProps,
  GrammarCardProps,
  GrammarListProps,
  GrammarHubProps,
} from "./components";

export { useGrammar, useGrammarDetail } from "./hooks";
export type { UseGrammarReturn, UseGrammarDetailReturn } from "./hooks";

export { grammarService } from "./services";
export type { GrammarServiceListParams } from "./services";

export { mapGrammarApiToData, isPatternLocked, segmentToEntityRef } from "./utils";

export type {
  GrammarSegment,
  GrammarSegmentEntityType,
  GrammarExample,
  GrammarRelatedPattern,
  GrammarPatternSummary,
  GrammarPatternDetail,
  GrammarListResponse,
  GrammarPatternData,
  GrammarFilter,
} from "./types";
