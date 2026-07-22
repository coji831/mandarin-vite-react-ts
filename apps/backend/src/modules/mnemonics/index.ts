/**
 * @file apps/backend/src/modules/mnemonics/index.ts
 * @description Mnemonics module barrel exports.
 */
export { MnemonicsController } from "./api/MnemonicsController.js";
export { MnemonicsService } from "./services/MnemonicsService.js";
export { MnemonicsRepository } from "./repositories/MnemonicsRepository.js";
export { default as mnemonicsRoutes } from "./api/mnemonicsRoutes.js";
export { MnemonicNotFoundError, PICTOGRAPH_CHARS } from "./types/mnemonics.js";
