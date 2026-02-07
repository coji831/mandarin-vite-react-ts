# TypeScript Error Handling Best Practices

**Last Updated:** February 7, 2026  
**Audience:** TypeScript developers, error handling patterns  
**Difficulty:** Intermediate

---

## Overview

TypeScript's `error: unknown` pattern (introduced in TS 4.4) enables type-safe error handling. Understanding type narrowing, AxiosError guards, and user-friendly messaging is essential for robust production code.

**One-Sentence Summary:** Always declare `error: unknown`, narrow to specific error types with guards, and separate technical logging from user-facing messages.

---

## The Problem with `error: any`

### Legacy Pattern (TypeScript <4.4)

```typescript
try {
  await riskyOperation();
} catch (error: any) {
  console.log(error.message); // ❌ No type safety
  console.log(error.statusCode); // ❌ Typo goes undetected
  throw error; // ❌ Re-throws technical details to UI
}
```

**Issues:**

1. **No autocomplete:** IDE cannot suggest `.message`, `.stack`, etc.
2. **Runtime errors:** Typos like `.statusCode` (should be `.status`) compile but crash
3. **Unsafe access:** Assumes every error has `.message` property
4. **User exposure:** Technical stack traces leak to frontend

### Modern Pattern (TypeScript 4.4+)

```typescript
try {
  await riskyOperation();
} catch (error: unknown) {
  // ❌ Error: Property 'message' does not exist on type 'unknown'
  console.log(error.message);

  // ✅ Must narrow type first
  if (error instanceof Error) {
    console.log(error.message); // Type-safe access
  }
}
```

**Benefits:**

1. **Compile-time safety:** Must prove error type before accessing properties
2. **Explicit narrowing:** Developer consciously handles each error type
3. **Catches typos:** Accessing non-existent properties fails at compile time

---

## Type Narrowing Patterns

### 1. `instanceof Error` (Standard Errors)

```typescript
try {
  throw new Error("Something failed");
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error("Standard error:", error.message);
    console.error("Stack trace:", error.stack);
  } else {
    console.error("Non-error thrown:", error);
  }
}
```

**Use when:** Handling native JavaScript errors (`Error`, `TypeError`, `RangeError`, etc.)

### 2. `instanceof AxiosError` (HTTP Errors)

```typescript
import { AxiosError } from "axios";

try {
  const response = await apiClient.get("/api/data");
  return response.data;
} catch (error: unknown) {
  if (error instanceof AxiosError) {
    // Type-safe access to Axios-specific properties
    const status = error.response?.status;
    const data = error.response?.data;
    const config = error.config;

    if (status === 404) {
      return null; // Valid case - resource not found
    }

    if (status === 401) {
      console.error("Unauthorized:", data?.message);
      // Trigger re-auth flow
    }

    console.error("API error:", { status, endpoint: config?.url, data });
  } else if (error instanceof Error) {
    console.error("Non-HTTP error:", error.message);
  } else {
    console.error("Unknown error:", error);
  }

  throw new Error("Failed to load data. Please try again.");
}
```

**Use when:** Handling Axios HTTP requests with status-specific logic

### 3. Type Predicate Guards (Custom Errors)

```typescript
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    typeof (error as ApiError).code === "string" &&
    typeof (error as ApiError).message === "string"
  );
}

try {
  await customApiCall();
} catch (error: unknown) {
  if (isApiError(error)) {
    console.error(`API Error [${error.code}]:`, error.message);
    if (error.details) {
      console.error("Details:", error.details);
    }
  } else {
    console.error("Unexpected error:", error);
  }
}
```

**Use when:** Handling custom error formats from backend APIs

### 4. Property Existence Checks

```typescript
try {
  await operation();
} catch (error: unknown) {
  // Check for specific properties
  if (typeof error === "object" && error !== null && "message" in error) {
    const err = error as { message: string };
    console.error("Error with message:", err.message);
  }
}
```

**Use when:** Handling third-party libraries with unknown error shapes

---

## Axios-Specific Patterns

### Distinguishing Error Types

```typescript
import { AxiosError } from "axios";

try {
  const response = await apiClient.get("/api/users");
  return response.data;
} catch (error: unknown) {
  if (!(error instanceof AxiosError)) {
    // Non-HTTP error (e.g., code bug, invalid config)
    console.error("Non-Axios error:", error);
    throw new Error("Unexpected error occurred");
  }

  // Network error (no response received)
  if (!error.response) {
    console.error("Network error:", error.message);
    throw new Error("Network connection failed. Check your internet.");
  }

  // HTTP error (response received with error status)
  const { status, data } = error.response;

  switch (status) {
    case 400:
      console.error("Bad request:", data);
      throw new Error("Invalid request. Please check your input.");

    case 401:
      console.error("Unauthorized");
      // Trigger logout or token refresh
      throw new Error("Session expired. Please log in again.");

    case 403:
      console.error("Forbidden");
      throw new Error("You don't have permission to access this resource.");

    case 404:
      console.log("Resource not found (valid case)");
      return null; // Valid - resource doesn't exist

    case 500:
      console.error("Server error:", data);
      throw new Error("Server error. Please try again later.");

    default:
      console.error("Unexpected status:", status, data);
      throw new Error("Request failed. Please try again.");
  }
}
```

