/**
 * @file apps/backend/src/modules/mnemonics/index.ts
 * @description Mnemonics module barrel exports (framework-agnostic surface
 * only — the Express HTTP layer was removed at the 24-15 cutover).
 */
export { MnemonicsService } from "./services/MnemonicsService.js";
export { MnemonicsRepository } from "./repositories/MnemonicsRepository.js";
export { MnemonicNotFoundError, PICTOGRAPH_CHARS } from "./types/mnemonics.js";
