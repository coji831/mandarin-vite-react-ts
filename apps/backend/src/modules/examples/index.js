/**
 * @file apps/backend/src/modules/examples/index.js
 * @description Examples module — public API
 *
 * Exports only what other modules are allowed to consume.
 * Internals (controllers, routes, CachedExampleService, validators) are not exported.
 */

export { ExampleService } from "./services/ExampleService.js";
