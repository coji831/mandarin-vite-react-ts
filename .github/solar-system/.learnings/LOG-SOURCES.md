# Log Sources Reference

All available SOLAR activity log sources and how to use them.

| Source                 | Location                                    | Access           | Write-back target          |
| ---------------------- | ------------------------------------------- | ---------------- | -------------------------- |
| Session Log            | `.github/solar-system/logs/session-*.json`  | `read_file`      | `ERRORS.md` (on failure events) |
| ERRORS.md              | `.github/solar-system/.learnings/ERRORS.md` | Phase 1 auto     | Self                       |
| Agent Debug Logs       | VS Code Chat > ... > Show Agent Debug Logs  | UI only          | `ERRORS.md` (manual)       |
| MCP Output Log         | Command Palette > MCP: List Servers > Show Output | UI only   | `ERRORS.md` (manual)       |

## Session Log Format

Each session log file is a JSON document at `.github/solar-system/logs/session-<ISO-timestamp>.json`:

```json
{
  "session": "<ISO timestamp of session start>",
  "events": [
    {
      "t": "<ISO timestamp>",
      "tool": "<tool-name>",
      "file": "<affected-file-path>",
      "ok": true,
      "note": "<error-message-if-failed>"
    }
  ]
}
```

Fields per event:
- `t` — ISO timestamp
- `tool` — tool name (lower-case) or `SESSION_END` for the final event
- `file` — affected file path (optional; omitted if tool has no file target)
- `ok` — `true` on success, `false` on failure
- `note` — error message excerpt (only on failure; max 200 chars)

## Reading Session Logs

To analyze failures across a session, load the most recent session log file:

```
read_file(".github/solar-system/logs/<session-file>.json")
```

Look for events where `ok: false` and cross-reference with `ERRORS.md` entries for root-cause analysis.

## Log Retention

Session logs are gitignored (`.github/solar-system/logs/*.json`). The `session-start.cjs` hook rotates old logs on session start, keeping the most recent `logging.sessionLog.maxFiles` files (default: 20).

## Enabling / Disabling

Session logging is controlled by `solar.config.json`:

```json
{
  "logging": {
    "sessionLog": {
      "enabled": true,
      "path": ".github/solar-system/logs/",
      "maxFiles": 20
    }
  }
}
```
