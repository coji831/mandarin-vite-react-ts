import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";

// Resolve to an ABSOLUTE path: the Storybook dev server resolves relative
// previewAnnotations against the config dir, but the @storybook/addon-vitest
// test runner resolves them against the project root — a relative "./catalog.ts"
// would resolve to the nonexistent <root>/catalog.ts in the test runner and
// break `npm run test-storybook`. An absolute path is unambiguous in both.
const configDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.dirname(configDir);

// Guard (2026-09-10): @storybook/builder-vite generates the iframe import map
// with `path.relative(process.cwd(), importPath)` (see
// @storybook/builder-vite `codegen-importfn-script.ts`). When Storybook is
// started from any directory other than this workspace root — e.g. a parent
// folder, or `npm --prefix <pkg> run storybook`, which keeps the shell's cwd —
// the generated keys no longer match the story index's `./src/...` importPaths
// and EVERY story dies with the cryptic
// `TypeError: importers[path] is not a function`. Fail fast with an actionable
// message instead. `npm run storybook --workspace=@mandarin/frontend` (CI style)
// and `npm run storybook` from this folder both satisfy the requirement.
// Exempted for Vitest: `@storybook/addon-vitest` resolves stories through its
// own pipeline (and vitest may run with the repo root as cwd).
const isVitestRun = process.env.VITEST === "true";
if (!isVitestRun && path.resolve(process.cwd()) !== path.resolve(projectRoot)) {
  throw new Error(
    [
      "Storybook must run with the frontend workspace as its working directory.",
      `  expected cwd: ${projectRoot}`,
      `  actual cwd:   ${process.cwd()}`,
      "Use `npm run storybook --workspace=@mandarin/frontend` from the repo root,",
      `or run \`npm run storybook\` from ${projectRoot}.`,
    ].join("\n"),
  );
}

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
