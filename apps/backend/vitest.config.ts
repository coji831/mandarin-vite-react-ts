/**
 * @file apps/backend/vitest.config.ts
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
    // Integration tests live in tests/integration/ and are excluded by default.
    // Run with: vitest --config vitest.integration.config.ts
    include: [
      "tests/**/*.test.ts",
      "!tests/integration/**",
      "src/modules/**/__tests__/**/*.test.ts",
      "src/shared/infrastructure/**/__tests__/**/*.test.ts",
      "src/shared/**/__tests__/**/*.test.ts",
    ],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{js,ts}"],
      exclude: ["node_modules/", "tests/", "src/app/index.ts"],
    },

    // Setup files
    setupFiles: ["./tests/setup.ts"],

    // Test timeout
    testTimeout: 10000,

    // Globals (optional - enables Jest-compatible global APIs)
    globals: true,

    // Pool: forks for isolation
    pool: "forks",
  },
});
