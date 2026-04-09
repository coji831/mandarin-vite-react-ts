# SOLAR Errors Log

Persistent log of agent-observed tool failures, implementation errors, and their
corrective actions. Maintained by the `PostToolUse` hook and governor write-back.

## How to Use

When the SOLAR `PostToolUse` hook surfaces an ERRORS.md write instruction after a
tool failure, record the entry below using the format:

```
### [DATE] [TOOL NAME] — [SHORT DESCRIPTION]
**Error:** <exact error message or behaviour observed>
**Context:** <what task was in progress>
**Root Cause:** <why the failure occurred>
**Corrective Action:** <what was done to resolve it>
**Prevention:** <rule or check to avoid recurrence>
```

Entries are reviewed during Compound Review (`/solar-compound-review`) and promoted
to `.learnings/LEARNINGS.md` if the corrective action is generally applicable.

---

<!-- Entries appear below this line -->
