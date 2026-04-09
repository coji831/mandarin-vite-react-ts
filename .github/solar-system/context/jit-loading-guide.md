# JIT Context Loading Guide

Defines when the governor should pass a file path reference instead of loading
full file content into context, and which files are always loaded vs. always
referenced by path.

---

## Motivation

VS Code Copilot agents have a fixed context window. Every `read_file` call that
returns full content consumes context tokens. Large files loaded unnecessarily
accelerate instruction decay — instructions injected early in a session may
become unreliable as context fills.

JIT (Just-In-Time) loading treats large files as path handles: the governor
passes the file path to the receiving specialist, and the specialist loads the
file content only when it is directly needed for the current step.

---

## Line-Count Threshold

**Threshold:** 200 lines (`context.artifactSizeThresholdLines` in `solar.config.json`).

Files at or above this threshold should be treated as path references unless
the agent explicitly requires full content to complete its task.

Files below this threshold may be loaded in full without restriction.

**Config override:** Adjust `context.artifactSizeThresholdLines` in `solar.config.json`
to raise or lower the threshold based on observed session context pressure.

---

## Always-Loaded Files

These files are below threshold or are required at every pipeline stage. Load them
in full at the start of every relevant pipeline:

| File                              | Reason                                               |
| --------------------------------- | ---------------------------------------------------- |
| `.github/.ai_ledger.md`           | Session state — always needed for stage continuation |
| `solar.config.json`               | Mode and threshold configuration                     |
| `/memories/session/checkpoint.md` | Resumption safety — if it exists, always read first  |

Note: `.github/AGENTS.md` and `.github/copilot-instructions.md` are always-on
(platform-injected at every request) — do not read them explicitly.

---

## Always-Referenced Files (Path Handle Only)

These files are large or specialized. Pass the path to the specialist rather than
loading content into the governor's context:

| File pattern                                               | Why referenced, not loaded                             |
| ---------------------------------------------------------- | ------------------------------------------------------ |
| Story BR docs (`docs/business-requirements/**`)            | Large spec files; specialist loads the relevant story  |
| Story implementation docs (`docs/issue-implementation/**`) | Long history; specialist reads only what is needed     |
| Feature design docs (`src/features/**/docs/design.md`)     | Feature-specific; frontend/backend specialists load    |
| API spec files (`**/api-spec.md`)                          | Backend specialists read directly for their task scope |
| Skill files (`.github/skills/**/*.md`)                     | Skills load themselves at delegation (BLOCKING rule)   |
| Schema files (`solar-system/schemas/**`)                   | Read by the agent that needs schema validation         |
| `.github/solar-system/.learnings/ERRORS.md`                | Historical log; load only for Compound Review          |

---

## Governor Decision Rule

When building a delegation prompt for a specialist:

1. **Check the file size** relative to `context.artifactSizeThresholdLines`.
2. **If above threshold AND the governor does not itself need the content:**
   pass the file path in the delegation prompt:
   ```
   Read this file for context: path/to/file.md
   ```
3. **If below threshold OR the governor must reason over the content:**
   load with `read_file` before delegating.
4. **Never load skill files into the governor's context.** Specialists load their
   own skill files per the BLOCKING REQUIREMENT in agent instructions.

---

## Interaction with Context Compaction

When the governor triggers proactive ledger compaction (task count exceeds
`context.ledgerCompactionThreshold`), it must also:

1. Write `/memories/session/pre-compact-state.md` (in-progress todos + pipeline stage).
2. After compaction, treat all pre-compaction doc references as path handles.
   Do not reload large documentation files — the specialist will read them fresh.

---

_SOLAR-only — do not expose this file in project-facing instructions._