### Extracting Error Messages

```typescript
function getErrorMessage(error: unknown): string {
  // Axios error with response
  if (error instanceof AxiosError && error.response) {
    return error.response.data?.message || error.message || "Request failed";
  }

  // Axios network error
  if (error instanceof AxiosError) {
    return "Network error. Check your internet connection.";
  }

  // Standard error
  if (error instanceof Error) {
    return error.message;
  }

  // Unknown error
  return "An unexpected error occurred";
}

// Usage
try {
  await apiClient.post("/api/users", userData);
} catch (error: unknown) {
  console.error("Technical details:", error);
  alert(getErrorMessage(error)); // User-friendly message
}
```

### Logging Technical Details Separately

```typescript
function handleApiError(error: unknown, context: string): never {
  // Log technical details for developers
  console.error(`[${context}] Error:`, {
    error,
    type: error?.constructor?.name,
    message: error instanceof Error ? error.message : "Unknown",
    stack: error instanceof Error ? error.stack : undefined,
    response: error instanceof AxiosError ? error.response?.data : undefined,
    status: error instanceof AxiosError ? error.response?.status : undefined,
  });

  // Throw user-friendly message
  if (error instanceof AxiosError && error.response?.status === 404) {
    throw new Error("Resource not found");
  }

  throw new Error("Operation failed. Please try again later.");
}

// Usage
try {
  const user = await apiClient.get("/api/users/123");
  return user.data;
} catch (error: unknown) {
  handleApiError(error, "fetchUser");
}
```

---

## User-Facing Error Messages

### Separation of Concerns

```typescript
try {
  await apiClient.post("/api/transfer", { amount: 100, to: "user123" });
} catch (error: unknown) {
  // ✅ Technical logging (developers)
  console.error("Transfer failed:", {
    endpoint: "/api/transfer",
    error: error instanceof AxiosError ? error.response?.data : error,
    timestamp: new Date().toISOString(),
  });

  // ✅ User-friendly message (end users)
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 400 && data?.code === "INSUFFICIENT_FUNDS") {
      showNotification("Insufficient balance. Please add funds.");
      return;
    }

    if (status === 403) {
      showNotification("Transfer limit exceeded. Try a smaller amount.");
      return;
    }
  }

  // Fallback generic message
  showNotification("Transfer failed. Please try again.");
}
```

**Principles:**

1. **Technical details → console:** Status codes, stack traces, endpoint URLs
2. **User-friendly messages → UI:** Clear actionable guidance
3. **Never leak internals:** No "Database connection failed" or stack traces to users
4. **Provide context:** "Transfer failed" better than generic "Error occurred"

### Message Hierarchy

```typescript
function createUserFacingError(error: unknown, operation: string): string {
  // Network errors
  if (error instanceof AxiosError && !error.response) {
    return `Unable to ${operation}. Check your internet connection.`;
  }

  // HTTP errors with backend message
  if (error instanceof AxiosError && error.response) {
    const backendMessage = error.response.data?.message;
    if (backendMessage && typeof backendMessage === "string") {
      // Trust backend messages for business-level errors
      return backendMessage; // e.g., "Username already taken"
    }

    // Generic HTTP error
    const status = error.response.status;
    if (status >= 500) {
      return `Unable to ${operation}. Server error. Try again later.`;
    }
    if (status === 404) {
      return `Resource not found. Unable to ${operation}.`;
    }
    if (status === 403) {
      return `You don't have permission to ${operation}.`;
    }
  }

  // Fallback
  return `Failed to ${operation}. Please try again.`;
}

