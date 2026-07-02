/**
 * @file apps/backend/eslint.config.js
 * ESLint flat config for backend TypeScript source
 *
 * Uses typescript-eslint with Node.js globals.
 * Rules are tuned for a Node.js Express backend — no browser/React rules.
 */

import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "coverage"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["src/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
    rules: {
      // ─── Code Quality (errors) ───────────────────────────────────────
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "prefer-const": "error",
      "no-var": "error",

      // ─── Best Practices (warn) ──────────────────────────────────────
      "no-console": "warn",

      // ─── Architecture Boundaries — use per-layer configs below ─────
    },
  },

  // ─── Overrides: files that use console intentionally ───────────────
  {
    files: ["src/shared/utils/logger.ts"],
    rules: {
      "no-console": "off",
    },
  },

  // ─── Overrides: test files are less strict ─────────────────────────
  {
    files: ["src/**/__tests__/**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },

  // ─── Architecture: controllers must not import Prisma directly ───────
  {
    files: ["src/modules/*/api/*.ts", "src/shared/api/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@prisma/client"],
              message:
                "Controllers must not import Prisma directly. Use services from container.ts.",
            },
          ],
        },
      ],
    },
  },

  // ─── Architecture: services must not import controllers ────────────
  {
    files: ["src/modules/*/services/*.ts", "src/modules/*/use-cases/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/api/*"],
              message:
                "Services must not import controllers. Inject dependencies via constructor instead.",
            },
          ],
        },
      ],
    },
  },

  // ─── Architecture: infrastructure must not import from modules ────
  {
    files: ["src/shared/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/modules/**"],
              message:
                "Shared/infrastructure must not import from modules to prevent circular dependencies.",
            },
          ],
        },
      ],
    },
  },

  // ─── Exception: type augmentation needs cross-module imports ──────
  {
    files: ["src/shared/types/**/*.ts"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
);
