# Tooling Standards

**Last Updated:** June 8, 2026
**Purpose:** Monorepo-wide ESLint, Prettier, TypeScript, and Vitest configuration standards
**Audience:** Developers configuring code quality tools or adding dependencies

> **When to read this:** When setting up a new workspace, adding/changing tooling configurations (ESLint, TypeScript, Vitest), or updating shared tooling dependencies.

---

## Overview

This monorepo uses npm workspaces (`apps/*`, `packages/*`) with shared and per-workspace tooling configurations. The root `package.json` orchestrates workspace-level commands, while individual workspaces maintain their own config files that extend or override shared defaults.

```
mandarin-vite-react-ts/
├── .prettierrc                    # Shared Prettier config (root)
├── tsconfig.json                  # Root TS config (project references)
├── package.json                   # Monorepo root (workspace orchestration)
├── apps/
│   ├── frontend/                  # @mandarin/frontend (React + Vite + TypeScript)
│   │   ├── eslint.config.js       # ESLint flat config (frontend-specific)
│   │   ├── tsconfig.json          # TypeScript project references
│   │   ├── tsconfig.app.json      # App compilation config
│   │   ├── tsconfig.test.json     # Test compilation config
│   │   └── vite.config.ts         # Vite + Vitest config
│   └── backend/                   # @mandarin/backend (Express + Prisma + JavaScript)
│       ├── vitest.config.js       # Vitest config (backend-specific)
│       └── jest.config.js         # Legacy Jest config (deprecated)
└── packages/
    ├── shared-constants/          # @mandarin/shared-constants
    │   └── tsconfig.json
    └── shared-types/              # @mandarin/shared-types
        └── tsconfig.json
```

---

## ESLint

### Configuration Format

The project uses **ESLint flat config** (`eslint.config.js`), the modern configuration format introduced in ESLint v9. Flat config replaces the legacy `.eslintrc` format and is the only supported format going forward.

### Workspace Configs

Currently, ESLint is only configured for the **frontend workspace** (`apps/frontend/eslint.config.js`). The backend is JavaScript and relies on TypeScript checking and Vitest instead.

**Frontend ESLint Config (`apps/frontend/eslint.config.js`):**

```javascript
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
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
);
```

### Running ESLint

```bash
# Lint frontend only (current setup)
npm run lint

# Lint specific workspace
npm run lint --workspace=@mandarin/frontend
```

### Key Rules

| Rule                                   | Severity | Purpose                        |
| -------------------------------------- | -------- | ------------------------------ |
| `react-refresh/only-export-components` | warn     | Ensures components support HMR |
| `@typescript-eslint/no-explicit-any`   | warn     | Prevents loose typing          |
| `@typescript-eslint/no-unused-vars`    | warn     | Catches dead code              |

### Adding ESLint to a New Workspace

1. Install dependencies: `npm install --workspace=<name> eslint`
2. Create `eslint.config.js` (flat config)
3. Add `"lint": "eslint ."` script to workspace `package.json`
4. Add workspace to root lint command if desired

---

## Prettier

### Shared Config (Root `.prettierrc`)

A single `.prettierrc` at the monorepo root applies to all workspaces:

```json
{
  "semi": true,
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2
}
```

| Option        | Value   | Rationale                                          |
| ------------- | ------- | -------------------------------------------------- |
| `semi`        | `true`  | Explicit statement termination prevents ASI bugs   |
| `singleQuote` | `false` | Double quotes are standard for TypeScript/JSX      |
| `printWidth`  | `100`   | Wider lines than default (80) for reduced wrapping |
| `tabWidth`    | `2`     | Standard for TypeScript/JavaScript projects        |

### Running Prettier

```bash
# Format all files
npx prettier --write "**/*.{ts,tsx,js,json,css}"

# Check formatting (CI use)
npx prettier --check "**/*.{ts,tsx,js,json,css}"
```

### VS Code Integration

Enable format-on-save in `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

**Required Extensions:**

- ESLint: `dbaeumer.vscode-eslint`
- Prettier: `esbenp.prettier-vscode`

---

## TypeScript

### Project References Architecture

The root `tsconfig.json` uses TypeScript **project references** to orchestrate compilation across workspaces:

```json
{
  "files": [],
  "references": [
    { "path": "./apps/frontend" },
    { "path": "./packages/shared-constants" },
    { "path": "./packages/shared-types" }
  ]
}
```

> **Note:** The backend workspace is not in the project references because it is plain JavaScript (no TypeScript compilation step).

Each referenced workspace has its own `tsconfig.json` with its own references chain.

### Frontend TypeScript Config

**`apps/frontend/tsconfig.json`** — Entry point with three sub-configs:

```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": { "*": ["*"] },
    "types": ["@testing-library/jest-dom", "node"]
  },
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.test.json" }
  ]
}
```

**`apps/frontend/tsconfig.app.json`** — App compilation settings:

| Option             | Value       | Purpose                                  |
| ------------------ | ----------- | ---------------------------------------- |
| `target`           | `ES2020`    | Modern browser target                    |
| `module`           | `ESNext`    | Supports dynamic imports                 |
| `moduleResolution` | `bundler`   | Vite handles module resolution           |
| `jsx`              | `react-jsx` | JSX transform (no manual `React` import) |
| `strict`           | `true`      | Full strict mode                         |
| `include`          | `["src"]`   | Only app source                          |
| `exclude`          | test files  | Tests use separate config                |

**`apps/frontend/tsconfig.test.json`** — Test compilation (extends app config):

```json
{
  "extends": "./tsconfig.app.json",
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom", "node"]
  },
  "include": [
    "src/**/*.test.ts",
    "src/**/*.test.tsx",
    "src/**/__tests__/**/*",
    "src/setupTests.ts",
    "src/vite-env.d.ts",
    "vite.config.ts"
  ]
}
```

### Shared Packages Config

**`packages/shared-constants/tsconfig.json`** and **`packages/shared-types/tsconfig.json`**:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "moduleResolution": "bundler",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### Type Checking Commands

```bash
# Full type check (all workspaces with tsconfig)
npx tsc -b

