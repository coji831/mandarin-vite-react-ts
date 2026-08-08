/**
 * @file index.ts
 * @description Barrel exports for the Chengyu feature — idiom (chengyu) library.
 * Story 23.3: Chengyu UI
 *
 * Only re-exports — no inline definitions.
 */

export { CHENGYU_THEMES, CHENGYU_ERAS, CHENGYU_PAGE_SIZE } from "./constants";

export {
  ChengyuFilterBar,
  ChengyuCard,
  ChengyuList,
  ChengyuHub,
  ChengyuPagination,
} from "./components";
export type {
  ChengyuFilterBarProps,
  ChengyuCardProps,
  ChengyuListProps,
  ChengyuHubProps,
  ChengyuPaginationProps,
} from "./components";

export { useChengyu, useChengyuDetail } from "./hooks";
export type { UseChengyuReturn, UseChengyuDetailReturn } from "./hooks";

export { chengyuService } from "./services";
export type { ChengyuServiceListParams } from "./services";

export { mapChengyuApiToData, segmentToEntityRef } from "./utils";

export type {
  ChengyuSegment,
  ChengyuSegmentEntityType,
  ChengyuExample,
  ChengyuRelatedIdiom,
  ChengyuSummary,
  ChengyuDetail,
  ChengyuListResponse,
  ChengyuListResult,
  ChengyuData,
  ChengyuFilter,
} from "./types";
