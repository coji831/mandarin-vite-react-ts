/**
 * @file modules/mnemonics/container.ts
 * @description Module-level DI container factory for the Mnemonics module.
 */
import { MnemonicsController } from "./api/MnemonicsController.js";
import { MnemonicsService } from "./services/MnemonicsService.js";
import { MnemonicsRepository } from "./repositories/MnemonicsRepository.js";
import { GeminiService } from "../../shared/services/GeminiService.js";
import { CacheService } from "../../shared/infrastructure/cache/CacheService.js";

export interface MnemonicsModuleDeps {
  geminiService: GeminiService;
  cacheService: CacheService;
}

export function createMnemonicsModule(deps: MnemonicsModuleDeps) {
  const repository = new MnemonicsRepository();
  const service = new MnemonicsService(repository, deps.geminiService, deps.cacheService);
  const controller = new MnemonicsController(service);
  return { controller };
}
