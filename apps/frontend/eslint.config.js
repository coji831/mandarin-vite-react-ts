// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "storybook-static"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: "warn",
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      // NOTE: no-restricted-imports matches ONLY the literal import-specifier
      // string — relative-path imports (`./x`, `../../shared/...`) bypass it.
      // The authoritative direction enforcement (shared never imports
      // features/modules) is `npm run check:module-boundaries`
      // (scripts/check-module-boundaries.mjs).
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            // Block deep imports inside any feature — must use feature barrel (index.ts)
            {
              group: [
                "**/features/*/components/**",
                "**/features/*/hooks/**",
                "**/features/*/services/**",
                "**/features/*/types/**",
                "**/features/*/utils/**",
                "**/features/*/context/**",
                "**/features/*/reducers/**",
                "**/features/*/engine/**",
                "**/features/*/constants/**",
                "**/features/*/audio/**",
              ],
              message: "Import from the feature's barrel (index.ts) instead of internal paths.",
            },
            // Prevent cross-feature store imports — use barrel exports
            {
              group: ["**/features/*/stores/**"],
              message:
                "Cross-feature store imports are forbidden. Import from the feature's barrel (index.ts) instead.",
            },
            // Block deep imports into shared subdirectories that have barrels
            {
              group: [
                "**/shared/api/**",
                "**/shared/config/**",
                "**/shared/constants/**",
                "**/shared/hooks/**",
                "**/shared/store/**",
                "**/shared/components/**",
                "**/shared/context/**", // defensive — no shared/context dir yet
              ],
              message: "Import from the shared/ barrel (index.ts) instead of internal paths.",
            },
            // `shared/audio` and `shared/services` use a REGEX group instead of a glob:
            // gitignore-style globs (`**/shared/audio/**`) cannot express "everything under
            // X EXCEPT __tests__". Test-helper fixtures live under `__tests__/` and are NOT
            // barrel-exported, so cross-tree tests import them directly — allowed. The
            // negative lookahead keeps deep PUBLIC imports blocked (incl. relative paths
            // containing the literal `shared/audio` / `shared/services` segment).
            {
              regex: "shared/audio/(?!__tests__)",
              message: "Import from the shared/audio barrel (index.ts) instead of internal paths.",
            },
            {
              regex: "shared/services/(?!__tests__)",
              message:
                "Import from the shared/services barrel (index.ts) instead of internal paths.",
            },
          ],
        },
      ],
    },
  },
  storybook.configs["flat/recommended"],
);
