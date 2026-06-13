/**
 * StorageFactory — named instance registry for GCS-backed file storage
 *
 * Enables multi-bucket or multi-namespace storage where different modules
 * can have their own GcsFileStore instances. Each instance wraps the
 * shared GCS client but can be configured with different bucket paths.
 *
 * Usage:
 *   const defaultStore = StorageFactory.create("default");
 *   const examplesStore = StorageFactory.create("examples");
 *
 * @module shared/infrastructure/storage/StorageFactory
 */

import GcsFileStore from "./GcsFileStore.js";
import { createLogger } from "../../utils/logger.js";

const logger = createLogger("StorageFactory");

export class StorageFactory {
  /** @type {Map<string, GcsFileStore>} */
  static instances = new Map();

  /**
   * Create or retrieve a named storage instance.
   *
   * @param {string} name - Unique instance name (e.g. "default", "examples")
   * @param {Object} [options] - Optional configuration
   * @param {string} [options.bucket] - GCS bucket name; falls back to default
   * @returns {GcsFileStore} Storage service instance
   */
  static create(name, options = {}) {
    if (this.instances.has(name)) {
      return this.instances.get(name);
    }

    logger.info(
      `[${name}] Creating GcsFileStore instance${options.bucket ? ` (bucket: ${options.bucket})` : ""}`,
    );
    const instance = new GcsFileStore({ bucket: options.bucket });
    this.instances.set(name, instance);
    return instance;
  }

  /**
   * Reset cached instance(s). Useful for testing.
   * @param {string} [name] - Specific instance to reset; omit to clear all
   */
  static reset(name) {
    if (name) {
      this.instances.delete(name);
    } else {
      this.instances.clear();
    }
  }
}

export default StorageFactory;
