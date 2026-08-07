/**
 * @file apps/backend/src/modules/chengyu/container.ts
 * @description Module-level DI container factory for the Chengyu module.
 */
import { ChengyuController } from "./api/ChengyuController.js";
import { ChengyuService } from "./services/ChengyuService.js";
import { ChengyuRepository } from "./repositories/ChengyuRepository.js";

export function createChengyuModule() {
  const repository = new ChengyuRepository();
  const service = new ChengyuService(repository);
  const controller = new ChengyuController(service);
  return { controller };
}