# Frontend only
npm run type-check --workspace=@mandarin/frontend

# Specific file
npx tsc --noEmit apps/frontend/src/path/to/file.tsx
```

### Adding a New TypeScript Workspace

1. Create workspace `tsconfig.json` with `"references"` pointing to sub-configs
2. Add root config reference to root `tsconfig.json`
3. Add `"build": "tsc -b"` script to workspace `package.json`

---

## Vitest

### Configuration Overview

The monorepo uses Vitest for testing. Each workspace has its own config:

- **Frontend**: Vitest configured in `vite.config.ts` (shares Vite config)
- **Backend**: Standalone `vitest.config.js` (Node environment)
- **Legacy**: Backend also has `jest.config.js` (being phased out)

### Backend Vitest Config (`apps/backend/vitest.config.js`)

```javascript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.js", "tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.js"],
      exclude: ["node_modules/", "tests/", "src/index.js"],
    },
    setupFiles: ["./tests/setup.js"],
    testTimeout: 10000,
    globals: true,
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true, // Run integration tests serially to avoid Prisma adapter issues
      },
    },
  },
});
```

### Running Tests

```bash
# All workspaces
npm test

# Specific workspace
npm test --workspace=@mandarin/frontend
npm test --workspace=@mandarin/backend

# Watch mode
npm test --workspace=@mandarin/frontend -- --watch
npm test --workspace=@mandarin/backend -- --watch

# Coverage
npm test --workspace=@mandarin/frontend -- --coverage
npm test --workspace=@mandarin/backend -- --coverage

# Specific test file (backend)
npm test --workspace=@mandarin/backend -- tests/unit/core/AuthService.test.js
```

### Key Config Differences: Frontend vs Backend

| Setting            | Frontend                  | Backend              |
| ------------------ | ------------------------- | -------------------- |
| Environment        | `jsdom` (browser DOM)     | `node`               |
| Test files         | `src/**/*.test.{ts,tsx}`  | `tests/**/*.test.js` |
| Language           | TypeScript                | JavaScript           |
| Coverage threshold | 40%                       | Not configured       |
| Config location    | `vite.config.ts` (shared) | `vitest.config.js`   |

### Legacy Jest Config

The backend has a `jest.config.js` from an earlier setup. **All new tests should use Vitest.** The Jest config is maintained for backward compatibility only.

---

## Dependency Management

### Workspace Alignment

Keep the following dependencies aligned across workspaces:

| Dependency                   | Root     | Frontend        | Backend         | Shared Packages |
| ---------------------------- | -------- | --------------- | --------------- | --------------- |
| `typescript`                 | `^5.8.3` | `^5.8.3`        | `^5.8.3`        | —               |
| `vitest`                     | —        | `^4.0.18`       | `^4.0.17`       | —               |
| `@mandarin/shared-constants` | —        | `*` (workspace) | `*` (workspace) | —               |
| `@mandarin/shared-types`     | —        | `*` (workspace) | `*` (workspace) | —               |

### Adding a New Dependency

```bash
# Workspace-specific
npm install --workspace=@mandarin/frontend <package>

# Root (shared dev dependency)
npm install -W -D <package>

# All workspaces
npm install --workspaces <package>
```

After adding:

1. Update this document if it's a build/test tool
2. Run `npm audit` to check for vulnerabilities
3. Update relevant setup guides

---

## Pre-Commit Hooks (Optional)

For automated linting and formatting before commits:

```bash
npm install -D husky lint-staged
npx husky-init
```

**`package.json` addition:**

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.js": ["prettier --write"]
  }
}
```

---

## Common Commands Reference

```bash
# Lint
npm run lint                              # Frontend ESLint
npm run lint --workspace=@mandarin/frontend

# Format
npx prettier --write "**/*.{ts,tsx,js,json,css}"

# Type Check
npx tsc -b                                # All TypeScript workspaces
npm run type-check --workspace=@mandarin/frontend

# Test
npm test                                  # All workspaces
npm test --workspace=@mandarin/frontend   # Frontend only
npm test --workspace=@mandarin/backend    # Backend only

# Build
npm run build                             # All workspaces with build script
npm run build --workspace=@mandarin/frontend

# Security
npm audit                                 # Vulnerability check
npm audit fix                             # Auto-fix vulnerabilities
```

---

## Related Guides

- [Linting Setup Guide](setup/linting.md) — Quick-start ESLint/Prettier setup
- [Frontend Conventions](conventions/frontend.md) — Code style and patterns
- [Backend Conventions](conventions/backend.md) — Backend architecture patterns
- [Review Checklist](operations/review-checklist.md) — Pre-commit and PR checks
- [Environment Setup Guide](getting-started/environment-setup.md) — Environment variables
