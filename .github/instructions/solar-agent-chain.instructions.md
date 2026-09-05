# SOLAR v5 Agent Chain — self-chaining contract

> Loaded by every agent so chain runs work regardless of who is the entry.
> Trigger: your brief is a **SOLAR handoff with a `## Chain mode` section**
> (named chain run). If there is no `## Chain mode` section, this file does not
> apply — do your normal single-step job and return.

## The idea

A chain is a named, ordered list of specialists (`registry.json` → `chains`).
**Governor v5 (the coordinator) runs the links**: it dispatches each link in
order and threads the epic objective + prior outputs forward. You are ONE link:
do your step, return your deliverable to the coordinator, and let it run the
next link. Only if you have the **agent-spawn tool** available may you delegate
to your next link yourself. When you are run as a nested agent you will NOT
have that tool — in that case **stop cleanly after your step and return**.

> **NEVER fabricate downstream links "in-role"** to make it look like the chain
> ran. If you cannot spawn the next specialist, say so and return. The
> coordinator runs the real agents in order; a single agent composing the whole
> chain's output is the exact failure the harness exists to prevent.

## The chain (`epic`, default)

```
investigator -> architect -> uiux-designer -> (frontend-engineer + backend-engineer) -> docs-writer -> code-reviewer
```

- `A -> B` = after A finishes, the coordinator runs B (A does not need to).
- `(X + Y)` = a **parallel group**: run both members with the same brief, then
  continue.
- The chain is data in `.solar/registry.json` -> `chains` (read it if your
  handoff doesn't spell it out).

## Rules (non-negotiable)

1. **Do your own step first.** Follow your own agent definition and constraints.
2. **Delegate ONLY if you can spawn.** If you have the agent tool, you MAY run
   the next exact agent (name from the mapping below) with a brief carrying:
   (a) the ORIGINAL epic objective, (b) the upstream context you received, and
   (c) your own deliverable. If you do NOT have the agent tool, stop after your
   step and return — the coordinator runs the next link.
3. **Never fabricate.** Do not pretend to be, or compose output for, downstream
   specialists you cannot actually run. Return your own deliverable and stop.
4. **Parallel group:** if you have spawn capability, run each member with the
   SAME shared brief and merge; otherwise return and let the coordinator run the
   group.
5. **Last link returns the final.** When you are `code-reviewer` (next =
   complete), your output is the final result.
6. **Bubble the final up.** Whatever a downstream link returns is what you
   return to your caller. You may prepend a 1-2 line note on your own
   deliverable, but never truncate or replace the downstream final.
7. **Never loop.** Each role runs once per chain. If rework is needed, note it
   in the returned result — do not re-run an upstream role yourself.
8. **Carry context.** Pass file paths + links, not just prose, so the next
   specialist can open exactly what you produced.
9. **Human-owned gates stop you, not the governor.** If your role owns a human
   gate (UIUX Designer: the User Preview Gate — never auto-merge design), you
   stop at that gate and return `STATUS: AWAITING <gate>` + your deliverable
   paths so the caller can get the human's decision before the chain continues.
   That pause is a designed gate, not a governor bounce.

## Delegation mapping (exact agent names for the agent tool)

| Role (registry key) | After your step, run |
| ------------------- | -------------------- |
| `investigator`      | **Architect** |
| `architect`         | **UIUX Designer** |
| `uiux-designer`     | **Frontend Engineer** + **Backend Engineer**, then **Docs Writer** |
| `frontend-engineer` | (none — return to your caller) |
| `backend-engineer`  | (none — return to your caller) |
| `docs-writer`       | **Code Reviewer** |
| `code-reviewer`     | (none — your output IS the final result) |

## What a good final result contains

- What each link produced (1 line each) + file paths
- The epic objective restated as DONE / NOT DONE with evidence
- Verification status: tests / audits run and their outcome
- Open items or decisions the human must make

If you are a leaf (frontend/backend engineer) returning to your caller
(uiux-designer), return your deliverable summary + paths so the caller can
merge and continue.
