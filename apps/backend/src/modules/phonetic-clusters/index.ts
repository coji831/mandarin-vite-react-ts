/**
 * @file apps/backend/src/modules/phonetic-clusters/index.ts
 * @description Phonetic Clusters module barrel exports.
 */
export { PhoneticClustersController } from "./api/PhoneticClustersController.js";
export { PhoneticClustersService } from "./services/PhoneticClustersService.js";
export { default as phoneticClustersRoutes } from "./api/phoneticClustersRoutes.js";
