---
purpose: Agent browser verification practices
status: active
last-verified: 2026-08-02
type: guide
---

# Agent Browser Verification

**Category:** Practices / Agent Operations
**Last Updated:** 2026-08-02
**Difficulty:** Advanced

> **Scope:** Running Playwright / Storybook browser verification as an AI agent — the
> operational lessons from epic-21 (subagents dying on long runs, trust-the-disk-over-
> tool-return, UTF-8-safe PowerShell I/O, and the MSW/axios interactions that make
> Storybook mocks silently misbehave).

---

## Problem

Browser verification of UI work (navigate → click → screenshot → assert) is delegated to
subagents with one-shot tool sessions. Long, monolithic Playwright runs fail silently —
the subagent dies mid-run, the "success" return never proves a screenshot exists, and
non-ASCII output (Chinese glyphs) gets mangled when read/written through PowerShell 5.1.
Meanwhile Storybook MSW mocks look right but never match the real requests, or trigger
infinite auth-refresh loops.

## Root Cause

- **Subagents die on long runs.** A subagent's browser session is not durable: one large
  script that navigates through many states can time out, crash, or lose the page handle,
  losing all progress at once.
- **Tool returns lie.** A `screenshot taken` / `clicked` return value does not prove the
  artifact is on disk, correct, or visible. Trusting the return instead of the artifact
  hides failures until much later.
- **`page.evaluate` geometry is brittle.** Computed layout values asserted via
  `page.evaluate` can disagree with what is actually rendered; a screenshot is ground truth.
- **PowerShell 5.1 default encoding.** `Get-Content` / `Set-Content` / `Out-File` default to
  the system ANSI codepage, so Chinese (and other non-ASCII) text round-trips as mojibake.
- **MSW + axios interactions.** Relative MSW URLs never match; percent-encoded path params
  arrive still-encoded in `params`; and a refresh/me mock returning a fake or expired token
  makes the axios interceptor refresh again → double/infinite refresh.

## Solution

### 1. Split long runs into small, surgical runs

One purpose per Playwright invocation (e.g. "open story X and screenshot", "click Y and
screenshot", "assert console errors"). A failure in a small run is cheap to re-run; a
failure in a 50-step run restarts everything.

### 2. Write an incremental ledger as you go

Append each verification step's outcome (step, page, screenshot path, pass/fail) to a
markdown ledger after each step. If the subagent dies, the ledger on disk still shows how
far it got — nothing between checkpoints is lost.

### 3. Verify on disk, not on tool return

Confirm the artifact exists and is non-trivial: the screenshot file exists with non-zero
size (or view it), the ledger contains the expected rows, `git diff` shows the intended
change. A return value alone is not evidence.

### 4. Prefer screenshots over `page.evaluate` geometry

Capture and inspect the rendered image rather than asserting computed positions/sizes
in-page. What the user sees is what matters.

### 5. Mandatory concise report

Every browser-verification pass ends with a short report (what was verified, screenshots,
discrepancies vs spec) written to `verification-artifacts/` (gitignored — evidence is not a committed source) — not just an in-chat "done".

### 6. UTF-8-safe PowerShell file I/O

Read and append with an explicit BOM-less UTF-8 encoding so Chinese content survives:

```powershell
# Read (UTF-8, no BOM)
$lines = [System.IO.File]::ReadAllLines($path, [System.Text.UTF8Encoding]::new($false))
# Append (UTF-8, no BOM)
[System.IO.File]::AppendAllText($path, $text, [System.Text.UTF8Encoding]::new($false))
```

Avoid `Get-Content`/`Set-Content`/`Out-File` default encodings for any file containing
non-ASCII text.

### 7. MSW handler hygiene (also see Storybook MSW Handlers KB article)

- Use **full base URLs** — `http://localhost:3001/api/v1/...`, never relative `/api/v1/...`;
  MSW does not resolve relative paths in the Node/Storybook test env.
- **`decodeURIComponent` percent-encoded path params** — `:glyph`-style segments arrive
  encoded (e.g. `%E4%BD%98`); decode before comparing.
- **Refresh/me mocks return a well-formed, non-expired JWT** — otherwise the axios
  interceptor treats the token as expired and refreshes again → double refresh.

## Impact

- Browser verification becomes resumable and auditable — partial progress survives subagent
  deaths, and every claim is backed by an on-disk artifact.
- Mojibake-free artifact writes and `git diff`s for Chinese content.
- Storybook/test MSW mocks actually intercept the real requests and stop triggering
  auth-refresh loops.

## Alternatives Considered

- **One large end-to-end Playwright run** — simplest, but fragile: a single failure
  restarts everything and subagent sessions are not durable.
- **Trusting tool return values** — fast but hides failures; violates the on-disk
  verification principle.
- **`page.evaluate` geometry assertions** — cheap, but flakier than rendered screenshots
  and doesn't show what the user actually sees.

## See Also

- [Storybook MSW Handlers](../frontend/storybook-msw-handlers.md) — the handler-factory
  pattern and its pitfalls (full URLs, `decodeURIComponent`, JWT-shaped refresh mocks).
- `docs/knowledge-base/agentics/agent-visual-understanding.md` — the visual-design
  verification loop (Storybook-first, MCP toolchain).
- `.github/instructions/frontend-pre-delivery-checklist.instructions.md` — the pre-ship UI
  checklist that browser verification feeds.
