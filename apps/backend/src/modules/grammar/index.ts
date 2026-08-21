/**
 * @file apps/backend/src/modules/grammar/index.ts
 * @description Grammar module barrel exports (framework-agnostic surface only
 * — the Express HTTP layer was removed at the 24-15 cutover).
 */
export { GrammarService } from "./services/GrammarService.js";
export { GrammarRepository } from "./repositories/GrammarRepository.js";
export { GrammarNotFoundError, GrammarValidationError } from "./types/grammar.js";
export type {
  GrammarPatternSummary,
  GrammarListQuery,
  GrammarListParams,
  GrammarListResponse,
  GrammarSegment,
  GrammarExample,
  GrammarRelatedPattern,
  GrammarPatternDetail,
} from "./types/grammar.js";
