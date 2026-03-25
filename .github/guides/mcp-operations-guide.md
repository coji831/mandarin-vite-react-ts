# MCP Operations Guide

**Purpose:** Reference guide for configuring, starting, and using Model Context Protocol (MCP) servers in the SOLAR-Ralph workflow.

---

## What Is MCP?

MCP (Model Context Protocol) is a standard that lets AI agents call external tools — browsers, GitHub APIs, file systems — through a unified stdio transport layer. In this repo, VS Code Copilot discovers configured MCP servers from `.vscode/mcp.json` and makes their tools available to agents.

---

## Configured Servers

See `.vscode/mcp.json` for the authoritative configuration.

### Playwright MCP (`playwright`)

**Package:** `@playwright/mcp@latest`
**Purpose:** Browser automation — navigate pages, click elements, type input, capture accessibility trees, take screenshots, read console errors, and inspect network traffic.
**Primary Use Case:** Bug reproduction via the `browser-reproduction` skill during Pipeline 3 (Bug Fix).

Available tools (partial list):
| Tool | Description |
|------|-------------|
| `browser_navigate` | Open a URL in a managed browser |
| `browser_snapshot` | Capture accessibility tree as structured text |
| `browser_click` | Click an element by aria role or label |
| `browser_type` | Type text into an input field |
| `browser_take_screenshot` | Capture screen as image |
| `browser_console_messages` | Read accumulated console output |
| `browser_network_requests` | List HTTP requests and responses |

### GitHub MCP (`github`)

**Package:** `@modelcontextprotocol/server-github`
**Purpose:** Read GitHub issues, PRs, and repo metadata without leaving the agent context.
**Primary Use Case:** Retrieving issue descriptions when implementing new stories in Pipeline 4 (Feature).

**Requires:** `GITHUB_PERSONAL_ACCESS_TOKEN` environment variable (see Secret Management below).

### Puppeteer MCP (`puppeteer`)

**Package:** `@modelcontextprotocol/server-puppeteer` (official MCP reference server)
**Purpose:** Chrome DevTools Protocol (CDP) access with persistent browser sessions. Complements Playwright MCP by providing direct script evaluation and DOM-level inspection beyond the accessibility-tree model.
**Primary Use Case:** `puppeteer_evaluate` for running arbitrary JavaScript against a live page; CDP-level network and console inspection when Playwright's structured output is insufficient.

Available tools (partial list):
| Tool | Description |
|------|-------------|
| `puppeteer_navigate` | Navigate to a URL in the managed browser |
| `puppeteer_screenshot` | Capture a full-page screenshot |
| `puppeteer_evaluate` | Execute JavaScript in the browser context (CDP evaluate_script) |
| `puppeteer_click` | Click a CSS-selector-matched element |
| `puppeteer_fill` | Fill an input field |
| `puppeteer_hover` | Hover over an element |
| `puppeteer_select` | Select a value from a `<select>` element |

**No secrets required** — runs fully local.

### Fetch MCP (`fetch`)

**Package:** `@modelcontextprotocol/server-fetch` (official MCP reference server)
**Purpose:** Stateless HTTP requests (GET, POST, PUT, DELETE, PATCH) directly from agent context without requiring a curl command in the terminal.
**Primary Use Case:** API contract testing — verify backend endpoint responses, check health routes, and confirm JSON payloads match expected schema during Pipeline 3 (Bug Fix) investigation.

Available tools:
| Tool | Description |
|------|-------------|
| `fetch` | Execute an HTTP request and return the response body + status code |

Example invocation from a skill:

```
fetch({ url: "http://localhost:<port>/api/health", method: "GET" })
fetch({ url: "http://localhost:<port>/api/<resource>", method: "POST", body: "{...}" })
```

**No secrets required** — makes requests using the agent's ambient network access. Do not use against external production endpoints without explicit authorization.

---

## Starting MCP Servers

MCP servers are started automatically by VS Code Copilot when an agent makes a tool call that requires them. No manual start is needed for normal use.

To verify servers are available, check the Copilot Chat panel for available MCP tools before invoking an agent that uses browser or GitHub tools.

---

## Secret Management

The GitHub MCP server requires a personal access token. Configure it using one of these methods:

### Option A — VS Code Secret Storage (Recommended)

VS Code resolves `${env:GITHUB_PERSONAL_ACCESS_TOKEN}` from environment variables set in your shell profile:

**Windows PowerShell:**

```powershell
[System.Environment]::SetEnvironmentVariable("GITHUB_PERSONAL_ACCESS_TOKEN", "<your-token>", "User")
```

Restart VS Code after setting the variable.

