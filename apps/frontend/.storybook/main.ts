import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";

// Resolve to an ABSOLUTE path: the Storybook dev server resolves relative
// previewAnnotations against the config dir, but the @storybook/addon-vitest
// test runner resolves them against the project root — a relative "./catalog.ts"
// would resolve to the nonexistent <root>/catalog.ts in the test runner and
// break `npm run test-storybook`. An absolute path is unambiguous in both.
const configDir = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  staticDirs: ["../public"],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-mcp",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  // Additive: catalog.ts merges its `parameters.options.storySort` with the
  // existing preview.tsx (Pages catalog grouped by archetype). preview.tsx
  // decorators/loaders are untouched.
  previewAnnotations: [path.join(configDir, "catalog.ts")],
};
export default config;