// Usage
try {
  await apiClient.post("/api/users", { email, password });
  showSuccess("Account created successfully!");
} catch (error: unknown) {
  console.error("Registration error:", error);
  showError(createUserFacingError(error, "create account"));
}
```

---

## Testing Error Handling

### Testing with Axios Mocks

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { apiClient } from "./axiosClient";
import { AxiosError } from "axios";

describe("Error handling", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
  });

  afterEach(() => {
    mock.restore();
  });

  it("should handle 404 as valid not-found case", async () => {
    mock.onGet("/api/users/999").reply(404);

    try {
      await apiClient.get("/api/users/999");
      expect.fail("Should have thrown error");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(AxiosError);
      if (error instanceof AxiosError) {
        expect(error.response?.status).toBe(404);
      }
    }
  });

  it("should provide user-friendly message for network error", async () => {
    mock.onGet("/api/users").networkError();

    try {
      await apiClient.get("/api/users");
      expect.fail("Should have thrown error");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(AxiosError);
      if (error instanceof AxiosError) {
        expect(error.response).toBeUndefined(); // No response
        expect(error.message).toContain("Network Error");
      }
    }
  });

  it("should extract backend error message", async () => {
    mock.onPost("/api/users").reply(400, {
      message: "Email already exists",
      code: "DUPLICATE_EMAIL",
    });

    try {
      await apiClient.post("/api/users", { email: "test@example.com" });
      expect.fail("Should have thrown error");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(AxiosError);
      if (error instanceof AxiosError) {
        expect(error.response?.data.message).toBe("Email already exists");
      }
    }
  });
});
```

### Testing Error Extraction Utilities

```typescript
import { getErrorMessage } from "./errorUtils";
import { AxiosError } from "axios";

describe("getErrorMessage", () => {
  it("should extract message from AxiosError response", () => {
    const error = {
      isAxiosError: true,
      response: {
        data: { message: "User not found" },
        status: 404,
      },
      message: "Network Error",
    } as AxiosError;

    expect(getErrorMessage(error)).toBe("User not found");
  });

  it("should use fallback for network errors", () => {
    const error = {
      isAxiosError: true,
      response: undefined, // Network error
      message: "Network Error",
    } as AxiosError;

    expect(getErrorMessage(error)).toBe("Network error. Check your internet connection.");
  });

  it("should handle standard Error objects", () => {
    const error = new Error("Validation failed");
    expect(getErrorMessage(error)).toBe("Validation failed");
  });

  it("should handle unknown error types", () => {
    expect(getErrorMessage("string error")).toBe("An unexpected error occurred");
    expect(getErrorMessage(null)).toBe("An unexpected error occurred");
    expect(getErrorMessage({ foo: "bar" })).toBe("An unexpected error occurred");
  });
});
```

---

## Common Patterns

### 1. Retry with Type-Safe Error Detection

```typescript
async function fetchWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;

      // Retry only network errors, not HTTP 4xx/5xx
      if (error instanceof AxiosError && !error.response) {
        console.warn(`Network error, retrying (${attempt}/${maxRetries})`);
        await delay(1000 * attempt); // Exponential backoff
        continue;
      }

      // Don't retry HTTP errors
      throw error;
    }
  }

  throw lastError;
}

// Usage
const users = await fetchWithRetry(() => apiClient.get("/api/users"));
```

### 2. Centralized Error Handler

```typescript
export function handleServiceError(error: unknown, operation: string): never {
  // Log technical details
  console.error(`[${operation}] Error:`, {
    error,
    type: error?.constructor?.name,
    stack: error instanceof Error ? error.stack : undefined,
  });

  // Handle specific error types
  if (error instanceof AxiosError) {
    const status = error.response?.status;

    if (status === 401) {
      // Redirect to login
      window.location.href = "/login";
      throw new Error("Session expired");
    }

    if (status === 403) {
      throw new Error("You don't have permission for this action");
    }

    if (status === 404) {
      throw new Error("Resource not found");
    }

    if (status && status >= 500) {
      throw new Error("Server error. Please try again later.");
    }

    // Extract backend message if available
    const message = error.response?.data?.message;
    if (message && typeof message === "string") {
      throw new Error(message);
    }
  }

  // Fallback
  throw new Error(`Failed to ${operation}. Please try again.`);
}

// Usage
try {
  const user = await apiClient.get(`/api/users/${id}`);
  return user.data;
} catch (error: unknown) {
  handleServiceError(error, "fetch user");
}
```

### 3. Strongly-Typed Error Response

```typescript
interface ApiErrorResponse {
  message: string;
  code: string;
  details?: Record<string, string[]>;
}

function isApiErrorResponse(data: unknown): data is ApiErrorResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    "code" in data &&
    typeof (data as ApiErrorResponse).message === "string" &&
    typeof (data as ApiErrorResponse).code === "string"
  );
}

try {
  await apiClient.post("/api/users", userData);
} catch (error: unknown) {
  if (error instanceof AxiosError && error.response) {
    const data = error.response.data;

    if (isApiErrorResponse(data)) {
      console.error(`API Error [${data.code}]:`, data.message);

      // Show validation errors
      if (data.details) {
        for (const [field, errors] of Object.entries(data.details)) {
          console.error(`  ${field}: ${errors.join(", ")}`);
        }
      }
    }
  }
}
```

