/**
 * @file apps/backend/src/modules/progression/index.ts
 * @description Progression module barrel exports (framework-agnostic surface
 * only).
 *
 * Exports:
 * - ProgressionService: Progression business logic
 * - ProgressionRepository: Prisma-based data access
 * - buildGuestGateStatus (+ GuestGateIdentity/GuestGateStatus): the ONE guest
 *   `/gates` derivation shared with `/phase-gate` (Story 25-2)
 */

export { ProgressionService } from "./services/ProgressionService.js";
export { ProgressionRepository } from "./repositories/ProgressionRepository.js";
export { buildGuestGateStatus } from "./services/gateStatus.factory.js";
export type { GuestGateIdentity, GuestGateStatus } from "./services/gateStatus.factory.js";
