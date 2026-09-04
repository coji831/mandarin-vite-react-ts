/**
 * @file apps/backend/src/modules/chengyu/index.ts
 * @description Chengyu module barrel exports (framework-agnostic surface
 * only).
 */
export { ChengyuService } from "./services/ChengyuService.js";
export { ChengyuRepository } from "./repositories/ChengyuRepository.js";
export { ChengyuNotFoundError, ChengyuValidationError } from "./types/chengyu.js";
export type {
  ChengyuSummary,
  ChengyuListQuery,
  ChengyuListParams,
  ChengyuListResponse,
  ChengyuSegment,
  ChengyuExample,
  ChengyuRelatedIdiom,
  ChengyuDetail,
} from "./types/chengyu.js";