---

## Anti-Patterns to Avoid

### ❌ Using `error: any`

```typescript
// DON'T
catch (error: any) {
  console.log(error.mesage); // Typo goes undetected
}

// DO
catch (error: unknown) {
  if (error instanceof Error) {
    console.log(error.message); // Type-safe
  }
}
```

### ❌ Assuming Error Type Without Narrowing

```typescript
// DON'T
catch (error: unknown) {
  const err = error as AxiosError; // Unsafe cast
  console.log(err.response.status); // May crash
}

// DO
catch (error: unknown) {
  if (error instanceof AxiosError && error.response) {
    console.log(error.response.status); // Safe
  }
}
```

### ❌ Re-Throwing Technical Details

```typescript
// DON'T
catch (error: unknown) {
  throw error; // Leaks stack traces to UI
}

// DO
catch (error: unknown) {
  console.error("Technical details:", error);
  throw new Error("Failed to load data. Please try again.");
}
```

### ❌ Generic Error Messages

```typescript
// DON'T
catch (error: unknown) {
  alert("Error occurred"); // Not actionable
}

// DO
catch (error: unknown) {
  if (error instanceof AxiosError && !error.response) {
    alert("Check your internet connection and try again.");
  } else {
    alert("Failed to save changes. Please try again.");
  }
}
```

---

## TypeScript Compiler Options

Ensure strict error handling with these `tsconfig.json` settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "useUnknownInCatchVariables": true, // Force error: unknown (TS 4.4+)
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**Effect:** Catch blocks default to `error: unknown`, preventing unsafe `any` usage.

---

## Migration Strategy

### Migrating from `error: any`

**Before:**

```typescript
try {
  await operation();
} catch (error: any) {
  console.log(error.message);
}
```

**After (Step 1: Add narrowing):**

```typescript
try {
  await operation();
} catch (error: any) {
  if (error instanceof Error) {
    console.log(error.message);
  } else {
    console.error("Unknown error:", error);
  }
}
```

**After (Step 2: Change to unknown):**

```typescript
try {
  await operation();
} catch (error: unknown) {
  if (error instanceof Error) {
    console.log(error.message);
  } else {
    console.error("Unknown error:", error);
  }
}
```

**Automated find-replace:**

1. Find: `catch (error: any)`
2. Replace: `catch (error: unknown)`
3. Fix type errors by adding narrowing guards

---

## Real-World Example

**Context:** Migrated 3 services to Axios during API modernization. Improved error handling from `error: any` to `error: unknown` with AxiosError guards.

**Before:**

```typescript
try {
  const response = await apiClient.get("/api/progress");
  return response.data.data;
} catch (error: any) {
  console.error("Error:", error.message);
  throw new Error("Failed to load progress");
}
```

**Issues:**

- Assumes all errors have `.message` (may crash)
- No 404 handling (valid "not found" case)
- Generic error message (not actionable)

**After:**

```typescript
try {
  const response = await apiClient.get<WordProgress[]>("/api/progress");
  return response.data;
} catch (error: unknown) {
  if (error instanceof AxiosError) {
    // 404 is valid - user hasn't learned any words yet
    if (error.response?.status === 404) {
      return null;
    }

    console.error("API error:", {
      status: error.response?.status,
      endpoint: "/api/progress",
      message: error.message,
    });
  } else {
    console.error("Non-HTTP error:", error);
  }

  throw new Error("Failed to load your progress. Please try again.");
}
```

**Improvements:**

- ✅ Type-safe error access
- ✅ Handles 404 as valid case
- ✅ Logs technical details for debugging
- ✅ User-friendly error message

---

## Related Documentation

**Project-Specific Guides:**

- [Code Conventions - Error Handling Standards](../guides/code-conventions.md#error-handling-standards)
- [Backend Setup Guide - Error Middleware](../guides/backend-setup-guide.md)
- [Testing Guide - Testing Error Handling](../guides/testing-guide.md#testing-error-handling)

**Knowledge Base:**

- [API Response Patterns](./api-response-patterns.md) - Response structure conventions
- [Backend Authentication](./backend-authentication.md) - 401/403 error handling
- [Frontend State Management](./frontend-state-management.md) - Error state patterns

**External Resources:**

- [TypeScript 4.4 Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-4.html) - `error: unknown` introduction
- [Axios Error Handling](https://axios-http.com/docs/handling_errors)
- [MDN: Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)

---

## Summary

**Always use `error: unknown`, narrow with `instanceof` or type guards, log technical details separately, and provide user-friendly messages. Distinguish between network errors (retry) and HTTP errors (handle by status). Test error paths explicitly.**
