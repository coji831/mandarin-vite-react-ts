# Pipeline 0: Router

**Signal:** explicit single-agent dispatch, quick-question with a known answering agent, targeted-fix with a known specialist

The Router pipeline dispatches a single agent directly without full pipeline overhead. The governor reads the request signal, matches it to the routing table below, and delegates once. No loop, no planner, no review stage — the user must explicitly request those if needed.

## Routing Table (static — OD-1 Option A)

| Signal type      | Example triggers                                                       | Target agent                        |
| ---------------- | ---------------------------------------------------------------------- | ----------------------------------- |
| `quick-question` | "what does X do", "explain Y", code lookup                             | Explore (read-only subagent)        |
| `targeted-fix`   | "fix line N in file X", single known location, no root cause ambiguity | Implementation Specialist           |
| `backend-fix`    | "fix this backend error", known backend location                       | Backend Implementation Specialist   |
| `frontend-fix`   | "fix this frontend error", known frontend location                     | Frontend Implementation Specialist  |
| `security-check` | "audit this for XSS", "check this route for auth issues"               | Security Auditor                    |
| `docs-update`    | "update the README", "add doc for X"                                   | Docs Curator                        |
| `test-repair`    | "fix this failing test", "add a test for X"                            | Backend or Frontend Test Specialist |

## Pipeline Stages

```
Governor
└─ Match signal to routing table entry
└─ Delegate to target agent (single call, no loop)
└─ Receive result
└─ Close (no ledger task required for quick-question; write brief ledger note for any code change)
```

## Bypass Conditions

- Router does NOT trigger for new features, epics, or any request that requires design decomposition → use Pipeline 4 (Feature).
- Router does NOT trigger for bug investigation requests with unknown root cause → use Pipeline 3 (Bug Fix).
- Router does NOT trigger when the governor judges that more than 2 files need changing → escalate to Pipeline 2 or 3.

Session-Type: `chat` throughout. No `/ralph-loop` for router dispatches.
