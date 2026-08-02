/**
 * @file apps/backend/src/modules/phonetic-clusters/container.ts
 * @description Module-level DI container factory for the Phonetic Clusters module.
 */
import { PhoneticClustersController } from "./api/PhoneticClustersController.js";
import { PhoneticClustersService } from "./services/PhoneticClustersService.js";
import { PhoneticClustersRepository } from "./repositories/PhoneticClustersRepository.js";

export function createPhoneticClustersModule() {
  const repository = new PhoneticClustersRepository();
  const service = new PhoneticClustersService(repository);
  const controller = new PhoneticClustersController(service);
  return { controller };
}
