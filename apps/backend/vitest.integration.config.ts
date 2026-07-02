/**
 * @file apps/backend/vitest.integration.config.ts
 * Vitest configuration for integration tests only
 *
 * Runs only integration tests that live in tests/integration/.
 * These tests require a real database connection and are excluded
 * from the default `vitest run` via the !tests/integration/** pattern.
 *
 * Uses the same environment, setup, and coverage settings as the base config
 * but overrides the include patterns via spread to avoid array merging.
 */

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Test environment
    environment: "node",

    // Integration test files only
    include: ["tests/integration/**/*.test.ts"],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{js,ts}"],
      exclude: ["node_modules/", "tests/", "src/index.ts"],
    },

    // Setup files
    setupFiles: ["./tests/setup.ts"],

    // Test timeout (longer for integration tests with DB)
    testTimeout: 30000,

    // Globals
    globals: true,

    // Pool: forks with serial execution (single worker) to avoid Prisma adapter issues
    pool: "forks",
    fileParallelism: false,
  },
});