**macOS / Linux (`.zshrc` or `.bashrc`):**

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN=<your-token>
```

### Option B — `.env.local` (Not for Committed Files)

Create a `.env.local` at the project root (already in `.gitignore`):

```
GITHUB_PERSONAL_ACCESS_TOKEN=<your-token>
```

Note: VS Code does not automatically read `.env.local` for MCP server env injection. Prefer Option A.

### Token Scope Requirements

Minimum required scopes for `@modelcontextprotocol/server-github`:

- `repo` — read access to issues and PRs
- `read:org` — optional, needed only for org-level PRs

Do **not** grant `write` scopes unless you intentionally want the agent to create/modify GitHub resources.

### COPILOT*MCP*\* Naming Convention and Governance

All environment variables injected into MCP servers follow the `COPILOT_MCP_<SERVER>_<VAR>` naming pattern to distinguish MCP secrets from application secrets.

| Variable                       | Server             | Purpose                                |
| ------------------------------ | ------------------ | -------------------------------------- |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | `github`           | GitHub API access for issues and PRs   |
| `COPILOT_MCP_FETCH_PROXY`      | `fetch` (optional) | HTTP proxy for outbound fetch requests |

**Governance rules:**

1. **Never commit secrets.** All MCP env vars must be injected from the host environment or VS Code secret storage — never hardcoded in `.vscode/mcp.json` or checked into version control.
2. **Scope minimally.** Grant only the permissions the MCP server needs (e.g., `repo:read` for GitHub token unless write operations are explicitly required).
3. **Use `${env:VAR_NAME}` syntax** in `.vscode/mcp.json` env fields. VS Code resolves these from the shell environment at startup.
4. **Document new variables here** when adding a new MCP server that requires secrets.
5. **`.env.local` for development only.** If using a `.env.local` file, confirm it is in `.gitignore` before adding secrets. Note: VS Code does not auto-inject `.env.local` into MCP server env — prefer system environment variables (Option A).

**Adding a new server with secrets:**

1. Add the env field in `.vscode/mcp.json` using `${env:COPILOT_MCP_<SERVER>_<VAR>}`.
2. Add the variable to the governance table above.
3. Document setup instructions in this guide under Option A (system env) or Option B (`.env.local`).
4. Never add the actual secret value to any committed file.

---

## Using MCP Tools in Agents

### Reference from a Skill

Skills reference MCP tools by name. Example from `browser-reproduction/SKILL.md`:

```
browser_navigate({ url: "http://localhost:<frontend-port>/<route>" })
```

The agent calls the Playwright MCP server's `browser_navigate` tool transparently.

### Adding a New MCP Server

1. Find the server's npm package name from the MCP registry or tool docs
2. Add an entry to `.vscode/mcp.json`:
   ```json
   "my-server": {
     "command": "npx",
     "args": ["-y", "@scope/mcp-server-name"],
     "env": { "API_KEY": "${env:MY_API_KEY}" },
     "description": "One-line description of what this server does"
   }
   ```
3. Document any required env vars in this guide under **Secret Management**
4. Create a skill or add a section to an existing skill describing which tools to use and when

---

## Troubleshooting

### "MCP server not found" or tools not appearing

1. Confirm `.vscode/mcp.json` is present and valid JSON
2. Run `npx @playwright/mcp@latest --help` in a terminal to confirm the package is accessible
3. Reload VS Code window (`F1` → `Developer: Reload Window`)
4. Check the Copilot output panel for MCP startup errors

### Playwright browser launch fails

Run the Playwright install command to download browser binaries:

```bash
npx playwright install chromium
```

If running in a restricted environment (CI or container), use `--with-deps`:

```bash
npx playwright install --with-deps chromium
```

### GitHub MCP returns 401 Unauthorized

Verify the token is set in the current shell environment:

```powershell
echo $env:GITHUB_PERSONAL_ACCESS_TOKEN
```

If empty, set the variable (Option A above) and restart VS Code.

### GitHub MCP returns 403 Forbidden

Check that the token has `repo` scope. Generate a new token at `github.com → Settings → Developer Settings → Personal Access Tokens`.

---

## Security Considerations

- Never commit tokens to source control — use env vars or a secrets manager
- The GitHub token in `.vscode/mcp.json` uses `${env:GITHUB_PERSONAL_ACCESS_TOKEN}`, which is resolved at runtime and never stored in the file itself
- Playwright MCP runs locally and does not send browser data to any external service
- Puppeteer MCP runs locally; the managed browser process is isolated to your machine
- Fetch MCP makes real HTTP requests — restrict use to `localhost` or staging endpoints; do not call external production APIs without authorization
- Restrict token scopes to the minimum needed (read-only for most workflows)

---

## Related Files

- [.vscode/mcp.json](../../.vscode/mcp.json) — MCP server configuration
- [.github/skills/browser-reproduction/SKILL.md](../../.github/skills/browser-reproduction/SKILL.md) — Browser bug reproduction workflow (Playwright MCP)
- [.github/skills/external-integration-operations/SKILL.md](../../.github/skills/external-integration-operations/SKILL.md) — Fetch and Puppeteer MCP usage for API and DOM testing
- [.github/agents/bug-investigation-specialist.agent.md](../../.github/agents/bug-investigation-specialist.agent.md) — Agent that invokes browser-reproduction skill
- [AGENTS.md](../../AGENTS.md) — Pipeline 3 (Bug Fix) where MCP browser tools are used
- [docs/knowledge-base/mcp-integration-patterns.md](../knowledge-base/mcp-integration-patterns.md) — Architecture rationale and deep-dive on MCP integration patterns
