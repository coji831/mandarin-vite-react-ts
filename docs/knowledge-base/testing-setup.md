# Testing Setup (Jest + React Testing Library)

**Category:** Getting Started  
**Last Updated:** December 9, 2025

---

## Overview

This project uses:

- **Jest** - Test runner
- **ts-jest** - TypeScript transformer
- **React Testing Library** - Component testing
- **jsdom** - Browser environment simulation

---

## Quick Start

```bash
# Run all tests
npm test

# Run specific test file
npm test -- VocabularyCard.test.tsx

# Run with coverage
npm test -- --coverage

# Watch mode (auto-rerun on changes)
npm test -- --watch
```

---

## Configuration

### jest.config.js

```javascript
export default {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          esModuleInterop: true,
        },
      },
    ],
  },
  moduleNameMapper: {
    "^utils(.*)$": "<rootDir>/src/utils$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  testMatch: ["**/?(*.)+(test).[tj]s?(x)"],
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts"],
};
```

**Key Settings:**

- `testEnvironment: "jsdom"` - Simulates browser DOM
- `moduleNameMapper` - Handles path aliases & CSS imports
- `setupFilesAfterEnv` - Runs before each test

---

## Setup File

### src/setupTests.ts

```typescript
import "@testing-library/jest-dom";

// Polyfill TextEncoder for jsdom
const { TextEncoder, TextDecoder } = require("util");
if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = TextDecoder;
}

// Mock fetch for Node/Jest environment
if (typeof (global as any).fetch === "undefined") {
  (global as any).fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({}) }));
}
```

**Why?**

- jsdom doesn't include TextEncoder/TextDecoder
- fetch API not available in Node.js
- Prevents noisy console errors in tests

---

## Writing Tests

### Component Test Example

```tsx
// VocabularyCard.test.tsx
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { VocabularyCard } from "../VocabularyCard";

describe("VocabularyCard", () => {
  it("shows 'Not started' when progress is 0", () => {
    render(
      <VocabularyCard
        list={{ id: "1", name: "HSK 1", wordCount: 10 }}
        onSelect={() => {}}
        progress={0}
        masteredCount={0}
      />
    );

    expect(screen.getByText(/Not started/i)).toBeInTheDocument();
  });

  it("displays progress percentage", () => {
    render(
      <VocabularyCard
        list={{ id: "1", name: "HSK 1", wordCount: 10 }}
        onSelect={() => {}}
        progress={50}
        masteredCount={5}
      />
    );

    expect(screen.getByText(/5 \/ 10 mastered \(50%\)/i)).toBeInTheDocument();
  });
});
```

### Service Test Example

```typescript
// audioService.test.ts
import { AudioService } from "../audioService";

describe("AudioService", () => {
  let service: AudioService;

  beforeEach(() => {
    service = new AudioService();
  });

  it("fetches word audio from API", async () => {
    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ audioUrl: "audio.mp3" }),
      })
    ) as jest.Mock;

    const result = await service.getWordAudio("w1", "你好");

    expect(result.audioUrl).toBe("audio.mp3");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/tts-audio"),
      expect.any(Object)
    );
  });

  it("handles API errors gracefully", async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error("Network error"))) as jest.Mock;

    await expect(service.getWordAudio("w1", "你好")).rejects.toThrow("Network error");
  });
});
```

---

## Testing Best Practices

### Query Priority (React Testing Library)

```tsx
// 1. Role queries (preferred)
screen.getByRole("button", { name: /submit/i });

// 2. Label queries
screen.getByLabelText(/email/i);

// 3. Placeholder text
screen.getByPlaceholderText(/enter email/i);

// 4. Text content
screen.getByText(/hello world/i);

// ❌ Avoid: test IDs, classes
screen.getByTestId("submit-button"); // Only as last resort
```

### Async Testing

```tsx
import { render, screen, waitFor } from "@testing-library/react";

it("loads data asynchronously", async () => {
  render(<MyComponent />);

  // Wait for element to appear
  const element = await screen.findByText(/loaded/i);
  expect(element).toBeInTheDocument();

  // Or use waitFor
  await waitFor(() => {
    expect(screen.getByText(/loaded/i)).toBeInTheDocument();
  });
});
```

### Mocking Context

```tsx
import { ProgressContext } from "../context/ProgressContext";

it("uses progress from context", () => {
  const mockContext = {
    progress: { w1: { masteryLevel: 0.8 } },
    markWordLearned: jest.fn(),
  };

  render(
    <ProgressContext.Provider value={mockContext}>
      <MyComponent />
    </ProgressContext.Provider>
  );

  expect(screen.getByText(/80%/i)).toBeInTheDocument();
});
```

---

## Coverage Reports

```bash
# Generate coverage report
npm test -- --coverage

# View HTML report
open coverage/lcov-report/index.html
```

**Coverage Config (jest.config.js):**

```javascript
collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts", "!src/main.tsx", "!src/vite-env.d.ts"];
```

---

## Common Issues

### "TextEncoder is not defined"

**Solution:** Add polyfill in `setupTests.ts` (see above)

### "Cannot find module 'utils/...'"

**Solution:** Check `moduleNameMapper` in `jest.config.js` matches tsconfig aliases

### Test timeout

```typescript
// Increase timeout for slow tests
it("loads large dataset", async () => {
  // ...
}, 10000); // 10 seconds
```

---

## File Organization

```
src/
├── setupTests.ts               # Test setup & polyfills
├── features/
│   └── mandarin/
│       ├── components/
│       │   ├── VocabularyCard.tsx
│       │   └── __tests__/
│       │       └── VocabularyCard.test.tsx
│       └── services/
│           ├── audioService.ts
│           └── __tests__/
│               └── audioService.test.ts
```

**Convention:** Tests live in `__tests__/` folder next to source files

---

## Key Takeaways

- Use React Testing Library (not Enzyme)
- Query by role/text, not by class/id
- Mock external dependencies (fetch, localStorage)
- Test user behavior, not implementation details
- Keep tests fast (<1s per test)

---

## Next Steps

- [Vite Setup](./vite-setup.md) - Build configuration
- [Linting](./linting-setup.md) - Code quality tools
- [Git Workflow](./git-workflow.md) - Commit conventions

---

**Related Guides:**

- [Advanced React Patterns](./frontend-advanced-patterns.md) - Test reducers
- [Backend Patterns](./backend-advanced-patterns.md) - API testing
