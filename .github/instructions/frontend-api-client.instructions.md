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

---

**See also:** `testing-standards.instructions.md` (test your services) • `.github/skills/frontend-audit/SKILL.md` (verify error states) • `frontend-component-architecture.instructions.md` (barrel exports)
