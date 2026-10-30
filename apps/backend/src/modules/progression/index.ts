/**
 * @file apps/backend/src/modules/progression/index.ts
 * @description Progression module barrel exports (framework-agnostic surface
 * only).
 *
 * Exports:
 * - ProgressionService: Progression business logic
 * - ProgressionRepository: Prisma-based data access
 *
 * NOT exported: `buildGuestGateStatus` / `GuestGateIdentity` / `GuestGateStatus`
 * (`services/gateStatus.factory.ts`). This module's own controller and tests
 * import the factory directly, and no other module consumes it — and per
 * `docs/guides/conventions/backend.md` §2 the barrel IS the cross-module public
 * contract ("Only what's exported here is accessible to other modules"), so a
 * symbol with no cross-module consumer is dead public surface. The factory's two
 * interfaces stay beside the factory rather than in `types/`: they are the shape
 * of one function's input/output, not the module's domain vocabulary.
 */

export { ProgressionService } from "./services/ProgressionService.js";
export { ProgressionRepository } from "./repositories/ProgressionRepository.js";
