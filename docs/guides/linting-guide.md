# Linting Guide

Quick setup for ESLint, Prettier, and TypeScript checking.

## Quick Commands

```bash
# Check linting errors
npm run lint

# Auto-fix linting errors
npm run lint -- --fix

# Format code
npx prettier --write "src/**/*.{ts,tsx,json,css}"

# Type check
npx tsc --noEmit
```

## ESLint Setup

**eslint.config.js:**

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
  }
);
```

## Prettier Setup

**.prettierrc:**

```json
{
  "semi": true,
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2
}
```

## VS Code Integration

**.vscode/settings.json:**

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

## Common Fixes

**Missing dependency in useEffect:**

```tsx
// Add all used variables to dependency array
useEffect(() => {
  console.log(count);
}, [count]); // Include count
```

**Unused variable:**

```typescript
// Remove or prefix with underscore
const _unusedVar = getData(); // ESLint ignores _prefixed
```

**Disable rule (when necessary):**

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = fetchData();
```

## Troubleshooting

**ESLint not working in VS Code:**

1. Restart ESLint server: `Cmd+Shift+P` > "ESLint: Restart ESLint Server"
2. Check extension installed
3. Restart VS Code

**Type errors:**

```bash
# Check all files
npx tsc --noEmit

# Check specific file
npx tsc --noEmit src/path/to/file.tsx
```

## Pre-Commit Hooks (Optional)

```bash
npm install -D husky lint-staged
npx husky-init
```

**package.json:**

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
```

## Reference

- [ESLint Rules](https://eslint.org/docs/latest/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)
- [TypeScript Config](https://www.typescriptlang.org/tsconfig)

---

**Last Updated:** January 9, 2026
