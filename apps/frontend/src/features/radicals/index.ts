/**
 * Radicals feature — Chinese radical browser
 * Story 19.1: Radicals Browser Structure
 * Story 19.4: Radical Trees (Phase 3)
 *
 * Provides a filterable grid of Kangxi radicals with search, stroke count filtering,
 * top-20 toggle, and sort controls. Content is loaded from static JSON files.
 * Phase 3 adds radical tree visualization with expandable character branches.
 */

export {
  RadicalCard,
  RadicalGrid,
  FilterBar,
  RadicalDetailCard,
  ExampleCharGrid,
  ExampleCharCell,
  RadicalTreesTab,
  CharacterListNode,
  TreeRootNode,
  BranchNode,
  Phase3TreeView,
  RadicalChipPicker,
} from "./components";
export { useRadicals } from "./hooks";
export { radicalsService, radicalProgressService } from "./services";
export type { RadicalProgressItem } from "./services";
export {
  filterBySearch,
  filterByStrokeCount,
  filterTop20,
  sortRadicals,
  applyFilterPipeline,
} from "./utils";
export type { RadicalData, RadicalFilter, RadicalsIndex } from "./types";
