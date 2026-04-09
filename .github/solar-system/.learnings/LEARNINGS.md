# SOLAR Learnings

Positive learnings extracted from completed work sessions: confirmed conventions,
non-obvious solutions, project gotchas, and architectural decisions validated in
practice. Injected as condensed `additionalContext` by the `SessionStart` hook.

## How to Use

During Compound Review (`/solar-compound-review`) or when a verified fact is
discovered, add an entry using the format:

```
### [DATE] [CATEGORY] — [SHORT TITLE]
**Learning:** <the verified fact, convention, or non-obvious solution>
**Context:** <where and when this applies>
**Source:** <ledger entry, task, or observation that confirmed this>
```

Categories: `convention`, `architecture`, `tooling`, `pattern`, `gotcha`, `security`

The `SessionStart` hook reads this file and injects a condensed summary (up to 20
non-header lines) into each session's context so agents benefit from accumulated
knowledge without manual re-reading.

---

<!-- Entries appear below this line -->
