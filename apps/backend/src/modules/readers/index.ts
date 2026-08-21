/**
 * @file apps/backend/src/modules/readers/index.ts
 * @description Readers module barrel exports (framework-agnostic surface only
 * — the Express HTTP layer was removed at the 24-15 cutover).
 */
export { ReadersService } from "./services/ReadersService.js";
export { ReadersRepository } from "./repositories/ReadersRepository.js";
export { SegmenterService } from "./services/SegmenterService.js";
export { ReadersAudioService } from "./services/ReadersAudioService.js";
