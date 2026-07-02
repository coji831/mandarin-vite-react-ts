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
  static instances: Map<string, GcsFileStore> = new Map();

  /**
   * Create or retrieve a named storage instance.
   *
   * @param name - Unique instance name (e.g. "default", "examples")
   * @param options - Optional configuration
   * @param options.bucket - GCS bucket name; falls back to default
   * @returns Storage service instance
   */
  static create(name: string, options: { bucket?: string } = {}): GcsFileStore {
    if (this.instances.has(name)) {
      return this.instances.get(name)!;
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
   * @param name - Specific instance to reset; omit to clear all
   */
  static reset(name?: string): void {
    if (name) {
      this.instances.delete(name);
    } else {
      this.instances.clear();
    }
  }
}

export default StorageFactory;
