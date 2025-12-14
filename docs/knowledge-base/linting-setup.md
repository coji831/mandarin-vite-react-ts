# Linting & Code Quality

**Category:** Getting Started  
**Last Updated:** December 9, 2025

---

## Overview

This project uses:

- **ESLint** - Catch bugs and enforce code standards
- **Prettier** - Automatic code formatting
- **TypeScript** - Type checking

---

## Quick Commands

```bash
# Check linting errors
npm run lint

# Auto-fix linting errors
npm run lint -- --fix

# Format code with Prettier
npx prettier --write "src/**/*.{ts,tsx,js,jsx,json,css}"

# Type check (no build)
npx tsc --noEmit
```

---

## ESLint Configuration

### eslint.config.js (Flat Config)

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

**Key Plugins:**

- `typescript-eslint` - TypeScript rules
- `react-hooks` - Enforce Hooks rules (dependencies, order)
- `react-refresh` - Ensure Fast Refresh compatibility

**Key Rules:**

- `no-explicit-any: "warn"` - Warn on `any` type usage
- `no-unused-vars: "warn"` - Warn on unused variables
- React Hooks rules enforced (dependency arrays, order)

---

## Prettier Configuration

### .prettierrc

```json
{
  "semi": true,
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2
}
```

**Settings:**

- **Semicolons:** Required
- **Quotes:** Double quotes
- **Line width:** 100 characters
- **Indentation:** 2 spaces

---

## VS Code Integration

### .vscode/settings.json

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

**Install Extensions:**

- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)

---

## Common ESLint Rules Explained

### React Hooks Rules

```tsx
// ❌ Bad: Missing dependency
useEffect(() => {
  console.log(count);
}, []); // ESLint error: count should be in deps

// ✅ Good: Include all dependencies
useEffect(() => {
  console.log(count);
}, [count]);
```

### No Explicit Any

```typescript
// ❌ Bad: Using any
function processData(data: any) {
  return data.value;
}

// ✅ Good: Use specific types
interface Data {
  value: string;
}

function processData(data: Data) {
  return data.value;
}
```

### Unused Variables

```typescript
// ❌ Bad: Unused import
import { useState, useEffect } from "react";

function MyComponent() {
  const [count, setCount] = useState(0);
  // useEffect never used
  return <div>{count}</div>;
}

// ✅ Good: Remove unused import
import { useState } from "react";

function MyComponent() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}
```

---

## Disabling Rules (When Necessary)

### Inline Disable

```typescript
// Disable for one line
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = fetchData();

// Disable for entire file
/* eslint-disable @typescript-eslint/no-explicit-any */
```

### Config-Level Disable

```javascript
// eslint.config.js
rules: {
  "@typescript-eslint/no-explicit-any": "off", // Disable globally
}
```

**⚠️ Use sparingly!** Only disable when you have a good reason.

---

## Pre-Commit Hooks (Optional)

### Using Husky + lint-staged

```bash
# Install
npm install -D husky lint-staged

# Setup
npx husky-init
```

### package.json

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,css,md}": ["prettier --write"]
  }
}
```

### .husky/pre-commit

```bash
#!/bin/sh
npx lint-staged
```

**Result:** Code is auto-formatted and linted before every commit.

---

## Type Checking

### Run Type Check

```bash
# Check all files
npx tsc --noEmit

# Check specific file
npx tsc --noEmit src/features/mandarin/pages/FlashCardPage.tsx
```

### Common TypeScript Errors

**Error: Type 'undefined' is not assignable**

```typescript
// ❌ Problem
const value: string = data.value; // data.value might be undefined

// ✅ Solution: Optional chaining + nullish coalescing
const value: string = data.value ?? "default";
```

**Error: Property does not exist on type**

```typescript
// ❌ Problem
interface User {
  name: string;
}
const user: User = { name: "Alice", age: 30 }; // age not in interface

// ✅ Solution: Add property to interface
interface User {
  name: string;
  age: number;
}
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm test
```

---

## Best Practices

1. **Fix lint errors before committing**

   - Run `npm run lint` before every commit
   - Use `npm run lint -- --fix` to auto-fix

2. **Use TypeScript strict mode**

   - Catches more bugs at compile time
   - Set `strict: true` in tsconfig.json

3. **Format code consistently**

   - Use Prettier for automatic formatting
   - Configure editor to format on save

4. **Review ESLint warnings**

   - Warnings indicate potential bugs
   - Address them before they become problems

5. **Don't disable rules casually**
   - Only disable when you have a good reason
   - Document why with a comment

---

## Troubleshooting

### ESLint not working in VS Code

1. Restart ESLint server: `Cmd+Shift+P` > "ESLint: Restart ESLint Server"
2. Check extension is installed: `dbaeumer.vscode-eslint`
3. Check workspace settings (`.vscode/settings.json`)

### Prettier formatting conflicts with ESLint

**Solution:** Prettier should run after ESLint. Use `eslint-config-prettier` to disable conflicting rules.

```bash
npm install -D eslint-config-prettier
```

---

## Next Steps

- [Testing Setup](./testing-setup.md) - Jest configuration
- [Git Workflow](./git-workflow.md) - Commit conventions
- [Code Conventions](../guides/code-conventions.md) - Style guide

---

**Related Guides:**

- [Vite Setup](./vite-setup.md) - Build configuration
- [SOLID Principles](../guides/solid-principles.md) - Design patterns
