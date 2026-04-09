---
name: browser-reproduction
description: "Use when a bug investigation requires confirming behaviour in a live browser before classifying the root cause. Produces a Behaviour Report that the Bug Investigation Specialist attaches to the ledger before classification."
argument-hint: "Bug title or description to reproduce"
user-invocable: true
---

# Browser Reproduction Skill

## Purpose

Use this skill when a bug investigation requires confirming behaviour in a live browser before classifying the root cause. Produces a **Behaviour Report** that the Bug Investigation Specialist attaches to the ledger before classification.

Requires the Playwright MCP server. Confirm it is running before executing any tool call below.

---

## When to Use

- Frontend bug where console errors or network failures are suspected
- UI state does not match expected state and a visual snapshot is needed
- Flaky test whose failure cannot be reproduced via unit tests alone
- Bug description references specific navigation path, form interaction, or dialog behaviour

---

## When NOT to Use

- Backend-only bugs (no browser needed — use curl/Prisma Studio instead)
- Reproduction already confirmed via existing failing unit/Vitest test
- MCP server is unavailable — fall back to curl or manual repro steps only

---

## Preconditions

1. Dev server must be running: `npm run dev` (frontend on `http://localhost:5173`)
2. Backend must be running if the bug involves API calls: `npm run start-backend` (port 3001)
3. Playwright MCP server is active (started by VS Code via `.vscode/mcp.json`)

---

## Execution Steps

### Step 1 — Navigate to the Starting Route

Use the Playwright MCP `browser_navigate` tool to open the relevant URL.

```
browser_navigate({ url: "http://localhost:5173/<route>" })
```

Record the route in the Behaviour Report.

### Step 2 — Capture Initial Accessibility Tree

Use `browser_snapshot` to capture the accessibility tree at the starting state. This provides structured text that can be parsed without screenshot OCR noise.

```
browser_snapshot()
```

Identify any visible error states, disabled controls, or missing elements noted in the bug report.

### Step 3 — Reproduce the Bug Sequence

Use `browser_click`, `browser_type`, and `browser_select_option` to replicate the steps from the bug report exactly.

```
browser_click({ element: "<aria label or role description>" })
browser_type({ element: "<aria label>", text: "<input value>" })
```

After each user action that should trigger a change, call `browser_snapshot` again to capture the updated tree.

### Step 4 — Capture Console Errors

Use `browser_console_messages` to gather all console output accumulated since navigation.

```
browser_console_messages()
```

Filter for `error` and `warn` level entries. Record exact error text.

### Step 5 — Capture Network Failures (If API-Related)

If the bug involves API calls, use `browser_network_requests` to list requests and responses during the reproduced session.

```
browser_network_requests()
```

Look for 4xx/5xx responses, missing auth headers, or CORS errors.

### Step 6 — Take Screenshot for Visual Evidence

Use `browser_take_screenshot` to produce a screenshot at the failure state.

```
browser_take_screenshot()
```

Include this in the Behaviour Report as visual reference.

---

## Behaviour Report Format

After completing Steps 1–6, produce a Behaviour Report in this format and attach it to the `.github/.ai_ledger.md` under **Verification Failures**:

```markdown
### Behaviour Report — <Bug Title>

**Reproduction URL:** http://localhost:5173/<route>
**Steps Performed:**

1. ...
2. ...

**Observed Behaviour:**

- (What actually happened)

**Expected Behaviour:**

- (What the bug report says should happen)

**Console Errors:**

- [error] <exact error text>
- [warn] <exact warning text>

**Network Failures:**

- POST /api/<endpoint> → 401 Unauthorized

**Screenshot:** [attached above]

**Reproducible:** Yes / No / Intermittent
```

---

## Root Cause Hint Output

After the Behaviour Report, output a one-sentence Root Cause Hint for the Bug Investigation Specialist:

> "Console error indicates `<component>` dispatches `<action>` before auth state is initialized — investigate initialization order in `<file>`."

This hint is written to the ledger `Root Cause Hint` field.

---

## Guardrails

- Do not modify any application code during browser reproduction
- Do not submit forms that trigger destructive mutations (DELETE, hard resets) unless the bug specifically requires it
- If MCP tools time out or return unexpected results, record the failure in the Behaviour Report and fall back to manual curl steps
- Maximum 3 retry attempts per step before recording the step as **inconclusive**
