/**
 * Radicals feature — Chinese radical browser
 * Story 19.1: Radicals Browser Structure
 *
 * Provides a filterable grid of Kangxi radicals with search, stroke count filtering,
 * top-20 toggle, and sort controls. Content is loaded from static JSON files.
 */

export {
  RadicalCard,
  RadicalGrid,
  FilterBar,
  RadicalDetailCard,
  ExampleCharGrid,
  ExampleCharCell,
} from "./components";
export { useRadicals } from "./hooks";
export { radicalsService } from "./services";
export {
  filterBySearch,
  filterByStrokeCount,
  filterTop20,
  sortRadicals,
  applyFilterPipeline,
} from "./utils";
export type { RadicalData, RadicalFilter, RadicalsIndex } from "./types";
