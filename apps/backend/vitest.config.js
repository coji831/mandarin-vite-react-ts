/**
 * @file apps/backend/vitest.config.js
 * Vitest configuration for backend test suite
 *
 * Replaces Jest with Vitest for better ESM support and monorepo compatibility.
 * Maintains test structure: unit tests, integration tests, and service tests.
 */

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Test environment
    environment: "node",

    // Test file patterns
    include: ["tests/**/*.test.js"],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.js"],
      exclude: ["node_modules/", "tests/", "src/index.js"],
    },

    // Setup files
    setupFiles: ["./tests/setup.js"],

    // Test timeout
    testTimeout: 10000,

    // Globals (optional - enables Jest-compatible global APIs)
    globals: true,

    // Pool options for test isolation
    // Use threads for unit tests, single fork for integration tests with DB
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true, // Run integration tests serially to avoid Prisma adapter issues
      },
    },
  },
});
