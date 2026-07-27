/**
 * @file modules/readers/container.ts
 * @description Module-level DI container factory for the Readers module.
 */
import { ReadersController } from "./api/ReadersController.js";
import { ReadersService } from "./services/ReadersService.js";
import { ReadersRepository } from "./repositories/ReadersRepository.js";
import { SegmenterService } from "./services/SegmenterService.js";
import { PassageGenerationService } from "./services/PassageGenerationService.js";
import type { CacheService } from "../../shared/infrastructure/cache/CacheService.js";

export interface ReadersModuleDeps {
  passageGenerationService: PassageGenerationService;
  segmenterService: SegmenterService;
  cacheService: CacheService;
}

export function createReadersModule(deps: ReadersModuleDeps) {
  const repository = new ReadersRepository();
  const service = new ReadersService(
    repository,
    deps.passageGenerationService,
    deps.segmenterService,
    deps.cacheService,
  );
  const controller = new ReadersController(service);
  return { controller, repository, service };
}
