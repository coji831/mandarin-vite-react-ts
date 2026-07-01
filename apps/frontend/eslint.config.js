import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
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
                "**/features/*/stores/**",
              ],
              message: "Import from the feature's barrel (index.ts) instead of internal paths.",
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
              ],
              message: "Import from the shared/ barrel (index.ts) instead of internal paths.",
            },
          ],
        },
      ],
    },
  },
);
