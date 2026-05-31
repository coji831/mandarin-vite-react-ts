# Artifact Handle Pattern

When an agent needs to reason about a large file, there are two strategies:

1. **Full Load** — read the entire file content into context.
2. **Path Handle** — pass the file path reference; load only targeted sections on demand.

This document defines which strategy to use and when.

---

## Threshold Rule

**If a file exceeds `context.artifactSizeThresholdLines` lines (default: 200), use a
path handle instead of a full load.**

The `context.artifactSizeThresholdLines` value is set in `solar.config.json`. Adjust
based on observed context pressure in real loop sessions.

---

## Always Loaded (Full Content)

Load these files in full regardless of size:

| File                        | Reason                                                           |
| --------------------------- | ---------------------------------------------------------------- |
| `.github/.ai_ledger.md`     | Session state — must be read in full to determine pipeline stage |
| `.github/solar.config.json` | Config — small, always needed                                    |
| `.github/hooks/hooks.json`  | Hook registry — needed for governance reasoning                  |
| Active story BR file        | Small, directly relevant to current AC                           |
| Active impl doc file        | Small, directly relevant to current task                         |

---

## Always Referenced (Path Handle)

Pass as a file path reference and read only relevant sections on demand:

| File                      | Reason                                                       |
| ------------------------- | ------------------------------------------------------------ |
| `docs/architecture.md`    | Large overview — read targeted sections only                 |
| Full test suites          | Read specific test files only when debugging a specific test |
| Generated migration files | Reference only; rarely need full content                     |
| Large API spec files      | Read the relevant endpoint section only                      |
| `AGENTS.md`               | Read on session start; reference by section thereafter       |
| Knowledge base articles   | Read on demand when a specific pattern is relevant           |

---

## Decision Algorithm for the Governor

When delegating a task that references files:

1. Check file size against `context.artifactSizeThresholdLines` (or use the category
   tables above as a heuristic).
2. If **full load**: pass the file content directly in the delegation prompt (or
   instruct the specialist to read it and the specialist will have full content).
3. If **path handle**: pass only the absolute file path and a targeted read
   instruction: "Read lines 45-80 of `docs/architecture.md` for the auth section."
4. Never pre-load large artifacts into governor context before delegation —
   this wastes governor tokens on content the governor will not directly reason over.

---

## Specialist Behavior Rule

When a specialist receives a path handle reference:

- Read only the lines relevant to the current subtask.
- Do NOT read the full file unless the subtask genuinely requires it.
- If the targeted section is insufficient, expand the read range incrementally
  (e.g., read an additional 50 lines) rather than loading the full file.

---

## False Economy Warning

Passing a path handle when the full file is small (< 200 lines) is a false economy:
it adds an extra `read_file` tool call without saving meaningful context tokens.
Use full loads freely for small files.
