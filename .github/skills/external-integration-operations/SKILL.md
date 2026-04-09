---
name: external-integration-operations
description: >
  Use when an agent needs to test API contracts with the Fetch MCP server,
  inspect DOM state with the Puppeteer MCP server, or verify browser storage
  and CDP-level behaviour that the Playwright accessibility-tree model does not expose.
user-invocable: false
---

# External Integration Operations Skill

## Purpose

Provide structured procedures for using the Fetch MCP and Puppeteer MCP servers during bug investigation and verification steps. These complement the [browser-reproduction skill](../browser-reproduction/SKILL.md) (Playwright-based) for scenarios requiring HTTP-level or CDP-level access.

---

## When to Use

- **Fetch MCP:** Backend API bug investigation — verify a specific endpoint returns the expected status code, headers, or JSON shape without writing a Vitest test
- **Puppeteer evaluate_script:** Frontend bug where the relevant state is not visible in the accessibility tree (localStorage, sessionStorage, React internals, canvas data)
- **Puppeteer persistent session:** Multi-step form scenario requiring that the browser remain open and state-ful across evaluation steps

---

## When NOT to Use

- Simple navigation and UI interaction — use the `browser-reproduction` skill (Playwright MCP) instead
- Backend tests that must survive CI — write a Vitest integration test instead of relying on Fetch MCP
- External production endpoints — never target production without explicit authorization; restrict to `localhost` or staging only

---

## Preconditions

- Dev server running: `npm run dev` (frontend on `http://localhost:5173`)
- Backend running (if testing API): `npm run start-backend` (port 3001)
- MCP servers active (started automatically by VS Code via `.vscode/mcp.json`)
- Both `fetch` and `puppeteer` entries must be present in `.vscode/mcp.json`

---

## Section A — API Contract Testing with Fetch MCP

Use the `fetch` MCP server to test backend endpoints directly from agent context.

### Step A1 — Health Check

Before testing a specific route, confirm the backend is responding:

```
fetch({ url: "http://localhost:3001/api/health", method: "GET" })
```

Expected: HTTP 200. If 5xx or connection refused, stop and record in the ledger — backend is not running.

### Step A2 — Unauthenticated Endpoint Test

Test any public endpoint:

```
fetch({
  url: "http://localhost:3001/api/<route>",
  method: "GET"
})
```

Record: status code, response body shape, and any error fields.

### Step A3 — Authenticated Endpoint Test

For routes requiring JWT auth, include the Authorization header. Obtain a token first via the login route:

```
fetch({
  url: "http://localhost:3001/api/auth/login",
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: "{\"email\": \"test@example.com\", \"password\": \"testpassword\"}"
})
```

Extract `token` from the response, then call the protected route:

```
fetch({
  url: "http://localhost:3001/api/<protected-route>",
  method: "GET",
  headers: { "Authorization": "Bearer <token>" }
})
```

### Step A4 — Record Findings

Attach findings to the ledger Verification Failures section if the response does not match expected:

```
- Verification Step: API contract test — POST /api/quiz/result
- Failure: HTTP 422 Unprocessable Entity — response: { "error": "invalid questionId" }
- Root Cause Hint: The quiz result endpoint expects a UUID for questionId; the frontend is sending an integer.
```

---

## Section B — DOM and Storage Inspection with Puppeteer MCP

Use the `puppeteer` MCP server when Playwright's accessibility tree does not expose the state needed.

### Step B1 — Navigate

Open the target route in the Puppeteer-managed browser:

```
puppeteer_navigate({ url: "http://localhost:5173/<route>" })
```

### Step B2 — Read Browser Storage

Check `localStorage` for persisted state:

```
puppeteer_evaluate({
  script: "JSON.stringify(Object.fromEntries(Object.entries(localStorage)))"
})
```

Check `sessionStorage`:

```
puppeteer_evaluate({
  script: "JSON.stringify(Object.fromEntries(Object.entries(sessionStorage)))"
})
```

Read cookies visible to the page:

```
puppeteer_evaluate({
  script: "document.cookie"
})
```

Note: `httpOnly` cookies are not visible to `document.cookie`. If auth cookies are `httpOnly`, confirm their presence via the network response inspection instead.

### Step B3 — Evaluate Page State

Run arbitrary JavaScript to extract component or app state. Examples:

```
# Read a React context value exposed via a debug hook
puppeteer_evaluate({
  script: "window.__DEBUG_QUIZ_STATE__ && JSON.stringify(window.__DEBUG_QUIZ_STATE__)"
})

# Check if a specific DOM node exists
puppeteer_evaluate({
  script: "!!document.querySelector('[data-testid=\"quiz-card\"]')"
})

# Read a computed CSS property
puppeteer_evaluate({
  script: "window.getComputedStyle(document.querySelector('.score-badge')).visibility"
})
```

### Step B4 — Replay Action and Observe State Change

Use `puppeteer_click` and `puppeteer_fill` to replay the bug trigger, then re-evaluate state:

```
puppeteer_click({ selector: "[data-testid='submit-answer']" })
puppeteer_evaluate({ script: "JSON.stringify(window.__DEBUG_QUIZ_STATE__)" })
```

Compare before/after state snapshots to identify where state diverges from expected.

### Step B5 — Take Screenshot for Evidence

If visual evidence is needed for the ledger:

```
puppeteer_screenshot({ name: "bug-repro-<story>-<date>" })
```

Attach the screenshot path to `verification-artifacts/<story>-puppeteer-repro.md`.

---

## Output Contract

After using this skill, produce an **Integration Verification Report** in the following format and attach it to the ledger:

```
## Integration Verification Report

Story: <epic>-<story>
Date: <today's date>
Servers Used: fetch / puppeteer / both

### API Contract Findings

| Endpoint | Method | Expected Status | Actual Status | Shape Match | Notes |
|----------|--------|-----------------|---------------|-------------|-------|
| /api/health | GET | 200 | 200 | N/A | Backend healthy |
| /api/quiz/result | POST | 201 | 422 | No | Invalid questionId type |

### DOM / Storage Findings

| Check | Expected | Actual | Notes |
|-------|----------|--------|-------|
| localStorage.quizProgress | { ... } | null | Not written after submission |

### Root Cause Hint

<Directional hypothesis for the fix based on the above findings>
```

---

## Constraints

- **localhost only** — do not call external production URLs unless explicitly authorized
- **Read before write** — for Puppeteer evaluate, prefer read-only scripts; do not mutate DOM unless the reproduction scenario requires it
- **One session at a time** — Puppeteer manages a single persistent browser; close previous sessions before starting a new reproduction sequence

---

## Related Resources

- [browser-reproduction/SKILL.md](../browser-reproduction/SKILL.md) — Playwright-based UI reproduction (prefer for accessibility-tree and form interaction)
- [docs/guides/mcp-operations-guide.md](../../../docs/guides/mcp-operations-guide.md) — Fetch and Puppeteer server setup and troubleshooting
- [docs/knowledge-base/mcp-integration-patterns.md](../../../docs/knowledge-base/mcp-integration-patterns.md) — When to use each MCP server type
