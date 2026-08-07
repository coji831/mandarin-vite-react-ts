/**
 * @file apps/backend/src/modules/chengyu/index.ts
 * @description Chengyu module barrel exports (re-exports only).
 */
export { ChengyuController } from "./api/ChengyuController.js";
export { ChengyuService } from "./services/ChengyuService.js";
export { ChengyuRepository } from "./repositories/ChengyuRepository.js";
export { default as chengyuRoutes } from "./api/chengyuRoutes.js";
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
