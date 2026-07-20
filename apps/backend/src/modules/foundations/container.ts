/**
 * @file modules/foundations/container.ts
 * @description Module-level DI container factory for the Foundations module.
 * Maps to: @Module({ controllers: [FoundationsController], providers: [FoundationsService] })
 */
import { FoundationsController } from "./api/FoundationsController.js";
import { FoundationsService } from "./services/FoundationsService.js";

export function createFoundationsModule() {
  const service = new FoundationsService();
  const controller = new FoundationsController(service);
  return { controller };
}
