---
description: "Use when making API calls from frontend code. Mandates service layer pattern — never call apiClient directly from hooks or components."
applyTo: "apps/frontend/src/**/*.ts,apps/frontend/src/**/*.tsx"
---

# API Client — Service Layer Mandatory

## Rule

Every HTTP request MUST go through a service file. NEVER import or call `apiClient` directly from hooks, components, or strategies.

## ✅ DO — Create a service file

```typescript
// features/quiz/services/quizService.ts
import { apiClient } from "../../../shared/api/axiosClient";

export async function fetchQuestions(type: string, count: number) {
  const response = await apiClient.get(`/v1/quiz/questions`, { params: { type, count } });
  return response.data;
}
```

Then use it from your hook:

```typescript
// features/quiz/hooks/useQuizEngine.ts
import { fetchQuestions } from "../services/quizService";
```

## ❌ DON'T — Direct apiClient in hook/component

```typescript
// ❌ BAD — Never do this in a hook or component
import { apiClient } from "../../../shared/api/axiosClient";
const response = await apiClient.get("/v1/quiz/questions");
```

## Where Services Live

- Feature-specific: `features/<name>/services/<name>Service.ts`
- Cross-cutting: `shared/services/<name>Service.ts`

## Loading States & Error Resilience

Every data-fetching component must handle three states:

1. **Loading** — show loading indicator (with timeout fallback)
2. **Error** — show error message with retry action
3. **Success** — render data

### Timeout Pattern

```typescript
// ✅ DO — Add timeout to all API calls
const response = await apiClient.get("/v1/data", {
  timeout: 10000, // 10s timeout
});

// ✅ DO — Retry mechanism
async function fetchWithRetry(url: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await apiClient.get(url, { timeout: 10000 });
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1))); // exponential backoff
    }
  }
}
```

### Component Pattern

```tsx
function DataComponent() {
  const { data, isLoading, error, refetch } = useDataFetch();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  return <DataView data={data} />;
}
```

### ❌ DON'T

```tsx
// ❌ BAD — No loading handling
const data = await fetchData(); // could hang forever
return <View data={data} />;

// ❌ BAD — No retry on error
if (error) return <p>Error!</p>; // user stuck with no recovery
```
