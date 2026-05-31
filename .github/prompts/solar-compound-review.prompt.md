---
name: solar-compound-review
description: Extract verified patterns from recent ledger tasks and promote them into LEARNINGS.md and AGENTS.md write-back rules.
agent: Orchestration Governor
---

# SOLAR Compound Review

Trigger this prompt to instruct the governor to extract verified patterns from recent
completed ledger tasks and promote them into `LEARNINGS.md` and `AGENTS.md`.

## When to Run

- After a multi-session work package closes
- When ERRORS.md has accumulated 3+ new entries since the last review
- When a recurring pattern or gotcha has been observed multiple times
- After a major architectural decision is validated in production

## Governor Instructions

You are running a SOLAR Compound Review. Follow these steps in order:

### Step 1 — Scan Recent Ledger History

Read `.github/.ai_ledger.md` and identify:

- All tasks completed since the last compound review entry in LEARNINGS.md
- Any tool failures recorded in `.github/solar-system/.learnings/ERRORS.md`
  since the last review date
- Any feature requests in FEATURE_REQUESTS.md that have been addressed or resolved

### Step 2 — Extract Promotable Patterns

For each completed task and error entry, identify patterns that meet ALL of:

- The pattern applies to future work (not just this one task)
- The pattern was non-obvious at the time (it corrected an assumption or revealed
  a project-specific convention)
- The pattern has been confirmed by at least one successful outcome

Patterns that are too specific to a single task do NOT qualify for LEARNINGS.md.

### Step 3 — Write Back to LEARNINGS.md

For each promotable pattern, append a new entry to
`.github/solar-system/.learnings/LEARNINGS.md` in the format:

```
### [TODAY'S DATE] [CATEGORY] — [SHORT TITLE]
**Learning:** <the verified fact, convention, or non-obvious solution>
**Context:** <where and when this applies>
**Source:** <ledger entry, task, or observation that confirmed this>
```

### Step 4 — Update Write-Back Rules (if applicable)

If any of the promotable patterns represent a new governance rule or delegation
pattern that the governor should follow in future sessions, add it to the
Self-Improvement Write-Back Rules section in `.github/instructions/solar.instructions.md`.

Only add governance rules that have been validated in at least one completed work
package. Do NOT add speculative rules.

### Step 5 — Archive Resolved ERRORS.md Entries

For each ERRORS.md entry that now has a corresponding LEARNINGS.md entry (i.e., the
corrective action has been promoted to a general rule), mark the ERRORS.md entry
as `[ARCHIVED]` in the header line. Do NOT delete error entries — they remain as
audit trail.

### Step 6 — Mark Review Complete

Add a comment line in LEARNINGS.md immediately before the new entries:

```
<!-- Compound Review completed: [DATE] — N patterns promoted -->
```

Add the same marker as a note in `.github/.ai_ledger.md` under the current session.

## Output

After completing all steps, print a summary:

- N patterns promoted to LEARNINGS.md
- N AGENTS.md governance rules updated
- N ERRORS.md entries archived
- Any patterns identified but NOT promoted (with reason)
