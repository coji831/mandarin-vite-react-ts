# MCP Integration Patterns

**One-sentence summary:** Why Model Context Protocol servers replace ad-hoc terminal commands in agent workflows, when each server type fits, and how to extend the configuration safely.

---

## What Problem MCP Solves

Without MCP, agents must shell out to terminal commands (`curl`, `npx playwright test`) and parse unstructured output. This creates three problems:

1. **Parse brittleness** — text output changes across versions and platforms
2. **No composability** — the agent cannot call the next tool based on structured data from the previous one
3. **Blind spots** — agents can only observe terminal stdout/stderr; they cannot observe browser state, live DOM, or network traffic in real time

MCP solves this by exposing tools through a typed stdio transport layer. The agent calls `fetch({ url, method, body })` and receives a structured JSON response — no curl parsing needed.

---

## When to Use Each MCP Server

| Server       | Package                                  | Best For                                                                        | Never Use For                                            |
| ------------ | ---------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `playwright` | `@playwright/mcp@latest`                 | UI interaction, accessibility tree, screenshots, console/network read           | DOM script evaluation requiring CDP                      |
| `puppeteer`  | `@modelcontextprotocol/server-puppeteer` | `evaluate_script` (arbitrary JS in page), CDP-level access, persistent sessions | Simple navigation — use Playwright instead               |
| `fetch`      | `@modelcontextprotocol/server-fetch`     | Backend API contract verification, health checks, payload shape testing         | External production APIs without authorization           |
| `github`     | `@modelcontextprotocol/server-github`    | Issue details, PR status, repo file content during story planning               | Creating/modifying GitHub resources (avoid write scopes) |

---

## Pattern 1 — Browser Bug Reproduction (Playwright)

**Use case:** Confirm a frontend bug exists and capture console errors before classification.

**Sequence:**

1. `browser_navigate` → open the reproduction route
2. `browser_snapshot` → capture accessibility tree (structured, not fragile screenshot)
3. `browser_click` / `browser_type` → replay user steps from bug report
4. `browser_console_messages` → collect error-level entries
5. `browser_network_requests` → check for failed API calls (4xx, 5xx)

**Attach to:** `verification-artifacts/<story>-browser-repro.md`

**Full procedure:** [browser-reproduction/SKILL.md](../../.github/skills/browser-reproduction/SKILL.md)

---

## Pattern 2 — API Contract Testing (Fetch)

**Use case:** During bug investigation, verify that a backend endpoint returns the expected status code, shape, and data without writing a full integration test.

**Sequence:**

```
# Health check
fetch({ url: "http://localhost:3001/api/health", method: "GET" })

# Authenticated endpoint (include Authorization header)
fetch({
  url: "http://localhost:3001/api/quiz/result",
  method: "POST",
  headers: { "Content-Type": "application/json", "Authorization": "Bearer <token>" },
  body: JSON.stringify({ questionId: "123", answer: "correct" })
})
```

**When to prefer Fetch over curl:**

- Agent needs the response body as structured data for the next step
- Response status code needs to be checked as a conditional gate
- No terminal tool is available in the current agent execution context

**Full procedure:** [external-integration-operations/SKILL.md](../../.github/skills/external-integration-operations/SKILL.md)

---

## Pattern 3 — CDP Script Evaluation (Puppeteer)

**Use case:** Playwright's accessibility-tree model doesn't expose the value you need (e.g., deeply nested React state, canvas element data, localStorage contents).

**Sequence:**

1. `puppeteer_navigate` → open the target URL (use the running dev server)
2. `puppeteer_evaluate` → execute JavaScript in page context to extract state
3. Compare extracted value to expected value from the bug report

**Example — read localStorage:**

```
puppeteer_evaluate({
  script: "JSON.stringify(Object.fromEntries(Object.entries(localStorage)))"
})
```

**Example — read React component state via window debug hook:**

```
puppeteer_evaluate({
  script: "window.__DEBUG_STATE__ && JSON.stringify(window.__DEBUG_STATE__)"
})
```

**When to prefer Puppeteer over Playwright:**

- Need arbitrary JavaScript execution in the page context
- Testing browser storage (localStorage, sessionStorage, cookies)
- Playwright snapshot does not contain the element or value needed

**Full procedure:** [external-integration-operations/SKILL.md](../../.github/skills/external-integration-operations/SKILL.md)

---

## Pattern 4 — Issue Context Resolution (GitHub)

**Use case:** Before implementing a story, pull the full issue description and acceptance criteria from GitHub to avoid re-asking the user.

**Sequence:**

1. Identify the issue number from the story BR or ledger
2. Call the GitHub MCP `get_issue` or equivalent tool to retrieve title, body, and labels
3. Extract acceptance criteria from the issue body
4. Record in `.ai_ledger.md` as the authoritative AC source for the current pipeline run

**When to prefer GitHub MCP over reading BR docs:**

- Issue was filed directly in GitHub without a corresponding BR doc
- User mentions a GitHub issue number rather than an epic/story identifier
- Cross-checking whether a PR already exists for the current work

---

## Adding a New MCP Server

Follow this checklist when extending `.vscode/mcp.json`:

1. **Confirm the npm package exists** — run `npm view <package-name>` to verify before adding
2. **Classify the server type:** public package (no account) vs. public package (needs API key) vs. custom-hosted
3. **Add the entry to `.vscode/mcp.json`** per the format in [mcp-operations-guide.md](../guides/mcp-operations-guide.md)
4. **Document any required env vars** in the Secret Management section of `mcp-operations-guide.md`
5. **Create or update a skill** that describes which tools the server exposes and when to use them
6. **Add a row to the "When to Use" table** above

---

## What Needs Custom Hosting

These categories of MCP integration cannot use public npm packages and require your own infrastructure or paid accounts:

| Category                | Examples                         | Requirement                         |
| ----------------------- | -------------------------------- | ----------------------------------- |
| Observability platforms | Datadog, New Relic, Dynatrace    | Paid account + organization API key |
| Project management      | Jira, Confluence, Notion         | Account + OAuth app registration    |
| Team communication      | Slack, Microsoft Teams           | Workspace + bot token               |
| Cloud operations        | AWS, Azure DevOps, GCP           | Cloud account + IAM credentials     |
| Internal services       | Custom APIs, internal dashboards | Custom MCP server wrapping your API |

For custom-hosted MCP servers, the SOLAR-Ralph pattern is: write a minimal wrapper service that implements the MCP stdio transport and deploy it to the same infrastructure as the workload being monitored.

---

## Security Rules for MCP Configuration

1. **Never commit tokens** — all secrets use `${env:VARIABLE_NAME}` resolution; never hardcode values
2. **Scope tokens narrowly** — GitHub PAT: `repo` read + `read:org` only; no write scopes unless the feature requires creating issues or PRs
3. **Fetch MCP is not a proxy** — do not use it to forward requests to external production APIs without confirming with the team; treat it as a localhost/staging tool only
4. **Puppeteer runs local Chrome** — no data leaves the machine; safe for local dev use

---

## Related Files

- [docs/guides/mcp-operations-guide.md](../guides/mcp-operations-guide.md) — Setup, troubleshooting, and secret management reference
- [.vscode/mcp.json](../../.vscode/mcp.json) — Authoritative server configuration
- [.github/skills/browser-reproduction/SKILL.md](../../.github/skills/browser-reproduction/SKILL.md) — Playwright-based browser bug reproduction procedure
- [.github/skills/external-integration-operations/SKILL.md](../../.github/skills/external-integration-operations/SKILL.md) — Fetch and Puppeteer MCP usage for API and DOM testing
