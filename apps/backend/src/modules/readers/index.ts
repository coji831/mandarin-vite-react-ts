/**
 * @file apps/backend/src/modules/readers/index.ts
 * @description Readers module barrel exports.
 */
export { ReadersController } from "./api/ReadersController.js";
export { ReadersService } from "./services/ReadersService.js";
export { ReadersRepository } from "./repositories/ReadersRepository.js";
export { SegmenterService } from "./services/SegmenterService.js";
export { ReadersAudioService } from "./services/ReadersAudioService.js";
export { createReadersRoutes as readersRoutes } from "./api/readersRoutes.js";
export { createReadersModule } from "./container.js";
